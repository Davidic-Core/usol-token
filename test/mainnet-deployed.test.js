#!/usr/bin/env node
"use strict";

// Offline test for the deployed USOL state. No network request, no signature,
// no transaction: it checks the deployment record, the fixed token facts and the
// verification rules against isolated fixtures.
//
// Run with: npm run test:deployment

const assert = require("assert");
const path = require("path");

const { PublicKey } = require("@solana/web3.js");

const config = require("../config/mainnet");
const { loadState, assertStateWallets, assertStateDeployment } = require("../lib/state");
const {
  assertMintFields,
  assertMetadataAccount,
  assertMetadataFields,
  assertTokenAccountFields
} = require("../lib/verify");

const FIXTURE_DIR = path.join(__dirname, "fixtures");
const DEPLOYED = path.join(FIXTURE_DIR, "mainnet.deployed.json");
const BLANK = path.join(FIXTURE_DIR, "mainnet.blank.json");

const results = [];

function check(label, fn) {
  try {
    fn();
    results.push({ ok: true, label });
  } catch (error) {
    results.push({ ok: false, label: `${label}: ${error.message}` });
  }
}

const rawSupply = 1_000_000_000n * 10n ** 9n;

// 1: the recorded deployment is the deployed USOL token.
check("deployment record matches the deployed USOL mint and metadata", () => {
  const state = loadState(DEPLOYED);

  assertStateWallets(state);
  assertStateDeployment(state);

  assert.strictEqual(state.network, "mainnet-beta");
  assert.strictEqual(state.status, "mainnet-deployed-and-verified");
  assert.strictEqual(
    state.mintAddress,
    "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG"
  );
  assert.strictEqual(
    state.metadataAccount,
    "4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc"
  );
  assert.strictEqual(
    state.metadataUri,
    "https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY"
  );
  assert.strictEqual(
    state.imageUri,
    "https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo"
  );
});

// 2: the live record on disk records the same deployment.
check("live deployments/mainnet.json records the existing deployment", () => {
  const state = loadState();

  assertStateWallets(state);
  assertStateDeployment(state);
  assert.strictEqual(state.mintAddress, config.DEPLOYMENT.mintAddress);
  assert.strictEqual(state.status, config.DEPLOYMENT.status);
});

// 3: the deployed token facts.
check("USOL is a 9-decimal, 1,000,000,000 token", () => {
  assert.strictEqual(config.TOKEN.decimals, 9);
  assert.strictEqual(config.TOKEN.initialSupply, 1_000_000_000n);
  assert.strictEqual(config.rawInitialSupply(), rawSupply);
});

// 4: both authorities are revoked on-chain (null), never a wallet.
check("mint and freeze authorities are null (permanently revoked)", () => {
  assert.strictEqual(config.AUTHORITIES.mintAuthority, null);
  assert.strictEqual(config.AUTHORITIES.freezeAuthority, null);
  assert.strictEqual(config.AUTHORITIES.revoked, true);
  assert.ok(
    config.AUTHORITIES.mintRevocationTransaction,
    "the mint revocation transaction must be recorded"
  );
  assert.ok(
    config.AUTHORITIES.freezeRevocationTransaction,
    "the freeze revocation transaction must be recorded"
  );

  const mint = {
    decimals: 9,
    supply: rawSupply,
    mintAuthority: null,
    freezeAuthority: null
  };

  assert.strictEqual(
    assertMintFields(mint, {
      mintAddress: config.DEPLOYMENT.mintAddress,
      decimals: 9,
      rawAmount: rawSupply
    }),
    mint
  );
});

// 5: verification refuses any active authority or wrong supply.
check("an active mint or freeze authority fails verification", () => {
  const holder = new PublicKey(config.WALLETS.initialHolder);
  const expected = {
    mintAddress: config.DEPLOYMENT.mintAddress,
    decimals: 9,
    rawAmount: rawSupply
  };
  const mint = {
    decimals: 9,
    supply: rawSupply,
    mintAuthority: null,
    freezeAuthority: null
  };

  assert.throws(
    () => assertMintFields({ ...mint, mintAuthority: holder }, expected),
    /Mint authority is/
  );
  assert.throws(
    () => assertMintFields({ ...mint, freezeAuthority: holder }, expected),
    /Freeze authority is/
  );
  assert.throws(
    () => assertMintFields({ ...mint, supply: 0n }, expected),
    /Supply is/
  );
  assert.throws(
    () => assertMintFields({ ...mint, decimals: 6 }, expected),
    /decimals/
  );
});

