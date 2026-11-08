"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const config = require("../config/mainnet");
const stateModule = require("../lib/state");
const verify = require("../lib/verify");

const root = path.join(__dirname, "..");
const fixture = path.join(__dirname, "fixtures", "mainnet.deployed.json");
const record = JSON.parse(fs.readFileSync(fixture, "utf8"));
const tests = [];

// Register tests; run() awaits each returned value before recording a result.
function test(name, fn) { tests.push({ name, fn }); }

const retired = ["revoke-mint-authority.js", "revoke-freeze-authority.js", "upload-metadata-mainnet.js", "register-metadata-mainnet.js"];
for (const filename of retired) {
  test(`${filename} is inert and exits without keys or network`, () => {
    const source = fs.readFileSync(path.join(root, filename), "utf8");
    assert.doesNotMatch(source, /require\s*\(/);
    assert.doesNotMatch(source, /readFileSync|fetch\s*\(|Connection|Keypair|Transaction|partialSign|sendRawTransaction|sendAndConfirm|uploader|createV1/);
    const run = spawnSync(process.execPath, [path.join(root, filename)], {
      encoding: "utf8", timeout: 5000,
      env: { ...process.env, USOL_FEE_PAYER_KEYPAIR: "/missing/key", USOL_AUTHORITY_KEYPAIR: "/missing/key", SOLANA_RPC_URL: "https://invalid.invalid" }
    });
    assert.strictEqual(run.status, 0, run.stderr);
    assert.match(run.stdout, /HISTORICAL \/ DISABLED/);
  });
}

test("deployed fixture passes canonical state checks without using live state", () => {
  const loaded = stateModule.loadState(fixture);
  assert.strictEqual(loaded.mintAddress, config.DEPLOYMENT.mintAddress);
  assert.strictEqual(loaded.status, config.DEPLOYMENT.status);
});
test("missing and altered canonical deployment fields fail closed", () => {
  assert.throws(() => stateModule.assertStateIntegrity({ ...record, mintAddress: null }), /inconsistent/);
  assert.throws(() => stateModule.assertStateIntegrity({ ...record, rpcUrl: "https://example.invalid" }), /rpcUrl/);
  assert.throws(() => stateModule.assertStateIntegrity({ ...record, token: { ...record.token, decimals: 6 } }), /token.decimals/);
  assert.throws(() => stateModule.assertStateIntegrity({ ...record, authorities: { ...record.authorities, mintAuthority: config.WALLETS.initialHolder } }), /authorities.mintAuthority/);
  assert.throws(() => stateModule.assertStateIntegrity({ ...record, metadataUri: "https://example.invalid/a.json" }), /metadataUri/);
});
test("extra harmless deployment fields remain allowed", () => {
  assert.strictEqual(stateModule.assertStateIntegrity({ ...record, ownerNote: "historical" }).ownerNote, "historical");
});
test("mint verifier checks exact total supply, decimals, and null authorities", () => {
  const mint = { decimals: 9, supply: config.rawInitialSupply(), mintAuthority: null, freezeAuthority: null };
  assert.strictEqual(verify.assertMintFields(mint), mint);
  assert.throws(() => verify.assertMintFields({ ...mint, decimals: 8 }), /decimals/);
  assert.throws(() => verify.assertMintFields({ ...mint, supply: 1n }), /supply/);
  assert.throws(() => verify.assertMintFields({ ...mint, mintAuthority: { toBase58: () => "active" } }), /Mint authority is active/);
  assert.throws(() => verify.assertMintFields({ ...mint, freezeAuthority: { toBase58: () => "active" } }), /Freeze authority is active/);
});
test("holder account verifies mint and owner without assuming its balance", () => {
  const account = {
    mint: new (require("@solana/web3.js").PublicKey)(config.DEPLOYMENT.mintAddress),
    owner: new (require("@solana/web3.js").PublicKey)(config.WALLETS.initialHolder),
    amount: 125n * 10n ** 9n
  };
  assert.strictEqual(verify.assertTokenAccountFields(account), account);
  assert.throws(() => verify.assertTokenAccountFields({ ...account, amount: 1n }, { expectedAmount: config.rawInitialSupply() }), /balance mismatch/);
});
test("metadata account, mint, name, symbol, and URI are pinned", () => {
  verify.assertMetadataAccount({ mintAddress: config.DEPLOYMENT.mintAddress, metadataAccount: config.DEPLOYMENT.metadataAccount, metadataUri: config.DEPLOYMENT.metadataUri });
  assert.throws(() => verify.assertMetadataAccount({ mintAddress: record.wallets.feePayer, metadataAccount: config.DEPLOYMENT.metadataAccount, metadataUri: config.DEPLOYMENT.metadataUri }), /mint/);
  const metadata = { mint: config.DEPLOYMENT.mintAddress, name: config.TOKEN.name, symbol: config.TOKEN.symbol, uri: config.DEPLOYMENT.metadataUri, address: config.DEPLOYMENT.metadataAccount };
  assert.strictEqual(verify.assertMetadataFields(metadata), metadata);
  for (const [field, value] of [["mint", record.wallets.feePayer], ["name", "wrong"], ["symbol", "wrong"], ["uri", "https://example.invalid"]]) {
    assert.throws(() => verify.assertMetadataFields({ ...metadata, [field]: value }), /mismatch/);
  }
});
test("metadata JSON logo/name/symbol/description are checked offline", () => {
  const metadata = { name: config.TOKEN.name, symbol: config.TOKEN.symbol, description: config.TOKEN.description, image: config.DEPLOYMENT.imageUri };
  assert.strictEqual(verify.assertMetadataJson(metadata), metadata);
  for (const [field, value] of [["image", "https://example.invalid/logo.png"], ["name", "wrong"], ["symbol", "wrong"]]) {
    assert.throws(() => verify.assertMetadataJson({ ...metadata, [field]: value }), /mismatch/);
  }
  assert.throws(() => verify.assertMetadataJson(null), /invalid JSON object/);
});
test("metadata gateway outage, invalid JSON, and content mismatch are distinct", async () => {
  await assert.rejects(() => verify.fetchAndAssertMetadataJson(config.DEPLOYMENT.metadataUri, async () => { throw new Error("offline"); }), /gateway unavailable/);
  await assert.rejects(() => verify.fetchAndAssertMetadataJson(config.DEPLOYMENT.metadataUri, async () => ({ ok: false, status: 503 })), /gateway unavailable: HTTP 503/);
  await assert.rejects(() => verify.fetchAndAssertMetadataJson(config.DEPLOYMENT.metadataUri, async () => ({ ok: true, json: async () => { throw new SyntaxError("bad JSON"); } })), /invalid\/unreadable JSON/);
  await assert.rejects(() => verify.fetchAndAssertMetadataJson(config.DEPLOYMENT.metadataUri, async () => ({ ok: true, json: async () => ({ name: "wrong" }) })), /Metadata JSON name mismatch/);
});
test("verifier has no transaction path or deployment-record writer", () => {
  const source = fs.readFileSync(path.join(root, "deploy-mainnet.js"), "utf8");
  assert.doesNotMatch(source, /sendRawTransaction|sendAndConfirm|partialSign|signTransaction|createMint|mintTo|createV1|uploader\.upload|saveState|writeFileSync|launch-transaction/);
});
test("deployment discrepancies are reported and never repaired", () => {
  assert.throws(() => stateModule.assertStateIntegrity({ ...record, imageUri: "https://example.invalid/logo.png" }), /imageUri/);
  assert.strictEqual(stateModule.saveState, undefined);
  const source = fs.readFileSync(path.join(root, "deploy-mainnet.js"), "utf8");
  assert.doesNotMatch(source, /saveState|writeFileSync/);
});

async function run() {
  const results = [];
  for (const { name, fn } of tests) {
    try {
      await fn();
      results.push({ ok: true, name });
    } catch (error) {
      results.push({ ok: false, name, error });
    }
  }
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.ok ? result.name : `${result.name}: ${result.error.stack || result.error}`}`);
  }
  const failures = results.filter(({ ok }) => !ok).length;
  console.log(`\n${results.length - failures}/${results.length} offline checks passed. No Mainnet RPC or external gateway was contacted.`);
  if (failures > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error("Offline test runner failed:", error);
  process.exitCode = 1;
});
