import { createPackageWithOptions } from "@electron/asar";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

export async function archiveWindowsServer(serverDir, outputFile) {
  const output = path.resolve(outputFile);
  if (!output.endsWith(".asar") || path.dirname(output) !== path.dirname(path.resolve(serverDir))) {
    throw new Error("The server archive must be a .asar file beside the staged server directory.");
  }
  mkdirSync(path.dirname(output), { recursive: true });
  rmSync(output + ".unpacked", { recursive: true, force: true });
  await createPackageWithOptions(serverDir, output, {
    unpack: "**/*.{node,dll,exe,wasm,bare,bat,cmd,ps1,sh}",
    unpackDir: "**/{native,vendor,prebuilds,bin}",
  });
}

export default async function beforePack(context) {
  if (context.electronPlatformName !== "win32") return;
  const staging = path.join(context.packager.projectDir, "build", "server-bundle", "win-x64");
  console.log("[archive-server] Packing the Windows server and UI into server.asar...");
  await archiveWindowsServer(path.join(staging, "server"), path.join(staging, "server.asar"));
}