// 6: the metadata account is the Metaplex PDA of the deployed mint.
check("metadata account is the PDA of the deployed mint, with the recorded URI", () => {
  assert.strictEqual(
    config.metadataAccountAddress(config.DEPLOYMENT.mintAddress),
    config.DEPLOYMENT.metadataAccount
  );

  assertMetadataAccount({
    mintAddress: config.DEPLOYMENT.mintAddress,
    metadataAccount: config.DEPLOYMENT.metadataAccount,
    metadataUri: config.DEPLOYMENT.metadataUri
  });

  assert.throws(
    () =>
      assertMetadataAccount({
        mintAddress: config.DEPLOYMENT.mintAddress,
        metadataAccount: "4GGuwKMeqeN8c5tnhFyN3qK2715BNTrJPjZMYZiJpuS7",
        metadataUri: config.DEPLOYMENT.metadataUri
      }),
    /Metadata account is/
  );

  assert.throws(
    () =>
      assertMetadataAccount({
        mintAddress: config.DEPLOYMENT.mintAddress,
        metadataAccount: config.DEPLOYMENT.metadataAccount,
        metadataUri: "https://example.invalid/usol.json"
      }),
    /Metadata URI is/
  );
});

// 7: on-chain metadata fields must match the deployed mint and URI.
check("on-chain metadata must belong to the mint and carry the recorded URI", () => {
  const expected = {
    mintAddress: config.DEPLOYMENT.mintAddress,
    metadataUri: config.DEPLOYMENT.metadataUri,
    expectedAccount: config.DEPLOYMENT.metadataAccount
  };
  const fields = {
    mint: config.DEPLOYMENT.mintAddress,
    uri: config.DEPLOYMENT.metadataUri,
    address: config.DEPLOYMENT.metadataAccount
  };

  assert.strictEqual(assertMetadataFields(fields, expected), fields);
  assert.throws(
    () =>
      assertMetadataFields(
        { ...fields, mint: "FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU" },
        expected
      ),
    /Metadata belongs to mint/
  );
});

// 8: the whole supply is still in the recorded token account.
check("the original holder's token account holds the full supply", () => {
  const account = {
    mint: new PublicKey(config.DEPLOYMENT.mintAddress),
    owner: new PublicKey(config.WALLETS.initialHolder),
    amount: rawSupply
  };

  assertTokenAccountFields(account, {
    mintAddress: config.DEPLOYMENT.mintAddress,
    tokenAccountAddress:
      "4GGuwKMeqeN8c5tnhFyN3qK2715BNTrJPjZMYZiJpuS7",
    expectedAmount: rawSupply
  });

  assert.throws(
    () =>
      assertTokenAccountFields(
        {
          ...account,
          owner: new PublicKey(config.WALLETS.feePayer)
        },
        {
          mintAddress: config.DEPLOYMENT.mintAddress,
          tokenAccountAddress:
            "4GGuwKMeqeN8c5tnhFyN3qK2715BNTrJPjZMYZiJpuS7",
          expectedAmount: rawSupply
        }
      ),
    /is owned by/
  );
});

// 9: HxDW is a holder, not an authority. The config has no authority wallet.
check("HxDW and FRPP are wallets only, not mint or freeze authorities", () => {
  assert.strictEqual(
    config.WALLETS.initialHolder,
    "HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT"
  );
  assert.strictEqual(
    config.WALLETS.feePayer,
    "FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU"
  );

  const authorityKeys = [
    "mintAuthority",
    "freezeAuthority"
  ].filter((key) => Object.prototype.hasOwnProperty.call(config.WALLETS, key));

  assert.deepStrictEqual(authorityKeys, []);
});

// 10: obsolete / damaged records cannot start a second token.
check("a blank or tampered record is refused instead of creating a mint", () => {
  const blank = loadState(BLANK);
  const deployed = loadState(DEPLOYED);

  assert.strictEqual(blank.mintAddress, null);
  assert.throws(() => assertStateDeployment(blank), /does not record a mint/);

  assert.throws(
    () =>
      assertStateDeployment({
        ...deployed,
        mintAddress: "FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU"
      }),
    /Refusing to continue/
  );

  assert.throws(
    () =>
      config.assertDeployedMintAddress(
        "FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU"
      ),
    /second token/
  );
});

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label}`);
}

const failed = results.filter((result) => !result.ok).length;
console.log(
  `\n${results.length - failed}/${results.length} checks passed. Offline only: no network request and no transaction submitted.`
);

if (failed > 0) process.exitCode = 1;
