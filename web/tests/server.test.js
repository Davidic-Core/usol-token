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

async function startServer({ serverPath = SERVER_PATH, host = "127.0.0.1", env = {} } = {}) {
  const assignedPort = await getAvailablePort();
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, HOST: host, PORT: String(assignedPort), ...env },
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

test("homepage serves the public foundation with local scripts and wallet support", async () => {
  const response = await fetch(`${base}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);

  const html = await response.text();
  assert.match(html, /UnitedSOLANA/);
  assert.match(html, /id="overview"/);
  // The detailed Token, Principles and Transparency sections live on
  // /project-information; the homepage keeps Overview only.
  assert.doesNotMatch(html, /id="(token|principles|transparency|risks?)"/);
  assert.doesNotMatch(html, /#risks?[,)"]/);
  assert.match(html, /\/assets\/brand\/usol-logo\.png/);
  assert.match(html, /recorded metadata description/i);
  assert.doesNotMatch(html, /dedicated token record follows|separate reviewed release/i);
  assert.match(html, /id="homepage-connect"[^>]*>Connect Wallet<\/button>/);
  assert.match(html, /id="wallet-panel-title">Read-only wallet balances\.<\/h2>/);
  assert.match(html, /\/wallet-home\.js/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /\/theme\.css/);
  assert.match(html, /\/theme\.js/);
  assert.doesNotMatch(html, /href="\/wallet"/);
  // The RPC endpoint is server-side only: no endpoint or key in the markup.
  assert.doesNotMatch(html, /solana-rpc-url|helius|api-key/i);

  // The homepage uses local navigation, wallet-core, wallet UI, and mint copy scripts.
  const scriptTags = html.match(/<script\b[^>]*>/gi) || [];
  assert.deepEqual(
    scriptTags.map((tag) => /src="([^"]+)"/.exec(tag)[1]),
      ["/nav.js", "/wallet-core.js", "/wallet-discovery.js", "/wallet-home.js", "/theme.js"]

  );
  assert.doesNotMatch(html, /<script\b(?![^>]*\bsrc=)/i);
  assert.doesNotMatch(html, /\/app\.js/);
});

test("mobile navigation is a local disclosure dropdown", async () => {
  const html = await (await fetch(`${base}/`)).text();

  assert.match(
    html,
    /<button\s+class="nav-toggle"[\s\S]*?aria-expanded="false"[\s\S]*?aria-controls="site-menu"[\s\S]*?data-nav-toggle/
  );
  assert.match(html, /<nav class="site-nav" id="site-menu" aria-label="Primary">/);
  assert.match(html, /class="nav-toggle__icon nav-toggle__icon--menu"/);
  assert.match(html, /class="nav-toggle__icon nav-toggle__icon--close"/);
  assert.match(html, /<span class="visually-hidden">Menu<\/span>/);

  const response = await fetch(`${base}/nav.js`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /javascript/);

  const source = await response.text();
  assert.match(source, /classList\.add\("has-js"\)/);
  assert.match(source, /aria-expanded/);
  assert.doesNotMatch(
    source,
    /signTransaction|signMessage|sendTransaction|window\.phantom|Keypair|privateKey|fetch\(|XMLHttpRequest/
  );
});

test("token section presents the pinned canonical facts", async () => {
  const html = await (await fetch(`${base}/project-information`)).text();

  assert.match(html, /href="\/project-information"/);
  assert.match(html, /Solana Mainnet/);
  assert.match(html, /Classic SPL Token/);
  assert.match(html, /<dt>Token name<\/dt>\s*<dd>UnitedSOLANA<\/dd>/);
  assert.match(html, /<dt>Symbol<\/dt>\s*<dd>USOL<\/dd>/);
  assert.match(html, /<dt>Decimals<\/dt>\s*<dd>9<\/dd>/);
  assert.match(html, /<dt>Initial supply<\/dt>\s*<dd>1,000,000,000 USOL<\/dd>/);

  assert.ok(html.includes("FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG"));
  assert.ok(html.includes("4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc"));
  assert.match(html, /data-copy-mint="FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG"/);
  assert.match(html, /id="mint-copy-status"[^>]*aria-live="polite"/);

  // Solscan is the stated explorer, opened safely in a new tab.
  assert.match(
    html,
    /href="https:\/\/solscan\.io\/token\/FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG"\s+target="_blank"\s+rel="noopener noreferrer"/
  );
  assert.match(
    html,
    /href="https:\/\/solscan\.io\/account\/4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc"/
  );

  // Each branded link points at the exact record, never the explorer homepage.
  assert.doesNotMatch(html, /href="https:\/\/solscan\.io\/?"/);
  assert.equal((html.match(/class="explorer-link"/g) || []).length, 2);

  // Brand artwork and link icons are inline local SVG; no icon service is used.
  assert.match(html, /id="usolArtStroke"/);
  assert.match(html, /class="explorer-link__icon"[\s\S]*?<svg\b/);
  assert.ok((html.match(/<svg\b/g) || []).length >= 4, "inline SVG icons are present");
  assert.doesNotMatch(html, /fontawesome|heroicons|feathericons|cdn\.jsdelivr|cdnjs|unpkg\.com|use\.typekit/i);
});

test("token section separates initial supply from circulating supply and records revoked authorities", async () => {
  const html = await (await fetch(`${base}/project-information`)).text();

  assert.match(html, /<h3>Initial supply<\/h3>/);
  assert.match(html, /<h3>Circulating supply<\/h3>/);
  assert.match(html, /Circulating supply<\/h3>\s*<p class="token-stat__value token-stat__value--muted">Not published<\/p>/);
  assert.match(html, /an initial supply is not the same as a\s+circulating one/i);

  assert.match(html, /<h3>Mint authority<\/h3>\s*<span class="status-pill">Revoked<\/span>/);
  assert.match(html, /<h3>Freeze authority<\/h3>\s*<span class="status-pill">Revoked<\/span>/);
  assert.equal((html.match(/>Revoked</g) || []).length, 2);

  // Recorded facts must not be presented as a fresh live check.
  assert.match(html, /as recorded at deployment, not as\s+a live check performed now/i);

  // No invented market figures.
  assert.doesNotMatch(html, /\$\s?\d/);
  assert.doesNotMatch(html, /\bUSD\b/);
  assert.doesNotMatch(html, /(price|market cap|liquidity|trading volume)[^<]{0,30}\d/i);
});

test("website token facts match the pinned token configuration", async () => {
  const config = fs.readFileSync(path.join(__dirname, "..", "..", "config", "mainnet.js"), "utf8");
  const html = await (await fetch(`${base}/project-information`)).text();

  const mint = /mintAddress:\s*"([1-9A-HJ-NP-Za-km-z]{32,44})"/.exec(config);
  const metadata = /metadataAccount:\s*"([1-9A-HJ-NP-Za-km-z]{32,44})"/.exec(config);
  const decimals = /decimals:\s*(\d+)/.exec(config);
  const supply = /initialSupply:\s*([\d_]+)n/.exec(config);

  assert.ok(mint && metadata && decimals && supply, "pinned configuration exposes the expected fields");

  const formattedSupply = Number(supply[1].replace(/_/g, "")).toLocaleString("en-US");
  assert.ok(html.includes(mint[1]), "the project information page shows the pinned mint address");
  assert.ok(html.includes(metadata[1]), "the project information page shows the pinned metadata account");
  assert.match(html, new RegExp(`<dt>Decimals</dt>\\s*<dd>${decimals[1]}</dd>`));
  assert.match(html, new RegExp(`<dt>Initial supply</dt>\\s*<dd>${formattedSupply} USOL</dd>`));
});

test("mint copy script is served and contains no wallet or transaction code", async () => {
  const response = await fetch(`${base}/token.js`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /javascript/);

  const script = await response.text();
  assert.match(script, /navigator\.clipboard/);
  assert.match(script, /addEventListener\("click"/);
  assert.doesNotMatch(
    script,
    /signTransaction|signMessage|sendTransaction|window\.phantom|Keypair|privateKey|fetch\(|XMLHttpRequest/
  );
});

test("project information page is served with its three section anchors", async () => {
  for (const route of [
    "/project-information",
    "/project-information#token",
    "/project-information#principles",
    "/project-information#transparency"
  ]) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, `${route} should be served`);
    assert.match(response.headers.get("content-type"), /text\/html/);
  }

  const html = await (await fetch(`${base}/project-information`)).text();
  assert.match(html, /id="token"/);
  assert.match(html, /id="principles"/);
  assert.match(html, /id="transparency"/);
  assert.doesNotMatch(html, /id="risks?"/);

  // Section links stay inside the single project information page.
  const sectionNav = /<nav class="hero__actions" aria-label="On this page">([\s\S]*?)<\/nav>/.exec(html);
  assert.ok(sectionNav, "the information page has internal section navigation");
  assert.match(sectionNav[1], /href="#token">Token information<\/a>/);
  assert.match(sectionNav[1], /href="#principles">Principles<\/a>/);
  assert.match(sectionNav[1], /href="#transparency">Transparency<\/a>/);

  // The risks section and its links were removed from the site.
  assert.doesNotMatch(html, /#risks?["<]/);
  const home = await (await fetch(`${base}/`)).text();
  assert.doesNotMatch(home, /id="risks?"|#risks?["<]/);

  // The information page is read-only: no wallet markup or wallet scripts.
  assert.doesNotMatch(html, /wallet-core\.js|wallet-discovery\.js|wallet-home\.js/);
  assert.doesNotMatch(html, /id="homepage-connect"/);
});

test("shared primary and footer navigation contain only Overview and Token", async () => {
  const expectedLinks = [
    ["/", "Overview"],
    ["/project-information", "Token"]
  ];

  for (const route of ["/", "/project-information"]) {
    const html = await (await fetch(`${base}${route}`)).text();
    const menus = [...html.matchAll(/<nav class="(?:site-nav|footer-nav)"[^>]*>([\s\S]*?)<\/nav>/g)];
    assert.equal(menus.length, 2, `${route} has primary and footer navigation`);
    for (const menu of menus) {
      const links = [...menu[1].matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)];
      assert.deepEqual(links.map((link) => [link[1], link[2]]), expectedLinks);
    }
  }
});

test("the removed wallet page and its exclusive assets are no longer served", async () => {
  for (const removed of ["/wallet", "/wallet.html", "/wallet.css", "/app.js"]) {
    const response = await fetch(`${base}${removed}`);
    assert.equal(response.status, 404, `${removed} should no longer be served`);
  }

  const home = await (await fetch(`${base}/`)).text();
  assert.doesNotMatch(home, /wallet\.html|wallet\.css|\/app\.js|href="\/wallet"/);
});

test("wallet scripts stay connection-only and read balances through the local proxy", async () => {
  const coreResponse = await fetch(`${base}/wallet-core.js`);
  assert.equal(coreResponse.status, 200);
  assert.match(coreResponse.headers.get("content-type"), /javascript/);

  const coreSource = await coreResponse.text();
  assert.match(coreSource, /phantom\.com\/ul\/browse/);
  assert.doesNotMatch(coreSource, /signTransaction\s*\(|signMessage\s*\(|sendTransaction\s*\(/);
  assert.doesNotMatch(coreSource, /window\.phantom|fetch\(|XMLHttpRequest|localStorage|sessionStorage/);

  // Wallet Standard discovery is served locally, with no wallet name hardcoded
  // as the only option and no Backpack integration left behind.
  const discoveryResponse = await fetch(`${base}/wallet-discovery.js`);
  assert.equal(discoveryResponse.status, 200);
  assert.match(discoveryResponse.headers.get("content-type"), /javascript/);

  const discoverySource = await discoveryResponse.text();
  assert.match(discoverySource, /wallet-standard:register-wallet/);
  assert.match(discoverySource, /standard:connect/);

  const homeSource = await (await fetch(`${base}/wallet-home.js`)).text();
  assert.match(homeSource, /getBalance/);
  assert.match(homeSource, /getTokenAccountsByOwner/);
  assert.match(homeSource, /RPC_ENDPOINT = "\/api\/rpc"/);
  assert.doesNotMatch(homeSource, /api\.mainnet-beta\.solana\.com|api-key=|helius-rpc\.com/i);
  assert.doesNotMatch(homeSource, /Backpack|backpack/);
  assert.doesNotMatch(homeSource, /signTransaction\s*\(|signMessage\s*\(|sendTransaction\s*\(/);
  assert.doesNotMatch(homeSource, /seedPhrase|privateKey|Keypair/);
});

test("stylesheet and theme assets are served with correct types", async () => {
  const styles = await fetch(`${base}/styles.css`);
  assert.equal(styles.status, 200);
  assert.match(styles.headers.get("content-type"), /text\/css/);

  const themeStyles = await fetch(`${base}/theme.css`);
  assert.equal(themeStyles.status, 200);
  assert.match(themeStyles.headers.get("content-type"), /text\/css/);

  const themeScript = await fetch(`${base}/theme.js`);
  assert.equal(themeScript.status, 200);
  assert.match(themeScript.headers.get("content-type"), /javascript/);
  assert.match(await themeScript.text(), /usol-theme/);
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

const RPC_ADDRESS = "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG";

function startUpstream(handler) {
  const upstream = http.createServer(handler);
  return new Promise((resolve) => {
    upstream.listen(0, "127.0.0.1", () => {
      resolve({ server: upstream, url: `http://127.0.0.1:${upstream.address().port}` });
    });
  });
}

