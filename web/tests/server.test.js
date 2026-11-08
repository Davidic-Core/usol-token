"use strict";

// Dependency-free route tests for the static website server.
// Run with: node --test web/tests/server.test.js

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const SERVER_PATH = path.join(__dirname, "..", "server.js");
const LOGO_SHA256 =
  "5ecfb5cab34914da6c2ad505c05708d09840f7feeb50ab3d9a4427903e6911eb";

let server;
let port;
let base;

// Reserve an OS-selected ephemeral port, then release it for the child server.
// This avoids collisions with a hard-coded test port.
async function getAvailablePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const { port: availablePort } = listener.address();
  await new Promise((resolve, reject) => {
    listener.close((error) => (error ? reject(error) : resolve()));
  });
  return availablePort;
}

async function startServer({ serverPath = SERVER_PATH, host = "127.0.0.1" } = {}) {
  const assignedPort = await getAvailablePort();
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, HOST: host, PORT: String(assignedPort) },
    stdio: ["ignore", "pipe", "pipe"]
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server did not start")), 5000);
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes("listening")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`server exited before startup (code ${code}, signal ${signal})`));
    });
  });

  return { child, port: assignedPort, base: `http://${host}:${assignedPort}` };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    child.once("exit", resolve);
    child.kill();
  });
}

function rawGet(targetPort, requestPath) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      { host: "127.0.0.1", port: targetPort, method: "GET", path: requestPath },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    request.once("error", reject);
    request.end();
  });
}

before(async () => {
  const started = await startServer();
  server = started.child;
  port = started.port;
  base = started.base;
});

after(async () => {
  await stopServer(server);
});

test("homepage serves the public foundation without JavaScript", async () => {
  const response = await fetch(`${base}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);

  const html = await response.text();
  assert.match(html, /UnitedSOLANA/);
  assert.match(html, /id="overview"/);
  assert.match(html, /id="principles"/);
  assert.match(html, /id="transparency"/);
  assert.match(html, /id="risk"/);
  assert.match(html, /\/assets\/brand\/usol-logo\.png/);
  assert.match(html, /recorded metadata description/i);
  assert.doesNotMatch(html, /dedicated token record follows|separate reviewed release/i);
  assert.doesNotMatch(html, /Connect Phantom Wallet/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /href="\/wallet"/);
});

test("preserved wallet page stays available, unlinked, and no-indexed", async () => {
  const response = await fetch(`${base}/wallet`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");

  const html = await response.text();
  assert.match(html, /Connect Phantom Wallet/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.match(html, /id="open-tab" href="\/wallet"/);
  assert.match(html, /\/wallet\.css/);
  assert.match(html, /\/app\.js/);
});

test("stylesheet and Phantom script assets are served with correct types", async () => {
  const styles = await fetch(`${base}/styles.css`);
  assert.equal(styles.status, 200);
  assert.match(styles.headers.get("content-type"), /text\/css/);

  const walletStyles = await fetch(`${base}/wallet.css`);
  assert.equal(walletStyles.status, 200);
  assert.match(walletStyles.headers.get("content-type"), /text\/css/);

  const script = await fetch(`${base}/app.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
  assert.match(await script.text(), /window\.phantom/);
});

test("served logo matches the expected PNG asset digest", async () => {
  const response = await fetch(`${base}/assets/brand/usol-logo.png`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");

  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.length, 22027);
  assert.deepEqual([...bytes.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), LOGO_SHA256);
});

test("unknown routes return 404 and unsupported methods return 405", async () => {
  const missing = await fetch(`${base}/AGENT.md`);
  assert.equal(missing.status, 404);

  const post = await fetch(`${base}/`, { method: "POST" });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
  assert.match(await post.text(), /Method Not Allowed/);
});

test("raw, encoded, and suspicious traversal paths are rejected with 404", async () => {
  const suspiciousPaths = [
    "/../AGENT.md",
    "/%2e%2e/AGENT.md",
    "/%2e%2e%2fAGENT.md",
    "/%2f..%2fAGENT.md",
    "/%5c..%5cAGENT.md",
    "/assets/..%2f..%2fAGENT.md",
    "//etc/passwd",
    "/%"
  ];

  for (const requestPath of suspiciousPaths) {
    const response = await rawGet(port, requestPath);
    assert.equal(response.status, 404, `${requestPath} should not resolve to a file`);
    assert.match(response.body, /Not Found/);
  }
});

test("file read failures return a generic HTTP 500 response", async () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "usol-web-read-failure-"));
  const temporaryWeb = path.join(temporaryRoot, "web");
  fs.mkdirSync(temporaryWeb);
  const temporaryServer = path.join(temporaryWeb, "server.js");
  fs.copyFileSync(SERVER_PATH, temporaryServer);

  let failureServer;
  try {
    const started = await startServer({ serverPath: temporaryServer });
    failureServer = started.child;

    // The isolated server's allowlisted wallet path intentionally has no file.
    const response = await fetch(`${started.base}/wallet`);
    assert.equal(response.status, 500);
    assert.match(response.headers.get("content-type"), /text\/plain/);
    assert.equal(await response.text(), "Could not read the application files.\n");
  } finally {
    await stopServer(failureServer);
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("HEAD returns headers without a body", async () => {
  const response = await fetch(`${base}/`, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
});
