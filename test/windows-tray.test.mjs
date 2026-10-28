import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { hideWindowOnClose, windowsTrayMenu } = require("../dist/windows-tray.js");

test("closing a window hides it while background work continues", () => {
  const window = new EventEmitter();
  let hidden = false;
  let prevented = false;
  window.hide = () => { hidden = true; };
  hideWindowOnClose(window, () => true);
  window.emit("close", { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(hidden, true);
});

test("explicit quit or an unavailable tray allows the window to close", () => {
  const window = new EventEmitter();
  window.hide = () => { assert.fail("Quit must not hide the window"); };
  hideWindowOnClose(window, () => false);
  window.emit("close", { preventDefault() { assert.fail("Quit must be allowed"); } });
});

test("tray actions restore the app and explicitly quit it", () => {
  const actions = [];
  const menu = windowsTrayMenu(() => actions.push("open"), () => actions.push("quit"));
  menu.find(item => item.label === "Open Paperclip").click();
  menu.find(item => item.label === "Quit").click();
  assert.deepEqual(actions, ["open", "quit"]);
});
