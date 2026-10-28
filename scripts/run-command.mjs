import { execFileSync, execSync } from "node:child_process";

export function runCommandSync(command, args, options = {}) {
  if (process.platform === "win32") {
    const commandLine = [command, ...args]
      .map((argument) => {
        const value = String(argument);
        return /\s/.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
      })
      .join(" ");
    return execSync(commandLine, options);
  }

  return execFileSync(command, args, options);
}
