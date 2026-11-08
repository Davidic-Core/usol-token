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
const checks = [];
function test(name, fn) { try { fn(); checks.push([true, name]); } catch (error) { checks.push([false, `${name}: ${error.message}`]); } }

// Retired historical utilities must have no imports or side effects, independent
// of deployment.json, key availability, or network access.
const retired = ["revoke-mint-authority.js", "revoke-freeze-authority.js", "upload-metadata-mainnet.js", "register-metadata-mainnet.js"];
for (const filename of retired) {
  test(`${filename} is inert and exits without keys or network`, () => {
    const source = fs.readFileSync(path.join(root, filename), "utf8");
    assert.doesNotMatch(source, /require\s*\(/);
    assert.doesNotMatch(source, /readFileSync|fetch\s*\(|Connection|Keypair|Transaction|partialSign|sendRawTransaction|sendAndConfirm|uploader|createV1/);
    const run = spawnSync(process.execPath, [path.join(root, filename)], {
      encoding: "utf8",
      timeout: 5000,
      env: { ...process.env, USOL_FEE_PAYER_KEYPAIR: "/missing/key", USOL_AUTHORITY_KEYPAIR: "/missing/key", SOLANA_RPC_URL: "https://invalid.invalid" }
    });
    assert.strictEqual(run.status, 0, run.stderr);
    assert.match(run.stdout, /HISTORICAL \/ DISABLED/);
  });
}

test("deployed fixture passes canonical state checks without using the live record", () => {
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
test("mint verifier rejects wrong mint fields and accepts the expected state", () => {
  const mint = { decimals: 9, supply: config.rawInitialSupply(), mintAuthority: null, freezeAuthority: null };
  assert.strictEqual(verify.assertMintFields(mint), mint);
  assert.throws(() => verify.assertMintFields({ ...mint, decimals: 8 }), /decimals/);
  assert.throws(() => verify.assertMintFields({ ...mint, supply: 1n }), /supply/);
  assert.throws(() => verify.assertMintFields({ ...mint, mintAuthority: { toBase58: () => "active" } }), /Mint authority is active/);
  assert.throws(() => verify.assertMintFields({ ...mint, freezeAuthority: { toBase58: () => "active" } }), /Freeze authority is active/);
});
test("metadata account, mint, name, symbol and URI are pinned", () => {
  assertMetadata();
  function assertMetadata() {
    assert.doesNotThrow(() => verify.assertMetadataAccount({ mintAddress: config.DEPLOYMENT.mintAddress, metadataAccount: config.DEPLOYMENT.metadataAccount, metadataUri: config.DEPLOYMENT.metadataUri }));
    assert.throws(() => verify.assertMetadataAccount({ mintAddress: record.wallets.feePayer, metadataAccount: config.DEPLOYMENT.metadataAccount, metadataUri: config.DEPLOYMENT.metadataUri }), /mint/);
    const metadata = { mint: config.DEPLOYMENT.mintAddress, name: config.TOKEN.name, symbol: config.TOKEN.symbol, uri: config.DEPLOYMENT.metadataUri, address: config.DEPLOYMENT.metadataAccount };
    assert.doesNotThrow(() => verify.assertMetadataFields(metadata));
    for (const [field, value] of [["mint", record.wallets.feePayer], ["name", "wrong"], ["symbol", "wrong"], ["uri", "https://example.invalid"]]) {
      assert.throws(() => verify.assertMetadataFields({ ...metadata, [field]: value }), /mismatch/);
    }
  }
});
test("metadata JSON logo/name/symbol/description are checked offline", () => {
  const metadata = { name: config.TOKEN.name, symbol: config.TOKEN.symbol, description: config.TOKEN.description, image: config.DEPLOYMENT.imageUri };
  assert.strictEqual(verify.assertMetadataJson(metadata), metadata);
  for (const [field, value] of [["image", "https://example.invalid/logo.png"], ["name", "wrong"], ["symbol", "wrong"]]) {
    assert.throws(() => verify.assertMetadataJson({ ...metadata, [field]: value }), /mismatch/);
  }
});
test("metadata gateway outage is distinguished from content mismatch", async () => {
  await assert.rejects(() => verify.fetchAndAssertMetadataJson(config.DEPLOYMENT.metadataUri, async () => { throw new Error("offline"); }), /gateway unavailable/);
  await assert.rejects(() => verify.fetchAndAssertMetadataJson(config.DEPLOYMENT.metadataUri, async () => ({ ok: true, json: async () => ({ name: "wrong" }) })), /Metadata JSON name mismatch/);
});
test("verifier has no transaction path or deployment-record writer", () => {
  const source = fs.readFileSync(path.join(root, "deploy-mainnet.js"), "utf8");
  assert.doesNotMatch(source, /sendRawTransaction|sendAndConfirm|partialSign|signTransaction|createMint|mintTo|createV1|uploader\.upload|saveState|writeFileSync/);
  assert.doesNotMatch(source, /launch-transaction/);
});

test("deployment record discrepancy is reported and never repaired", () => {
  assert.throws(() => stateModule.assertStateIntegrity({ ...record, imageUri: "https://example.invalid/logo.png" }), /imageUri/);
  assert.strictEqual(stateModule.saveState, undefined);
  const source = fs.readFileSync(path.join(root, "deploy-mainnet.js"), "utf8");
  assert.doesNotMatch(source, /saveState|writeFileSync/);
});

(async () => {
  // Re-run the async gateway check which is registered above as an explicit
  // awaited test; all other test cases are synchronous.
  for (const [ok, name] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  const failures = checks.filter(([ok]) => !ok).length;
  console.log(`\n${checks.length - failures}/${checks.length} offline checks passed. No Mainnet RPC or external gateway was contacted.`);
  if (failures) process.exitCode = 1;
})();
