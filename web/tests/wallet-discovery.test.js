"use strict";

// Offline tests for Solana Wallet Standard discovery, connection, account
// switching and mobile guidance.
// Run with: node --test web/tests/wallet-discovery.test.js

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const discovery = require("../wallet-discovery.js");

const ADDRESS = "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG";
const SECOND_ADDRESS = "4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc";

function standardWallet(overrides = {}) {
  return {
    version: "1.0.0",
    name: "Fakelet",
    icon: "data:image/svg+xml;base64,PHN2Zy8+",
    chains: ["solana:mainnet", "solana:devnet"],
    accounts: [],
    features: {},
    ...overrides
  };
}

function walletWithConnect(address = ADDRESS, extra = {}) {
  return standardWallet({
    features: {
      "standard:connect": {
        connect: async () => ({ accounts: [{ address, chains: ["solana:mainnet"] }] })
      },
      ...extra
    }
  });
}

test("recognises Solana wallets and ignores other chains", () => {
  assert.equal(discovery.isSolanaWallet(standardWallet()), true);
  assert.equal(
    discovery.isSolanaWallet(standardWallet({ chains: [] })),
    false,
    "a wallet with no Solana chain is ignored"
  );
  assert.equal(
    discovery.isSolanaWallet(
      standardWallet({ chains: [], accounts: [{ address: ADDRESS, chains: ["solana:mainnet"] }] })
    ),
    true,
    "a Solana account is enough"
  );
  assert.equal(
    discovery.isSolanaWallet(standardWallet({ name: "SomeEVM", chains: ["eip155:1"] })),
    false
  );
  assert.equal(discovery.isSolanaWallet(null), false);
  assert.equal(discovery.isSolanaWallet({ chains: ["solana:mainnet"] }), false);
});

test("registered wallets come first and are never listed twice", () => {
  const phantom = standardWallet({
    name: "Phantom",
    features: { "standard:connect": { connect: async () => ({ accounts: [] }) } }
  });
  const evm = standardWallet({ name: "SomeEVM", chains: ["eip155:1"] });
  const legacyPhantom = { name: "Phantom", connect: async () => ({ publicKey: ADDRESS }) };
  const legacySolflare = { name: "Solflare", connect: async () => ({ publicKey: ADDRESS }) };

  const entries = discovery.collectWallets(
    [phantom, evm, phantom],
    [
      { name: "Phantom", wallet: legacyPhantom },
      { name: "Solflare", wallet: legacySolflare },
      { name: "Empty", wallet: null }
    ]
  );

  assert.deepEqual(
    entries.map((entry) => entry.name),
    ["Phantom", "Solflare"]
  );
  assert.equal(entries[0].source, "standard");
  assert.equal(entries[0].wallet, phantom);
  assert.equal(entries[0].icon, phantom.icon, "the wallet's own icon is kept");
  assert.equal(entries[0].canConnect, true);
  assert.equal(entries[1].source, "legacy");
  assert.equal(entries[1].icon, null);
});

test("name matching is case-insensitive so a wallet cannot appear twice", () => {
  const entries = discovery.collectWallets(
    [standardWallet({ name: " phantom " })],
    [{ name: "Phantom", wallet: { connect: async () => ADDRESS } }]
  );

  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, "phantom");
});

test("a Solana wallet without a connection feature is listed but marked unsupported", () => {
  const entries = discovery.collectWallets([standardWallet({ name: "ReadOnly" })], []);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].canConnect, false);
});

test("wallets that registered before the app are collected", () => {
  const target = new EventTarget();
  const phantom = standardWallet({ name: "Phantom" });

  target.addEventListener(discovery.APP_READY_EVENT, (event) => {
    event.detail.register(phantom);
  });

  const registry = discovery.createWalletRegistry(target);
  assert.deepEqual(registry.get(), [phantom]);
});

