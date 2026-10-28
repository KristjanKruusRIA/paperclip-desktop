import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { spawn as nativeSpawn, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { startWindowsBrowserLogin, resolveWindowsCodexExecutable, patchWindowsBrowserLogin } from "../scripts/windows-browser-login.mjs";

test("resolves the native Codex executable instead of asking Windows to run its JS wrapper", () => {
  const root = mkdtempSync(path.join(tmpdir(), "paperclip native codex "));
  try {
    const cli = path.join(root, "node_modules/@openai/codex/bin/codex.js");
    const native = path.join(root, `node_modules/@openai/codex-win32-${process.arch}`);
    mkdirSync(path.dirname(cli), { recursive: true });
    mkdirSync(native, { recursive: true });
    writeFileSync(cli, "// CLI wrapper");
    writeFileSync(path.join(native, "package.json"), JSON.stringify({ name: `@openai/codex-win32-${process.arch}` }));
    assert.equal(resolveWindowsCodexExecutable(cli), path.join(native, "vendor", process.arch === "arm64" ? "aarch64-pc-windows-msvc" : "x86_64-pc-windows-msvc", "bin/codex.exe"));
    assert.equal(resolveWindowsCodexExecutable("codex.exe"), "codex.exe");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const provider of ["anthropic", "openai"]) {
  test(`${provider} uses a visible native terminal and an isolated credential home`, () => {
    const calls = [];
    const child = Object.assign(new EventEmitter(), { pid: 12345, exitCode: null });
    const spawn = (...args) => { calls.push(args); return child; };
    const home = "C:\\Users\\O'Hara & %test%\\isolated login";
    const executable = "C:\\Paperclip\\server.asar\\vendor\\cli.exe";
    const state = startWindowsBrowserLogin(provider, home, executable, spawn);
    const [command, args, options] = calls[0];
    assert.equal(command, "powershell.exe");
    const launcher = Buffer.from(args.at(-1), "base64").toString("utf16le");
    assert.match(launcher, /Start-Process/);
    assert.match(launcher, /-WindowStyle Normal/);
    const encoded = launcher.match(/'-EncodedCommand', '([A-Za-z0-9+/=]+)'/)[1];
    const login = Buffer.from(encoded, "base64").toString("utf16le");
    assert.match(login, provider === "anthropic" ? /auth login/ : /login --device-auth/);
    assert.equal(options.env[provider === "anthropic" ? "CLAUDE_CONFIG_DIR" : "CODEX_HOME"], home);
    assert.equal(options.env.PAPERCLIP_LOGIN_EXECUTABLE, "C:\\Paperclip\\server.asar.unpacked\\vendor\\cli.exe");
    assert.equal(options.env.ANTHROPIC_API_KEY, "");
    assert.equal(options.env.CLAUDE_CODE_OAUTH_TOKEN, "");
    assert.equal(options.env.OPENAI_API_KEY, "");
    assert.equal(options.env.BROWSER, undefined);
    assert.equal(options.stdio, "ignore", "Provider output must not enter server logs");
    assert.equal(options.windowsHide, true, "Only the interactive terminal should appear");
    child.emit("close", 0);
    assert.equal(state.outcome, "success");
  });
}

test("cancelling sign-in stops only its own terminal process tree", () => {
  const calls = [];
  const child = Object.assign(new EventEmitter(), { pid: 12345, exitCode: null });
  const state = startWindowsBrowserLogin("anthropic", "C:\\isolated", "claude", (...args) => { calls.push(args); return child; });
  state.abort();
  assert.deepEqual(calls[1].slice(0, 2), ["taskkill.exe", ["/PID", "12345", "/T", "/F"]]);
});

test("a missing terminal reports an actionable error without retaining provider output", () => {
  const child = Object.assign(new EventEmitter(), { pid: undefined, exitCode: null });
  const state = startWindowsBrowserLogin("anthropic", "C:\\isolated", "claude", () => child);
  child.emit("error", new Error("unavailable"));
  assert.equal(state.outcome, "failure");
  assert.match(state.error, /PowerShell/);
});

test("patches the Windows entry path without replacing the Unix browser driver", () => {
  const root = mkdtempSync(path.join(tmpdir(), "paperclip browser patch "));
  try {
    mkdirSync(path.join(root, "dist/services"), { recursive: true });
    const file = path.join(root, "dist/services/local-ai-browser-login.js");
    writeFileSync(file, 'import { spawn } from "node:child_process";\nfunction resolveCodexCommand() {}\nexport function startLocalBrowserLogin(provider, home) {\nreturn "original Unix driver";\n}\n');
    patchWindowsBrowserLogin(root);
    const source = readFileSync(file, "utf8");
    assert.match(source, /process.platform === "win32"/);
    assert.match(source, /return startWindowsBrowserLogin/);
    assert.match(source, /original Unix driver/);
    patchWindowsBrowserLogin(root);
    assert.equal(readFileSync(file, "utf8"), source);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Windows terminal runs the CLI with real console handles and preserves a quoted home", { skip: process.platform !== "win32", timeout: 30_000 }, async () => {
  const home = mkdtempSync(path.join(tmpdir(), "paperclip auth ' & % "));
  const executable = path.join(home, "probe.exe");
  const source = `using System; using System.IO;
    public class Probe { public static int Main(string[] args) {
      File.WriteAllText(Path.Combine(Environment.GetEnvironmentVariable("CLAUDE_CONFIG_DIR"), "probe.txt"),
        string.Join(" ", args) + "\\n" + Console.IsInputRedirected + "\\n" + Console.IsOutputRedirected);
      return 0;
    } }`;
  try {
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `Add-Type -TypeDefinition @'\n${source}\n'@ -OutputAssembly $env:PAPERCLIP_PROBE_EXE -OutputType ConsoleApplication`], {
      env: { ...process.env, PAPERCLIP_PROBE_EXE: executable }, windowsHide: true, stdio: "pipe",
    });
    const state = startWindowsBrowserLogin("anthropic", home, executable, (command, args, options) => {
      // Exercise the actual launcher without flashing a test console on the desktop.
      const script = Buffer.from(args.at(-1), "base64").toString("utf16le").replace("-WindowStyle Normal", "-WindowStyle Hidden");
      return nativeSpawn(command, [...args.slice(0, -1), Buffer.from(script, "utf16le").toString("base64")], options);
    });
    const deadline = Date.now() + 20_000;
    while (!state.outcome && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(state.outcome, "success", state.error);
    assert.equal(readFileSync(path.join(home, "probe.txt"), "utf8"), "auth login\nFalse\nFalse");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
