#!/usr/bin/env node
"use strict";

// Minimal static server for the UnitedSolana wallet interface.
// No dependencies: it serves the files in this directory on port 3000 and
// reads them from disk per request, so edits show up on the next refresh.

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

const ROUTES = {
  "/": path.join(WEB_ROOT, "index.html"),
  "/index.html": path.join(WEB_ROOT, "index.html"),
  "/styles.css": path.join(WEB_ROOT, "styles.css"),
  "/app.js": path.join(WEB_ROOT, "app.js"),
  "/logo.svg": path.join(REPO_ROOT, "logo.svg"),
  "/logo.png": path.join(REPO_ROOT, "logo.png")
};

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end("Method Not Allowed\n");
    return;
  }

  const { pathname } = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const file = ROUTES[pathname];

  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not Found\n");
    return;
  }

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
});

server.listen(PORT, HOST, () => {
  console.log(`UnitedSolana wallet interface listening on http://${HOST}:${PORT}`);
});
