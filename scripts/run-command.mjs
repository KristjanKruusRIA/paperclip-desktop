import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
      const shimEntrypoint = path.extname(location).toLowerCase() === ".cmd"
        ? readFileSync(location, "utf8").match(/%~dp0([^"\r\n]*pnpm\.(?:cjs|mjs))/i)?.[1]
        : undefined;
      for (const candidate of [
        ...(shimEntrypoint ? [path.resolve(path.dirname(location), shimEntrypoint)] : []),
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
