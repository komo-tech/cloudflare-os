// Locate the JS entry point behind `node_modules/.bin/cf`, so a tool can be spawned as
// `node <entry>` rather than reached through `pnpm exec` — same rationale as bin-entry.ts.

import { resolveBinEntry } from "./bin-entry.ts";
import { pnpmCommand } from "./pnpm-command.ts";

/**
 * Resolve how to spawn the `cf` CLI from `rootDir`, returning `[command, argv]` suitable for
 * `spawn` / `execFileSync`. Falls back to `pnpm exec cf` when the package has no local install.
 */
export function resolveCfCommand(rootDir: string, args: string[]): [command: string, argv: string[]] {
  const entry = resolveBinEntry(rootDir, "cf");
  if (entry) return [process.execPath, [entry, ...args]];
  return pnpmCommand(["exec", "cf", ...args]);
}