import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { extractFile } from "@electron/asar";
import { archiveWindowsServer } from "../scripts/archive-windows-server.mjs";

test("archives JavaScript and retains native companion files outside the archive", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "paperclip archive "));
  const server = path.join(root, "server");
  const output = path.join(root, "server.asar");
  function file(relative, contents) {
    const target = path.join(server, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  try {
    file("dist/index.js", "server code");
    file("ui-dist/index.html", "UI");
    file("node_modules/pg/native/bin/postgres.exe", "program");
    file("node_modules/pg/native/share/postgres.bki", "native data");
    file("node_modules/addon/lib/addon.node", "addon");
    await archiveWindowsServer(server, output);
    assert.equal(extractFile(output, "dist/index.js").toString(), "server code");
    assert.equal(extractFile(output, "ui-dist/index.html").toString(), "UI");
    assert.equal(existsSync(output + ".unpacked/dist/index.js"), false);
    assert.equal(readFileSync(output + ".unpacked/node_modules/pg/native/bin/postgres.exe", "utf8"), "program");
    assert.equal(readFileSync(output + ".unpacked/node_modules/pg/native/share/postgres.bki", "utf8"), "native data");
    assert.equal(readFileSync(output + ".unpacked/node_modules/addon/lib/addon.node", "utf8"), "addon");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
