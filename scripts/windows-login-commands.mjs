import { readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";

export function windowsLoginCommand(provider, directory) {
  const [variable, command] = provider === "openai"
    ? ["CODEX_HOME", "codex login --device-auth"]
    : provider === "anthropic"
      ? ["CLAUDE_CONFIG_DIR", "claude auth login"]
      : ["GROK_HOME", "grok login --device-auth"];
  const quoted = `'${directory.replaceAll("'", "''")}'`;
  return `& { $paperclipPreviousHome = $env:${variable}; try { $env:${variable} = ${quoted}; New-Item -ItemType Directory -Force -Path $env:${variable} | Out-Null; ${command} } finally { $env:${variable} = $paperclipPreviousHome } }`;
}

export function patchWindowsLoginCommands(serverDir) {
  const file = path.join(serverDir, "dist", "services", "local-ai-login.js");
  const source = readFileSync(file, "utf8");
  if (source.includes("$paperclipPreviousHome")) return;
  const browserLogin = source.includes('...(provider === "xai"');
  const original = browserLogin
    ? /command: `\(export GROK_HOME=[^`]+`/
    : /command: provider === "openai"[\s\S]*?: `\(export GROK_HOME=[^\n]+,/;
  if (!original.test(source)) throw new Error("Unsupported Paperclip local login command format.");
  // Replace the file so pnpm's hard-linked package store stays unchanged.
  const patchedFile = `${file}.desktop-tmp`;
  writeFileSync(patchedFile, source.replace(original, () => `command: (${windowsLoginCommand.toString()})(provider, directory)${browserLogin ? "" : ","}`));
  renameSync(patchedFile, file);
}
