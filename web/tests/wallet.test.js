"use strict";

// Offline tests for the pure Phantom wallet helpers.
// Run with: node --test web/tests/wallet.test.js

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const core = require("../wallet-core.js");

const VALID_ADDRESSES = [
  "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG",
  "4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc",
  "26qv4GCcx98RihuK3c4T6ozB3J7L6VwCuFVc7Ta2A3Uo",
  "11111111111111111111111111111111"
];

const INVALID_ADDRESSES = [
  "",
  "0OIl",
  "not-a-base58-address",
  "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGM0",
  "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
];

test("accepts base58 strings that decode to a 32-byte public key", () => {
  for (const address of VALID_ADDRESSES) {
    assert.equal(core.isPublicAddress(address), true, `${address} should be accepted`);
  }
});

test("rejects malformed, wrong-alphabet, and wrong-length values", () => {
  for (const value of INVALID_ADDRESSES) {
    assert.equal(core.isPublicAddress(value), false, `${value} should be rejected`);
  }

  assert.equal(core.isPublicAddress(null), false);
  assert.equal(core.isPublicAddress(undefined), false);
  assert.equal(core.isPublicAddress({ toBase58: () => VALID_ADDRESSES[0] }), false);
});

test("builds Phantom's documented browse deep link", () => {
  assert.equal(
    core.phantomBrowseUrl("https://example.com/wallet?ref=1", "https://example.com"),
    "https://phantom.com/ul/browse/https%3A%2F%2Fexample.com%2Fwallet%3Fref%3D1?ref=https%3A%2F%2Fexample.com"
  );
  assert.equal(
    core.phantomBrowseUrl("https://example.com/wallet", ""),
    "https://phantom.com/ul/browse/https%3A%2F%2Fexample.com%2Fwallet"
  );
  assert.equal(core.phantomBrowseUrl("", "https://example.com"), null);
  assert.equal(core.phantomBrowseUrl(null), null);
});

test("maps Phantom's documented provider errors to plain guidance", () => {
  assert.match(core.describeConnectionError({ code: 4001 }), /rejected in Phantom/);
  assert.match(core.describeConnectionError({ code: -32002 }), /approval window open/);
  assert.match(core.describeConnectionError({ code: 4100 }), /not authorized this site/);
  assert.match(core.describeConnectionError({ code: 4900 }), /lost its connection to the network/);
  assert.match(core.describeConnectionError({ code: -32000 }), /rejected the connection request/);
  assert.match(core.describeConnectionError({ code: -32603 }), /internal error/);
  assert.match(core.describeConnectionError({ code: "USOL_INVALID_ADDRESS" }), /could not validate/);
  assert.match(core.describeConnectionError({ message: "User rejected the request." }), /rejected/);
  assert.equal(core.describeConnectionError({ message: "boom" }), "Could not connect: boom");
  assert.equal(core.describeConnectionError(null), "Could not connect to Phantom.");
});

test("helpers contain no wallet, network, storage, or transaction code", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "wallet-core.js"), "utf8");

  assert.doesNotMatch(source, /window\.phantom|document\.|fetch\(|XMLHttpRequest/);
  assert.doesNotMatch(source, /signTransaction|signMessage|sendTransaction|Keypair|privateKey/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie/);
});
