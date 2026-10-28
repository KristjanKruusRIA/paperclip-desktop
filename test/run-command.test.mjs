import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { runCommandSync } from "../scripts/run-command.mjs";

test("runs npm through the Windows command shim", () => {
  const version = runCommandSync("npm", ["--version"], { encoding: "utf8" });
  assert.match(version.trim(), /^\d+\.\d+\.\d+/);
});

test("runs pnpm through its JavaScript entrypoint", () => {
  const version = runCommandSync("pnpm", ["--version"], { encoding: "utf8" });
  assert.match(version.trim(), /^\d+\.\d+\.\d+/);
});

for (const directory of ["trial with spaces", "work&trial", "%PAPERCLIP_ARGUMENT_TEST%", "work & %PAPERCLIP_ARGUMENT_TEST% trial"]) {
  test(`preserves literal npm path argument: ${directory}`, () => {
    const prefix = path.join(os.tmpdir(), directory);
    const actual = runCommandSync("npm", ["prefix", "--prefix", prefix], {
      encoding: "utf8",
      env: { ...process.env, PAPERCLIP_ARGUMENT_TEST: "expanded-unexpectedly" },
    });
    assert.equal(actual.trim(), prefix);
  });
}
