export function isMissingReleaseFeedError(err: unknown): boolean {
  if (typeof err === "string") {
    return err.includes("releases.atom") && err.includes("404");
  }
  if (!err || typeof err !== "object") return false;
  const error = err as { code?: string; statusCode?: number; message?: string; stack?: string };
  return error.code === "ERR_UPDATER_NO_PUBLISHED_VERSIONS" ||
    error.code === "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND" ||
    error.message === "No published versions on GitHub" ||
    (error.statusCode === 404 && `${error.message ?? ""} ${error.stack ?? ""}`.includes("releases.atom"));
}
