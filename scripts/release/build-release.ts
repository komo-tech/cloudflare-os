#!/usr/bin/env node

// Builds an immutable release: every deployable worker bundled via `cf build` (delegates to the
// pinned wrangler bundler; modules collected from `.cloudflare/output/v1`), plus the Access-mode
// workshop-frontend asset build, plus the release manifest that describes it all.
//
// Output layout (mirrored to R2 by upload-release.ts):
//   <out>/manifest.json                    the release manifest (upload LAST — its presence
//                                          marks the release complete)
//   <out>/modules/<sha256>                 worker module blobs, content-addressed
//   <out>/assets/<cfHash>                  static asset blobs, content-addressed
//
// Usage: node scripts/release/build-release.ts --out <dir> [--release-id <id>]

import { execFileSync, type ExecFileSyncOptions } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCfCommand } from "../cf-cli.ts";
import {
  collectAssets, collectCfBuildModules, stableStringify, type CollectedAssets,
} from "./hash-lib.ts";
import {
  findDeployablePackages, generateManifest, readDeployInputs, readWranglerConfig,
  type WorkerBuild,
} from "./manifest-lib.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PACKAGES_DIR = join(ROOT, "packages");
const FRONTEND_DIR = join(PACKAGES_DIR, "workshop-frontend");

function parseArgs(argv: string[]): { out: string; releaseId: string | undefined } {
  let out: string | undefined;
  let releaseId: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = resolve(argv[++i]);
    else if (argv[i] === "--release-id") releaseId = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!out) throw new Error("--out <dir> is required");
  return { out, releaseId };
}

function run(command: string, argv: string[], options: ExecFileSyncOptions = {}) {
  console.log(`running: ${command} ${argv.join(" ")} ${options.cwd ? `(in ${options.cwd})` : ""}`);
  execFileSync(command, argv, { stdio: "inherit", cwd: ROOT, ...options });
}

function gitCommit(): string {
  return process.env.CI_COMMIT_SHA
      || execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
}

function defaultReleaseId(commit: string): string {
  // CI: GitLab pipeline IID + short SHA. Local: timestamped dev release, unique per build so
  // every upload stays immutable in R2. "Latest" is decided by the deploy service from upload
  // time, and the commit is in the manifest's `commit` field. Kept short: worker version tags
  // (`gd:<id>:<fp8>`) have a hard 25-char cap downstream.
  //
  // CI_PIPELINE_IID (per-project, monotonic), NOT CI_PIPELINE_ID (instance-global): run numbers
  // are compared by promote-release.ts's supersededBy() guard, so they must form one monotonic
  // sequence from a single publisher.
  const runNumber = process.env.CI_PIPELINE_IID;
  if (runNumber) return `r${runNumber.padStart(6, "0")}-${commit.slice(0, 7)}`;
  return `dev-${Math.floor(Date.now() / 1000).toString(36)}`;
}

function pinnedToolVersions(): { cfVersion: string; wranglerVersion: string } {
  const cfPkg = JSON.parse(
      readFileSync(join(ROOT, "node_modules", "cf", "package.json"), "utf8")) as { version: string };
  const wranglerPkg = JSON.parse(
      readFileSync(join(ROOT, "node_modules", "wrangler", "package.json"), "utf8")) as
      { version: string };
  return { cfVersion: cfPkg.version, wranglerVersion: wranglerPkg.version };
}

// Builds the Access-mode frontend (VITE_CF_ACCESS_MODE is a build-time flag,
// workshop-frontend/src/useAuth.ts) — the one asset variant every release carries.
//
// Through vp rather than a package script: `build` is a task, so there is no script to run, and the
// task declares VITE_* as fingerprinted env — a release built at a different flag value is a cache
// miss rather than a stale replay.
function buildFrontend(): CollectedAssets {
  const env = { ...process.env, VITE_CF_ACCESS_MODE: "true" };
  run("pnpm", ["exec", "vp", "run", "-F", "@gadgets/workshop-frontend", "build"], { env });
  return collectAssets(join(FRONTEND_DIR, "dist"));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const commit = gitCommit();
  const releaseId = args.releaseId ?? defaultReleaseId(commit);
  const { cfVersion, wranglerVersion } = pinnedToolVersions();
  console.log(`building release ${releaseId} (commit ${commit}, cf ${cfVersion}, wrangler ` +
      `${wranglerVersion})`);

  rmSync(args.out, { recursive: true, force: true });
  mkdirSync(join(args.out, "modules"), { recursive: true });
  mkdirSync(join(args.out, "assets"), { recursive: true });

  // 1. Frontend first: the router's wrangler.jsonc points its assets directory at
  //    workshop-frontend/dist, so it must exist before the router's dry-run.
  const assetVariants = {
    access: buildFrontend(),
  };
  for (const { blobs } of Object.values(assetVariants)) {
    for (const [hash, blob] of blobs) {
      writeFileSync(join(args.out, "assets", hash), blob.bytes);
    }
  }

  // 2. Bundle every deployable package via `cf build`, without uploading.
  //    Run from each package dir so custom build commands (capnweb-validate) resolve their bins.
  const workers: WorkerBuild[] = [];
  for (const pkg of findDeployablePackages(PACKAGES_DIR)) {
    const [cfCommand, cfArgv] = resolveCfCommand(pkg.dir, ["build"]);
    run(cfCommand, cfArgv, { cwd: pkg.dir });
    const { mainModule, modules } = collectCfBuildModules(pkg.dir);
    for (const mod of modules) {
      writeFileSync(join(args.out, "modules", mod.sha256), mod.bytes);
    }
    workers.push({
      pkgName: pkg.name,
      config: readWranglerConfig(pkg.dir),
      mainModule,
      modules,
      deployInputs: readDeployInputs(pkg.dir),
    });
  }

  // 3. The manifest ties it together. Written last locally too, mirroring the R2 upload order
  //    (manifest presence == release complete).
  const manifest = generateManifest({
    releaseId,
    commit,
    createdAt: new Date().toISOString(),
    cfVersion,
    wranglerVersion,
    workers,
    assetVariants,
  });
  writeFileSync(join(args.out, "manifest.json"), stableStringify(manifest) + "\n");
  const moduleCount = workers.reduce((n, w) => n + w.modules.length, 0);
  console.log(`\nrelease ${releaseId}: ${workers.length} workers, ${moduleCount} modules, ` +
      `${Object.keys(manifest.assets).length} unique asset blobs -> ${args.out}`);
}

main();
