import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import afterPack from "../scripts/after-pack.mjs";

test("copies every unpacked archive companion without package-file filtering", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "paperclip unpacked "));
  const source = path.join(root, "build/server-bundle/win-x64/server.asar.unpacked");
  const output = path.join(root, "output");
  const files = ["node_modules/adapter/dist/auth.sh", "node_modules/cli/vendor/bin/tool.exe", "node_modules/pg/native/share/data.sample"];
  try {
    for (const relative of files) {
      const file = path.join(source, relative);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, relative);
    }
    await afterPack({ electronPlatformName: "win32", appOutDir: output, packager: { projectDir: root } });
    for (const relative of files) {
      assert.equal(readFileSync(path.join(output, "resources/app-server/server.asar.unpacked", relative), "utf8"), relative);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