test("wallets that register after the app are collected, and listeners fire", () => {
  const target = new EventTarget();
  const registry = discovery.createWalletRegistry(target);
  const registrations = [];
  registry.onChange((wallets) => registrations.push(wallets.length));

  const solflare = standardWallet({ name: "Solflare" });
  target.dispatchEvent(
    new CustomEvent(discovery.REGISTER_WALLET_EVENT, {
      detail: (api) => api.register(solflare)
    })
  );

  assert.deepEqual(registry.get(), [solflare]);
  assert.deepEqual(registrations, [1]);

  registry.register(solflare);
  assert.deepEqual(registrations, [1], "the same wallet is not registered twice");
});

test("the deprecated navigator.wallets callbacks are replayed into the registry", () => {
  const target = new EventTarget();
  const wallet = standardWallet({ name: "LegacyApi" });
  Object.defineProperty(target, "navigator", {
    value: { wallets: [({ register }) => register(wallet)] },
    configurable: true
  });

  const registry = discovery.createWalletRegistry(target);
  assert.equal(discovery.attachDeprecatedRegistry(target, registry.register), true);
  assert.deepEqual(registry.get(), [wallet]);

  const later = standardWallet({ name: "LaterWallet" });
  target.navigator.wallets.push(({ register }) => register(later));
  assert.deepEqual(registry.get(), [wallet, later]);
});

test("connects through the standard feature and returns the public address", async () => {
  const address = await discovery.connectWallet(walletWithConnect());
  assert.equal(address, ADDRESS);
});

test("falls back to an injected provider's connect method", async () => {
  const legacy = { name: "Old", connect: async () => ({ publicKey: { toBase58: () => SECOND_ADDRESS } }) };
  assert.equal(await discovery.connectWallet(legacy), SECOND_ADDRESS);

  const stringKey = { name: "Older", connect: async () => ({ publicKey: SECOND_ADDRESS }) };
  assert.equal(await discovery.connectWallet(stringKey), SECOND_ADDRESS);
});

test("reports a wallet that cannot connect at all", async () => {
  await assert.rejects(
    () => discovery.connectWallet({ name: "NoConnect", chains: ["solana:mainnet"], features: {} }),
    (error) => error.code === discovery.UNSUPPORTED_WALLET
  );
  await assert.rejects(
    () => discovery.connectWallet(walletWithConnect(ADDRESS, {
      "standard:connect": { connect: async () => ({ accounts: [] }) }
    })),
    (error) => error.code === discovery.UNSUPPORTED_WALLET
  );
});

test("a rejected connection propagates to the caller", async () => {
  const wallet = standardWallet({
    features: {
      "standard:connect": {
        connect: async () => {
          const error = new Error("User rejected the request.");
          error.code = 4001;
          throw error;
        }
      }
    }
  });

  await assert.rejects(() => discovery.connectWallet(wallet), (error) => error.code === 4001);
});

test("disconnects through the standard feature and tolerates failures", async () => {
  let called = 0;
  await discovery.disconnectWallet(
    standardWallet({
      features: {
        "standard:disconnect": { disconnect: async () => { called += 1; } }
      }
    })
  );
  assert.equal(called, 1);

  await discovery.disconnectWallet(
    standardWallet({
      features: {
        "standard:disconnect": { disconnect: async () => { throw new Error("boom"); } }
      }
    })
  );

  let legacyCalled = 0;
  await discovery.disconnectWallet({ name: "Old", disconnect: async () => { legacyCalled += 1; } });
  assert.equal(legacyCalled, 1);
});

test("account switching and external disconnection are reported", () => {
  let listener = null;
  const wallet = standardWallet({
    features: {
      "standard:events": {
        on: (event, callback) => {
          assert.equal(event, "change");
          listener = callback;
          return () => { listener = null; };
        }
      }
    }
  });

  const seen = [];
  const unsubscribe = discovery.watchWallet(wallet, {
    onAccount: (address) => seen.push(["account", address]),
    onDisconnect: () => seen.push(["disconnect"])
  });

  listener({ accounts: [{ address: SECOND_ADDRESS, chains: ["solana:mainnet"] }] });
  listener({ accounts: [] });
  listener({ chains: ["solana:mainnet"] });

  assert.deepEqual(seen, [["account", SECOND_ADDRESS], ["disconnect"]]);

  unsubscribe();
  assert.equal(listener, null, "unsubscribing removes the standard listener");
});

