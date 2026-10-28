import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { windowsStartupMenuItem } = require("../dist/windows-startup.js");

test("startup menu reads the installed executable and registers the selected state", () => {
  let settings;
  const app = {
    isPackaged: true,
    getLoginItemSettings(options) {
      assert.deepEqual(options, { path: process.execPath, args: [] });
      return { openAtLogin: true };
    },
    setLoginItemSettings(options) { settings = options; },
  };
  const item = windowsStartupMenuItem(app);
  assert.equal(item.checked, true);
  item.click({ checked: false });
  assert.deepEqual(settings, { name: "com.paperclipai.app", path: process.execPath, args: [], openAtLogin: false });
  item.click({ checked: true });
  assert.equal(settings.openAtLogin, true);
});

test("development builds cannot register the development Electron executable", () => {
  const item = windowsStartupMenuItem({ isPackaged: false });
  assert.equal(item.enabled, false);
  assert.equal(item.checked, false);
});
