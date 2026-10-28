import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isMissingReleaseFeedError } = require("../dist/update-feed.js");

test("recognizes unpublished releases and missing Windows manifests", () => {
  for (const code of ["ERR_UPDATER_NO_PUBLISHED_VERSIONS", "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND"]) {
    assert.equal(isMissingReleaseFeedError(Object.assign(new Error("No feed"), { code })), true);
  }
  assert.equal(isMissingReleaseFeedError({ statusCode: 404, message: "releases.atom" }), true);
  assert.equal(isMissingReleaseFeedError(new Error("No published versions on GitHub")), true);
});

test("does not hide network errors or missing installer downloads", () => {
  for (const error of [null, new Error("network timeout"), { statusCode: 404, message: "Setup.exe" }]) {
    assert.equal(isMissingReleaseFeedError(error), false);
  }
});