test("injected providers' legacy account and disconnect events are reported", () => {
  const handlers = {};
  const wallet = {
    name: "Old",
    on: (event, callback) => {
      handlers[event] = callback;
      return () => { delete handlers[event]; };
    }
  };

  const seen = [];
  discovery.watchWallet(wallet, {
    onAccount: (address) => seen.push(["account", address]),
    onDisconnect: () => seen.push(["disconnect"])
  });

  handlers.accountChanged({ toBase58: () => SECOND_ADDRESS });
  handlers.accountChanged(null);
  handlers.disconnect({});

  assert.deepEqual(seen, [["account", SECOND_ADDRESS], ["disconnect"], ["disconnect"]]);
});

test("explains rejected, cancelled and unsupported connections", () => {
  assert.match(
    discovery.describeConnectionError({ code: 4001 }, "Phantom"),
    /^Phantom cancelled the connection request/
  );
  assert.match(
    discovery.describeConnectionError({ message: "User declined the request" }, "Solflare"),
    /^Solflare cancelled the connection request/
  );
  assert.match(discovery.describeConnectionError({ code: -32002 }, "Phantom"), /approval window open/);
  assert.match(discovery.describeConnectionError({ code: 4100 }, "Phantom"), /not authorized this site/);
  assert.match(discovery.describeConnectionError({ code: 4900 }, "Phantom"), /lost its connection/);
  assert.match(discovery.describeConnectionError({ code: -32603 }, "Phantom"), /internal error/);

  const unsupported = { code: discovery.UNSUPPORTED_WALLET, message: "This wallet does not support connecting from a website." };
  assert.equal(
    discovery.describeConnectionError(unsupported, "SomeWallet"),
    "This wallet does not support connecting from a website."
  );

  assert.match(
    discovery.describeConnectionError({ code: "USOL_INVALID_ADDRESS" }, "Phantom"),
    /could not validate/
  );
  assert.equal(
    discovery.describeConnectionError({ message: "boom" }, "Phantom"),
    "Could not connect: boom"
  );
  assert.equal(discovery.describeConnectionError(null, "Phantom"), "Could not connect to Phantom.");
  assert.equal(discovery.describeConnectionError(null), "Could not connect to the wallet.");
});

test("builds only documented wallet-app entry links", () => {
  assert.equal(
    discovery.mobileBrowseUrl("Phantom", "https://example.com/?a=1", "https://example.com"),
    "https://phantom.app/ul/browse/https%3A%2F%2Fexample.com%2F%3Fa%3D1?ref=https%3A%2F%2Fexample.com"
  );
  assert.equal(
    discovery.mobileBrowseUrl("Solflare", "https://example.com/", ""),
    "https://solflare.com/ul/v1/browse/https%3A%2F%2Fexample.com%2F"
  );
  assert.equal(discovery.mobileBrowseUrl("Unknown", "https://example.com/"), null);
  assert.equal(discovery.mobileBrowseUrl("Phantom", ""), null);
  assert.equal(discovery.mobileBrowseUrl("Phantom", null), null);
});

test("points to official installation pages only", () => {
  assert.equal(discovery.installUrl("Phantom"), "https://phantom.app/download");
  assert.equal(discovery.installUrl("Solflare"), "https://solflare.com/download");
  assert.equal(discovery.installUrl("Backpack"), null, "Backpack is no longer offered");
  assert.equal(discovery.installUrl("Unknown"), null);
});

test("discovery helpers contain no signing, network, storage or Backpack code", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "wallet-discovery.js"), "utf8");

  assert.doesNotMatch(source, /signTransaction|signMessage|sendTransaction|Keypair|privateKey|seedPhrase/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /Backpack|backpack/);
  assert.doesNotMatch(source, /window\.phantom|document\./);
});
