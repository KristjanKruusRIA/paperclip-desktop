import type { BrowserWindow, MenuItemConstructorOptions } from "electron";

export function hideWindowOnClose(
  window: Pick<BrowserWindow, "on" | "hide">,
  shouldHide: () => boolean,
): void {
  window.on("close", (event) => {
    if (shouldHide()) {
      event.preventDefault();
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
