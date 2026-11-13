#!/usr/bin/env node
"use strict";

// Minimal static server for the UnitedSOLANA website.
// No dependencies: it serves the files in this directory on port 3000 and
// reads them from disk per request, so edits show up on the next refresh.
//
// The server also exposes one endpoint, POST /api/rpc, which forwards the two
// read-only Solana Mainnet calls the balance panel needs. The upstream endpoint
// and its Helius API key stay in this process's environment, so no key ever
// reaches the browser, the HTML, or the JavaScript files.

const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);

const WEB_ROOT = __dirname;
const REPO_ROOT = path.resolve(__dirname, "..");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const INDEX_PAGE = path.join(WEB_ROOT, "index.html");
const PROJECT_INFORMATION_PAGE = path.join(WEB_ROOT, "project-information.html");
const SUPPORT_PAGE = path.join(WEB_ROOT, "support.html");

// Explicit allowlist: only these paths are served. The Project Information page
// owns its own document so direct links, refreshes and browser history work
// without client-side routing; its #section anchors are resolved by the browser
// and never reach this server.
const ROUTES = {
  "/": INDEX_PAGE,
  "/index.html": INDEX_PAGE,
  "/project-information": PROJECT_INFORMATION_PAGE,
  "/support": SUPPORT_PAGE,
  "/styles.css": path.join(WEB_ROOT, "styles.css"),
  "/theme.css": path.join(WEB_ROOT, "theme.css"),
  "/wallet-core.js": path.join(WEB_ROOT, "wallet-core.js"),
  "/wallet-discovery.js": path.join(WEB_ROOT, "wallet-discovery.js"),
  "/token.js": path.join(WEB_ROOT, "token.js"),
  "/nav.js": path.join(WEB_ROOT, "nav.js"),
  "/wallet-home.js": path.join(WEB_ROOT, "wallet-home.js"),
  "/theme.js": path.join(WEB_ROOT, "theme.js"),
  "/assets/brand/usol-logo.png": path.join(WEB_ROOT, "assets", "brand", "usol-logo.png"),
  "/logo.svg": path.join(REPO_ROOT, "logo.svg"),
  "/logo.png": path.join(REPO_ROOT, "logo.png")
};

// --- Read-only Mainnet RPC proxy -------------------------------------------

const RPC_PATH = "/api/rpc";
// Balance retrieval only: nothing that can sign, send or simulate a transfer.
const RPC_METHODS = new Set(["getBalance", "getTokenAccountsByOwner"]);
const RPC_TIMEOUT_MS = Number(process.env.USOL_RPC_TIMEOUT_MS || 15000);
const RPC_BODY_LIMIT = 4096;
const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// The Helius API key is read here only. It is never logged or returned.
function rpcEndpoint() {
  const configured = String(process.env.SOLANA_RPC_URL || "").trim();
  if (configured) return configured;

  const apiKey = String(process.env.HELIUS_API_KEY || "").trim();
  if (apiKey) {
    return `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(apiKey)}`;
  }

  return "https://api.mainnet-beta.solana.com";
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(payload));
}

function sendRpcError(response, status, message) {
  sendJson(response, status, { jsonrpc: "2.0", id: null, error: { code: -32000, message } });
}

function readBody(request, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        const tooLarge = new Error("Request body is too large.");
        tooLarge.status = 413;
        request.destroy();
        reject(tooLarge);
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function validateRpcRequest(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Expected a single JSON-RPC request object.";
  }
  if (payload.jsonrpc !== "2.0" || typeof payload.method !== "string") {
    return "Expected a JSON-RPC 2.0 request.";
  }
  if (!RPC_METHODS.has(payload.method)) {
    return "This endpoint serves read-only balance requests only.";
  }
  if (!Array.isArray(payload.params) || payload.params.length === 0) {
    return "Missing RPC parameters.";
  }
  if (typeof payload.params[0] !== "string" || !BASE58_ADDRESS.test(payload.params[0])) {
    return "Expected a Solana public address as the first parameter.";
  }
  return null;
}

async function handleRpc(request, response) {
  if (request.method !== "POST") {
    response.writeHead(405, {
      allow: "POST",
      "content-type": "text/plain; charset=utf-8"
    });
    response.end("Method Not Allowed\n");
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(request, RPC_BODY_LIMIT));
  } catch (error) {
    const status = error && error.status === 413 ? 413 : 400;
    sendRpcError(
      response,
      status,
      status === 413 ? "Request body is too large." : "Expected a JSON request body."
    );
    return;
  }

  const problem = validateRpcRequest(payload);
  if (problem) {
    sendRpcError(response, 400, problem);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  let upstream;

  try {
    upstream = await fetch(rpcEndpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: payload.id === undefined ? null : payload.id,
        method: payload.method,
        params: payload.params
      }),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timer);
    if (error && error.name === "AbortError") {
      sendRpcError(response, 504, "Solana Mainnet RPC timed out. Try again.");
    } else {
      console.error(`RPC proxy could not reach the upstream endpoint: ${error.message}`);
      sendRpcError(response, 502, "Solana Mainnet RPC is unreachable. Try again.");
    }
    return;
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    console.error(`RPC proxy upstream returned HTTP ${upstream.status}`);
    sendRpcError(response, 502, `Solana Mainnet RPC returned HTTP ${upstream.status}.`);
    return;
  }

  let result;
  try {
    result = await upstream.json();
  } catch (_) {
    sendRpcError(response, 502, "Solana Mainnet RPC returned an unreadable response.");
    return;
  }

  if (result && result.error) {
    // Rebuilt rather than forwarded so nothing from the upstream request
    // (including its key) can reach the browser.
    const message =
      typeof result.error.message === "string" && result.error.message.trim()
        ? result.error.message.trim().slice(0, 300)
        : "Solana Mainnet RPC returned an error.";
    sendRpcError(response, 200, message);
    return;
  }

  sendJson(response, 200, {
    jsonrpc: "2.0",
    id: payload.id === undefined ? null : payload.id,
    result: result ? result.result : null
  });
}

// --- Static files ----------------------------------------------------------

function serveFile(request, response, pathname, file) {
  fs.readFile(file, (error, contents) => {
    if (error) {
      console.error(`Could not read ${file}: ${error.message}`);
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end("Could not read the application files.\n");
      return;
    }

    response.writeHead(200, {
      "content-type": CONTENT_TYPES[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  });
}

const server = http.createServer((request, response) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (pathname === RPC_PATH) {
    handleRpc(request, response);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end("Method Not Allowed\n");
    return;
  }

  const file = ROUTES[pathname];

  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not Found\n");
    return;
  }

  serveFile(request, response, pathname, file);
});

server.listen(PORT, HOST, () => {
  console.log(`UnitedSOLANA website listening on http://${HOST}:${PORT}`);
});
