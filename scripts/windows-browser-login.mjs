import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export function resolveWindowsCodexExecutable(command) {
  if (!/\.m?js$/i.test(command)) return command;
  const lookup = command.replace(/\.asar\.unpacked([\\/])/, ".asar$1");
  const manifest = createRequire(lookup).resolve(`@openai/codex-win32-${process.arch}/package.json`);
  const target = process.arch === "arm64" ? "aarch64-pc-windows-msvc" : "x86_64-pc-windows-msvc";
  return path.join(path.dirname(manifest), "vendor", target, "bin", "codex.exe");
}

// The native CLIs own their browser flow and write credentials to the isolated home.
export function startWindowsBrowserLogin(provider, home, executable, spawnProcess = spawn) {
  let child;
  const state = {
    abort() {
      if (!child?.pid || state.outcome) return;
      state.outcome = "failure";
      spawnProcess("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true, stdio: "ignore",
      }).once("error", () => child.kill());
    },
  };
  const command = provider === "anthropic" ? "auth login" : "login --device-auth";
  const login = Buffer.from(`$ErrorActionPreference = 'Stop'; & $env:PAPERCLIP_LOGIN_EXECUTABLE ${command}; exit $LASTEXITCODE`, "utf16le").toString("base64");
  const launcher = Buffer.from(`$ErrorActionPreference = 'Stop'; $terminal = Start-Process -FilePath "$env:SystemRoot\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -ArgumentList @('-NoProfile', '-EncodedCommand', '${login}') -WindowStyle Normal -PassThru; $null = $terminal.Handle; $terminal.WaitForExit(); exit $terminal.ExitCode`, "utf16le").toString("base64");
  const env = {
    ...process.env,
    ANTHROPIC_API_KEY: "", ANTHROPIC_AUTH_TOKEN: "", CLAUDE_CODE_OAUTH_TOKEN: "",
    OPENAI_API_KEY: "", CODEX_API_KEY: "",
    [provider === "anthropic" ? "CLAUDE_CONFIG_DIR" : "CODEX_HOME"]: home,
    PAPERCLIP_LOGIN_EXECUTABLE: executable.replace(/\.asar([\\/])/, ".asar.unpacked$1"),
  };
  delete env.BROWSER;
  child = spawnProcess("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", launcher], {
    env, windowsHide: true, stdio: "ignore",
  });
  child.once("error", () => {
    state.error = "Could not open the Windows sign-in terminal. Ensure Windows PowerShell is available, then start sign-in again.";
    state.outcome = "failure";
  });
  child.once("close", (code) => {
    if (state.outcome) return;
    state.outcome = code === 0 ? "success" : "failure";
    if (code !== 0) state.error = "Sign-in ended before completion. Ensure the provider CLI is installed, then start sign-in again.";
  });
  return state;
}

export function patchWindowsBrowserLogin(serverDir) {
  const file = path.join(serverDir, "dist", "services", "local-ai-browser-login.js");
  const source = readFileSync(file, "utf8");
  if (source.includes("function startWindowsBrowserLogin(")) return;
  const entry = "export function startLocalBrowserLogin(provider, home) {";
  if (!source.includes(entry) || !source.includes("resolveCodexCommand")) {
    throw new Error("Unsupported Paperclip browser login format.");
  }
  const patched = 'import { createRequire } from "node:module";\n' + source.replace(entry, `${resolveWindowsCodexExecutable.toString()}\n\n${startWindowsBrowserLogin.toString()}\n\n${entry}\n    if (process.platform === "win32") {\n        return startWindowsBrowserLogin(provider, home, provider === "anthropic" ? "claude" : resolveWindowsCodexExecutable(resolveCodexCommand()));\n    }`);
  // Replace rather than mutate pnpm's hard-linked package store.
  writeFileSync(`${file}.desktop-tmp`, patched);
  renameSync(`${file}.desktop-tmp`, file);
}
