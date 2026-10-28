import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { resolveUnpackedPath, installAsarNativePathSupport } from "../scripts/asar-native-paths.mjs";

test("redirects existing unpacked native paths without changing other paths", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "paperclip native "));
  const unpacked = path.join(root, "server.asar.unpacked", "native");
  mkdirSync(unpacked, { recursive: true });
  const actual = path.join(unpacked, "program.exe");
  const virtual = path.join(root, "server.asar", "native", "program.exe");
  writeFileSync(actual, "native");
  try {
    assert.equal(resolveUnpackedPath(virtual), actual);
    assert.equal(resolveUnpackedPath(actual), actual);
    assert.equal(resolveUnpackedPath(path.join(root, "server.asar", "code.js")), path.join(root, "server.asar", "code.js"));
    installAsarNativePathSupport();
    await fs.promises.chmod(virtual, 0o600);
    fs.chmodSync(virtual, 0o600);
    if (process.platform === "win32") {
      copyFileSync(process.env.ComSpec, actual);
      const result = spawnSync(virtual, ["/c", "echo", "archive-native"], { encoding: "utf8" });
      assert.equal(result.status, 0, result.error?.message);
      assert.match(result.stdout, /archive-native/);
      const call = promisify(execFile)(virtual, ["/c", "echo", "archive-async"], { encoding: "utf8" });
      const output = await call;
      assert.match(output.stdout, /archive-async/);
      assert.equal(output.stderr, "");
      assert.ok(call.child);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
