import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { hideWindowOnClose, isWindowHiddenToTray, windowsTrayMenu } = require("../dist/windows-tray.js");

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

test("tracks a deliberately hidden window until it is explicitly shown", () => {
  const window = new EventEmitter();
  window.hide = () => {};
  hideWindowOnClose(window, () => true);
  assert.equal(isWindowHiddenToTray(window), false);
  window.emit("close", { preventDefault() {} });
  assert.equal(isWindowHiddenToTray(window), true);
  window.emit("show");
  assert.equal(isWindowHiddenToTray(window), false);
});

test("a cancelled shutdown query preserves close-to-tray but final session end allows closing", () => {
  const window = new EventEmitter();
  window.hide = () => {};
  hideWindowOnClose(window, () => true);
  window.emit("query-session-end", { preventDefault() {} });
  let prevented = false;
  window.emit("close", { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  window.emit("session-end");
  window.emit("close", { preventDefault() { assert.fail("Final session end must allow closing"); } });
});
