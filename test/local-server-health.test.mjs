import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { probeLocalServerHealth, waitForLocalServerHealth } = require("../dist/connection/local-server-health.js");

test("startup waits through starting responses until the server is healthy", async () => {
  let probes = 0;
  await waitForLocalServerHealth({
    origin: "http://127.0.0.1:3100",
    timeoutMs: 1000,
    pollIntervalMs: 0,
    fetchImpl: async () => jsonResponse({ status: ++probes < 3 ? "starting" : "ok" }, probes < 3 ? 503 : 200),
  });
  assert.equal(probes, 3);
});

test("startup times out when the server never becomes healthy", async () => {
  await assert.rejects(waitForLocalServerHealth({
    origin: "http://127.0.0.1:3100",
    timeoutMs: 20,
    pollIntervalMs: 0,
    fetchImpl: async () => jsonResponse({ status: "starting" }, 200),
  }), /did not become ready.*starting/);
});

test("local server health probe accepts an ok health payload", async () => {
  const result = await probeLocalServerHealth({
    origin: "http://127.0.0.1:3100",
    fetchImpl: async () => jsonResponse({ status: "ok" }, 200),
  });

  assert.equal(result.ok, true);
  assert.equal(result.detail, undefined);
});

test("local server health probe rejects unhealthy payloads", async () => {
  const result = await probeLocalServerHealth({
    origin: "http://127.0.0.1:3100",
    fetchImpl: async () => jsonResponse({ status: "starting" }, 200),
  });

  assert.equal(result.ok, false);
  assert.match(result.detail, /starting/);
});

test("local server health probe reports transport failures", async () => {
  const result = await probeLocalServerHealth({
    origin: "http://127.0.0.1:3100",
    fetchImpl: async () => {
      throw new Error("socket hang up");
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.detail, /socket hang up/);
});

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
