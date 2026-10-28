#!/usr/bin/env node

/**
 * Dev script: compiles TypeScript then launches Electron.
 *
 * In dev mode, the server is spawned from the npm-installed
 * @paperclipai/server package. The UI may not be available unless you
 * run `pnpm pack` first for a full integration test.
 *
 * Usage: node scripts/dev.mjs
 */

import { execSync, spawn } from "node:child_process";
import electron from "electron";
import { patchWindowsLoginCommands } from "./windows-login-commands.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

if (process.platform === "win32") {
  patchWindowsLoginCommands(path.join(projectRoot, "node_modules", "@paperclipai", "server"));
}

// 1. Compile TS
console.log("[dev] Compiling TypeScript...");
execSync("npx tsc", { cwd: projectRoot, stdio: "inherit" });

// 2. Launch Electron
console.log("[dev] Starting Electron...");
const child = spawn(electron, [path.join(projectRoot, "dist", "main.js")], {
  cwd: projectRoot,
  stdio: "inherit",
  env: { ...process.env },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
