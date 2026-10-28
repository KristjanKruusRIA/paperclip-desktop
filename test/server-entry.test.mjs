import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(new URL("../scripts/server-entry.mjs", import.meta.url));

test("starts a server whose entrypoint does not auto-start when imported", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "paperclip server "));
  try {
    const server = path.join(dir, "server.mjs");
    writeFileSync(server, 'export async function startServer() { console.log("started"); }');
    assert.equal(execFileSync(process.execPath, [entry, server], { encoding: "utf8" }).trim(), "started");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
