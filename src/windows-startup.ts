import type { App, MenuItemConstructorOptions } from "electron";

export function windowsStartupMenuItem(app: Pick<App, "isPackaged" | "getLoginItemSettings" | "setLoginItemSettings">): MenuItemConstructorOptions {
  const executable = { path: process.execPath, args: [] as string[] };
  return {
    label: "Start at Windows sign-in",
    type: "checkbox",
    enabled: app.isPackaged,
    checked: app.isPackaged && app.getLoginItemSettings(executable).openAtLogin,
    click: (menuItem) => {
      app.setLoginItemSettings({
        ...executable,
        name: "com.paperclipai.app",
        openAtLogin: menuItem.checked,
      });
    },
  };
}
