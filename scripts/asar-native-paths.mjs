import childProcess from "node:child_process";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { promisify } from "node:util";

export function resolveUnpackedPath(value) {
  if (typeof value !== "string") return value;
  const candidate = value.replace(/\.asar([\\/])/, ".asar.unpacked$1");
  return candidate !== value && fs.existsSync(candidate) ? candidate : value;
}

export function installAsarNativePathSupport() {
  // Native programs and permission changes require actual filesystem paths.
  for (const name of ["spawn", "spawnSync", "execFile", "execFileSync"]) {
    const original = childProcess[name];
    const wrapped = (command, ...args) => original(resolveUnpackedPath(command), ...args);
    if (original[promisify.custom]) {
      wrapped[promisify.custom] = (command, ...args) => original[promisify.custom](resolveUnpackedPath(command), ...args);
    }
    childProcess[name] = wrapped;
  }
  for (const name of ["chmod", "chmodSync"]) {
    const original = fs[name];
    fs[name] = (file, ...args) => original(resolveUnpackedPath(file), ...args);
  }
  const chmod = fs.promises.chmod;
  fs.promises.chmod = (file, ...args) => chmod(resolveUnpackedPath(file), ...args);
  syncBuiltinESMExports();
}
