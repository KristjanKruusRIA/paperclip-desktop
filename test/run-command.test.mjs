import test from "node:test";
import assert from "node:assert/strict";
import { runCommandSync } from "../scripts/run-command.mjs";

test("runs npm through the Windows command shim", () => {
  const version = runCommandSync("npm", ["--version"], { encoding: "utf8" });
  assert.match(version.trim(), /^\d+\.\d+\.\d+/);
});
