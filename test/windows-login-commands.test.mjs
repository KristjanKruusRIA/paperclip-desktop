import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { windowsLoginCommand, patchWindowsLoginCommands } from "../scripts/windows-login-commands.mjs";

test("patches the server's terminal commands and can run again safely", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "paperclip command patch "));
  try {
    const services = path.join(directory, "dist", "services");
    mkdirSync(services, { recursive: true });
    const file = path.join(services, "local-ai-login.js");
    writeFileSync(file, 'return { command: provider === "openai" ? "bash" : `(export GROK_HOME=example)`, };');
    patchWindowsLoginCommands(directory);
    const patched = readFileSync(file, "utf8");
    const command = new Function("provider", "directory", patched)("openai", "C:\\test home").command;
    assert.match(command, /New-Item/);
    assert.match(command, /codex login --device-auth/);
    assert.doesNotMatch(command, /export |&&/);
    patchWindowsLoginCommands(directory);
    assert.equal(readFileSync(file, "utf8"), patched);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

for (const [provider, variable, tool] of [["openai", "CODEX_HOME", "codex"], ["anthropic", "CLAUDE_CONFIG_DIR", "claude"], ["xai", "GROK_HOME", "grok"]]) {
  test(`PowerShell ${provider} login preserves its path and restores the existing home`, { skip: process.platform !== "win32" }, () => {
    const directory = mkdtempSync(path.join(tmpdir(), "paperclip login ' & % "));
    try {
      const script = `function ${tool} { Write-Output $env:${variable} }; $env:${variable} = 'previous'; ${windowsLoginCommand(provider, directory)}; Write-Output $env:${variable}`;
      const output = execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], { encoding: "utf8" }).trim().split(/\r?\n/);
      assert.deepEqual(output, [directory, "previous"]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
