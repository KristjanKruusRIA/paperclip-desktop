import { pathToFileURL } from "node:url";
import { installAsarNativePathSupport } from "./asar-native-paths.mjs";

if (process.versions.electron && /\.asar[\\/]/.test(process.argv[2])) {
  installAsarNativePathSupport();
}

// Call the API explicitly: pnpm links and Windows path casing can prevent the
// upstream entrypoint's import.meta.url comparison from recognizing itself.
console.error("[server-entry] Loading Paperclip server...");
const { startServer } = await import(pathToFileURL(process.argv[2]).href);
console.error("[server-entry] Starting Paperclip server...");
await startServer();