function stopUpstream(upstream) {
  if (typeof upstream.closeAllConnections === "function") upstream.closeAllConnections();
  return new Promise((resolve) => upstream.close(resolve));
}

function rpcPost(targetBase, payload) {
  return fetch(`${targetBase}/api/rpc`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("the RPC proxy forwards only the read-only balance methods", async () => {
  const calls = [];
  const upstream = await startUpstream((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      calls.push(body);
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: { value: 2500000000 } }));
    });
  });

  let proxy;
  try {
    const started = await startServer({ env: { SOLANA_RPC_URL: upstream.url } });
    proxy = started.child;

    const balance = await rpcPost(started.base, {
      jsonrpc: "2.0",
      id: 7,
      method: "getBalance",
      params: [RPC_ADDRESS, { commitment: "confirmed" }]
    });
    assert.equal(balance.status, 200);
    const payload = await balance.json();
    assert.equal(payload.id, 7);
    assert.equal(payload.result.value, 2500000000);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "getBalance");
    assert.deepEqual(calls[0].params, [RPC_ADDRESS, { commitment: "confirmed" }]);

    const blocked = await rpcPost(started.base, {
      jsonrpc: "2.0",
      id: 8,
      method: "sendTransaction",
      params: [RPC_ADDRESS]
    });
    assert.equal(blocked.status, 400);
    assert.equal(calls.length, 1, "a non-balance method never reaches the upstream endpoint");

    const invalid = await rpcPost(started.base, {
      jsonrpc: "2.0",
      id: 9,
      method: "getBalance",
      params: ["not-a-wallet"]
    });
    assert.equal(invalid.status, 400);
    assert.equal(calls.length, 1);

    const wrongMethod = await fetch(`${started.base}/api/rpc`);
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get("allow"), "POST");
  } finally {
    await stopServer(proxy);
    await stopUpstream(upstream.server);
  }
});

