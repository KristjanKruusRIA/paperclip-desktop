import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export function runCommandSync(command, args, options = {}) {
  if (process.platform === "win32" && (command === "npm" || command === "pnpm")) {
    const entrypoint = command === "npm" ? "npm-cli.js" : "pnpm.cjs";
    const env = options.env ?? process.env;
    // Run the shim's JavaScript entrypoint directly. cmd.exe expands %VAR%
    // even inside quotes, so shell serialization cannot preserve these paths.
    if (env.npm_execpath && path.basename(env.npm_execpath) === entrypoint) {
      return execFileSync(process.execPath, [env.npm_execpath, ...args], options);
    }
    const locations = execFileSync("where.exe", [command], { encoding: "utf8", env })
      .trim().split(/\r?\n/);
    for (const location of locations) {
      if (path.extname(location).toLowerCase() === ".exe") {
        return execFileSync(location, args, options);
      }
      for (const candidate of [
        path.join(path.dirname(location), "node_modules", command, "bin", entrypoint),
        path.resolve(path.dirname(location), "..", command, "bin", entrypoint),
        path.join(path.dirname(location), entrypoint),
      ]) {
        if (existsSync(candidate)) {
          return execFileSync(process.execPath, [candidate, ...args], options);
        }
      }
    }
    throw new Error(`Cannot locate the ${command} JavaScript entrypoint on PATH.`);
  }

  return execFileSync(command, args, options);
}
