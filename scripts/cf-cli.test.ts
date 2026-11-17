import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { resolveCfCommand } from "./cf-cli.ts";

const workspaceRoot = realpathSync(join(dirname(fileURLToPath(import.meta.url)), ".."));

describe("resolveCfCommand", () => {
  it("resolves cf from the workspace root", () => {
    const [command, argv] = resolveCfCommand(workspaceRoot, ["--version"]);
    assert.match(command, /node$/);
    assert.equal(argv.at(-1), "--version");
    assert.match(argv[0] ?? "", /cf/);
  });
});