test("the RPC proxy reports upstream HTTP failures and timeouts", async () => {
  const failing = await startUpstream((request, response) => {
    request.resume();
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "upstream failure" }));
  });
  const hanging = await startUpstream(() => {});

  let errorProxy;
  let timeoutProxy;
  try {
    const errorStarted = await startServer({ env: { SOLANA_RPC_URL: failing.url } });
    errorProxy = errorStarted.child;
    const failed = await rpcPost(errorStarted.base, {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [RPC_ADDRESS, { mint: RPC_ADDRESS }, { encoding: "jsonParsed" }]
    });
    assert.equal(failed.status, 502);
    assert.match((await failed.json()).error.message, /HTTP 500/);

    const timeoutStarted = await startServer({
      env: { SOLANA_RPC_URL: hanging.url, USOL_RPC_TIMEOUT_MS: "150" }
    });
    timeoutProxy = timeoutStarted.child;
    const timedOut = await rpcPost(timeoutStarted.base, {
      jsonrpc: "2.0",
      id: 2,
      method: "getBalance",
      params: [RPC_ADDRESS]
    });
    assert.equal(timedOut.status, 504);
    assert.match((await timedOut.json()).error.message, /timed out/i);
  } finally {
    await stopServer(errorProxy);
    await stopServer(timeoutProxy);
    await stopUpstream(failing.server);
    await stopUpstream(hanging.server);
  }
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

    // The isolated server's allowlisted stylesheet has no file to read.
    const response = await fetch(`${started.base}/styles.css`);
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
