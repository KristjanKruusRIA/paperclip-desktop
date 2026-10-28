import type { BrowserWindow, MenuItemConstructorOptions } from "electron";

const hiddenWindows = new WeakSet<object>();

export function isWindowHiddenToTray(window: object): boolean {
  return hiddenWindows.has(window);
}

export function hideWindowOnClose(
  window: Pick<BrowserWindow, "on" | "hide">,
  shouldHide: () => boolean,
): void {
  let sessionEnded = false;
  window.on("session-end", () => { sessionEnded = true; });
  window.on("show", () => { hiddenWindows.delete(window); });
  window.on("close", (event) => {
    if (!sessionEnded && shouldHide()) {
      event.preventDefault();
      hiddenWindows.add(window);
      window.hide();
    }
  });
}

export function windowsTrayMenu(open: () => void, quit: () => void): MenuItemConstructorOptions[] {
  return [
    { label: "Open Paperclip", click: open },
    { type: "separator" },
    { label: "Quit", click: quit },
  ];
}
