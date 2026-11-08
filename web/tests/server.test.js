"use strict";

// Dependency-free route tests for the static website server.
// Run with: node --test web/tests/server.test.js

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { createHash } = require("node:crypto");
const path = require("node:path");

const PORT = 4123;
const BASE = `http://127.0.0.1:${PORT}`;
const LOGO_SHA256 =
  "5ecfb5cab34914da6c2ad505c05708d09840f7feeb50ab3d9a4427903e6911eb";

let server;

before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"]
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server did not start")), 5000);

    server.stdout.on("data", (chunk) => {
      if (String(chunk).includes("listening")) {
        clearTimeout(timer);
        resolve();
      }
    });

    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`server exited with code ${code}`));
    });
  });
});

after(() => {
  server?.kill();
});

test("homepage serves the approved public foundation without scripts", async () => {
  const response = await fetch(`${BASE}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);

  const html = await response.text();
  assert.match(html, /UnitedSOLANA/);
  assert.match(html, /id="overview"/);
  assert.match(html, /id="principles"/);
  assert.match(html, /id="transparency"/);
  assert.match(html, /id="risk"/);
  assert.match(html, /\/assets\/brand\/usol-logo\.png/);
  assert.doesNotMatch(html, /Connect Phantom Wallet/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /href="\/wallet"/);
});

test("preserved wallet page stays available and no-indexed", async () => {
  const response = await fetch(`${BASE}/wallet`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");

  const html = await response.text();
  assert.match(html, /Connect Phantom Wallet/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.match(html, /\/wallet\.css/);
  assert.match(html, /\/app\.js/);
});

test("stylesheet and script assets are served with correct types", async () => {
  const styles = await fetch(`${BASE}/styles.css`);
  assert.equal(styles.status, 200);
  assert.match(styles.headers.get("content-type"), /text\/css/);

  const walletStyles = await fetch(`${BASE}/wallet.css`);
  assert.equal(walletStyles.status, 200);
  assert.match(walletStyles.headers.get("content-type"), /text\/css/);

  const script = await fetch(`${BASE}/app.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
  assert.match(await script.text(), /window\.phantom/);
});

test("served logo is byte-identical to the canonical on-chain asset", async () => {
  const response = await fetch(`${BASE}/assets/brand/usol-logo.png`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");

  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.length, 22027);
  assert.deepEqual([...bytes.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), LOGO_SHA256);
});

test("unknown routes 404 and unsupported methods 405", async () => {
  const missing = await fetch(`${BASE}/AGENT.md`);
  assert.equal(missing.status, 404);

  const post = await fetch(`${BASE}/`, { method: "POST" });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
});

test("HEAD returns headers without a body", async () => {
  const response = await fetch(`${BASE}/`, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
});
