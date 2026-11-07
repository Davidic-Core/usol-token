#!/usr/bin/env node
"use strict";

// UnitedSOLANA (USOL) — Solana Mainnet deployment verification.
//
// USOL already exists on Solana Mainnet. The mint, its Metaplex metadata and the
// 1,000,000,000 USOL supply were created once, and both the mint and freeze
// authorities were permanently revoked afterwards. This script therefore never
// creates a mint, never revokes an authority and never signs or submits a
// transaction: it reads deployments/mainnet.json and verifies that the record
// and the on-chain state still describe the deployed token.
//
// `--self-test` runs the offline checks (configuration, wallet pinning, RPC
// rules, deployment record integrity and the verification logic) with no
// network request and nothing spent.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { Keypair, PublicKey } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");

const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const {
  mplTokenMetadata,
  fetchMetadataFromSeeds
} = require("@metaplex-foundation/mpl-token-metadata");
const { publicKey } = require("@metaplex-foundation/umi");

const config = require("./config/mainnet");
const {
  loadState,
  saveState,
  assertStateWallets,
  assertStateDeployment
} = require("./lib/state");
const { assertMainnetRpc, feeForTransaction } = require("./lib/rpc");
const {
  assertMintFields,
  assertMintOnChain,
  assertMetadataAccount,
  assertMetadataFields,
  assertHolderTokenAccount,
  assertTokenAccountFields
} = require("./lib/verify");
const { buildLaunchTransaction } = require("./lib/launch-transaction");
const { heading } = require("./lib/cli");

// Isolated fixtures for the offline tests: one records the real deployment, the
// other models a damaged pre-launch record. The live record is never used by a
// test, so running the tests cannot change what the scripts read.
const FIXTURE_DIR = path.join(__dirname, "test", "fixtures");
const DEPLOYED_FIXTURE = path.join(FIXTURE_DIR, "mainnet.deployed.json");
const BLANK_FIXTURE = path.join(FIXTURE_DIR, "mainnet.blank.json");

function validateConfiguration() {
  const problems = [];

  if (config.NETWORK !== "mainnet-beta") {
    problems.push(`network must be mainnet-beta, found "${config.NETWORK}"`);
  }

  try {
    config.assertValidWallets();
  } catch (error) {
    problems.push(error.message);
  }

  try {
    config.assertDeployedMintAddress(config.DEPLOYMENT.mintAddress);
  } catch (error) {
    problems.push(error.message);
  }

  if (config.AUTHORITIES.mintAuthority !== null) {
    problems.push("the mint authority must be recorded as revoked (null)");
  }

  if (config.AUTHORITIES.freezeAuthority !== null) {
    problems.push("the freeze authority must be recorded as revoked (null)");
  }

  if (!fs.existsSync(config.LOGO_PATH)) {
    problems.push(`logo not found at ${config.LOGO_PATH}`);
  }

  if (problems.length > 0) {
    throw new Error(`Mainnet configuration is invalid:\n- ${problems.join("\n- ")}`);
  }
}

function printConfiguration(rpcUrl) {
  heading("UnitedSOLANA (USOL) — Mainnet deployment verification");

  console.log(`Network            Solana Mainnet (${config.NETWORK})`);
  console.log(`RPC                ${rpcUrl}`);
  console.log(`Token name         ${config.TOKEN.name}`);
  console.log(`Symbol             ${config.TOKEN.symbol}`);
  console.log(`Standard           ${config.TOKEN.standard}`);
  console.log(`Decimals           ${config.TOKEN.decimals}`);
  console.log(
    `Total supply       ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL`
  );
  console.log(`Mint address       ${config.DEPLOYMENT.mintAddress}`);
  console.log(`Fee payer          ${config.WALLETS.feePayer}`);
  console.log(`Original holder    ${config.WALLETS.initialHolder}`);
  console.log("Mint authority     REVOKED (permanent)");
  console.log("Freeze authority   REVOKED (permanent)");
}

function printAllocation() {
  heading("Planned allocation (recorded plan — not proof of transfers)");

  for (const entry of config.ALLOCATION) {
    console.log(
      `  ${entry.amount.toLocaleString("en-US").padStart(13)} USOL  ${entry.label}`
    );
  }

  console.log(
    `  ${config.allocationTotal().toLocaleString("en-US").padStart(13)} USOL  Total (minted entirely to the HxDW wallet at creation)`
  );
  console.log(
    "\nNothing has been transferred, pooled or distributed by these scripts."
  );
}

// Reads the deployed Metaplex metadata account and checks mint, account and URI.
async function assertMetadataRegisteredOnChain(umi, state) {
  const onChain = await fetchMetadataFromSeeds(umi, {
    mint: publicKey(state.mintAddress)
  });

  return assertMetadataFields(
    {
      mint: onChain.mint,
      uri: onChain.uri,
      address: config.metadataAccountAddress(state.mintAddress)
    },
    {
      mintAddress: state.mintAddress,
      metadataUri: config.DEPLOYMENT.metadataUri,
      expectedAccount: config.DEPLOYMENT.metadataAccount
    }
  );
}

// Verifies the existing deployment. No transaction is built, signed or sent.
async function verifyRecordedDeployment(state, rpcUrl) {
  const connection = config.createConnection(rpcUrl);

  assertStateWallets(state);
  assertStateDeployment(state);

  heading("Existing Mainnet deployment found");
  console.log(`Recorded mint      ${state.mintAddress}`);
  console.log(`Status             ${state.status}`);

  await assertMainnetRpc(connection);

  const mintInfo = await assertMintOnChain(connection, state.mintAddress);

  assertMetadataAccount({
    mintAddress: state.mintAddress,
    metadataAccount: state.metadataAccount,
    metadataUri: state.metadataUri
  });

  const tokenAccountAddress =
    state.associatedTokenAccount ||
    getAssociatedTokenAddressSync(
      new PublicKey(state.mintAddress),
      new PublicKey(config.WALLETS.initialHolder),
      false,
      TOKEN_PROGRAM_ID
    ).toBase58();

  await assertHolderTokenAccount(connection, {
    mintAddress: state.mintAddress,
    tokenAccountAddress,
    expectedAmount: config.rawInitialSupply()
  });

  const umi = createUmi(rpcUrl);
  umi.use(mplTokenMetadata());
  await assertMetadataRegisteredOnChain(umi, state);

  const needsTokenAccount = !state.associatedTokenAccount;
  const needsStatusCorrection = state.status !== config.DEPLOYMENT.status;

  if (needsTokenAccount || needsStatusCorrection) {
    if (needsTokenAccount) state.associatedTokenAccount = tokenAccountAddress;
    if (needsStatusCorrection) state.status = config.DEPLOYMENT.status;
    saveState(state);
  }

  console.log("\nVerified on Mainnet:");
  console.log(`  Decimals           ${mintInfo.decimals}`);
  console.log(
    `  Supply             ${Number(mintInfo.supply) / 10 ** mintInfo.decimals} USOL`
  );
  console.log("  Mint authority     REVOKED (null)");
  console.log("  Freeze authority   REVOKED (null)");
  console.log(`  Metadata account   ${state.metadataAccount}`);
  console.log(`  Metadata URI       ${state.metadataUri}`);
  console.log(`  Token account      ${tokenAccountAddress}`);
  console.log(`  Holder             ${config.WALLETS.initialHolder}`);
  console.log(config.explorerAddressUrl(state.mintAddress));

  console.log(
    "\nThe deployment is final: both authorities are permanently revoked, so no further USOL can be minted, frozen or unfrozen. No transaction was built or submitted."
  );
}

async function main() {
  if (process.argv.includes("--self-test")) {
    return selfTest();
  }

  // Verification only: no execution flag exists, so no code path here can sign.
  const rpcUrl = config.resolveRpcUrl();

  validateConfiguration();
  printConfiguration(rpcUrl);
  printAllocation();

  const state = loadState();

  if (!state.mintAddress) {
    throw new Error(
      `deployments/mainnet.json does not record a mint address. USOL already exists on Mainnet as ${config.DEPLOYMENT.mintAddress}; restore the record instead of creating another mint.`
    );
  }

  return verifyRecordedDeployment(state, rpcUrl);
}

// ---------------------------------------------------------------------------
// Offline self-test: proves configuration, wallet pinning, RPC rules, record
// integrity and the verification logic without any network request.
// ---------------------------------------------------------------------------

async function selfTest() {
  heading("USOL Mainnet self-test (offline — nothing is signed or sent)");

  const results = [];

  const check = (label, fn) => {
    try {
      fn();
      results.push({ ok: true, label });
    } catch (error) {
      results.push({ ok: false, label: `${label}: ${error.message}` });
    }
  };

  const checkAsync = async (label, fn) => {
    try {
      await fn();
      results.push({ ok: true, label });
    } catch (error) {
      results.push({ ok: false, label: `${label}: ${error.message}` });
    }
  };

  const withRpcOverride = (value, fn) => {
    const original = process.env.USOL_RPC_URL;
    process.env.USOL_RPC_URL = value;

    try {
      return fn();
    } finally {
      if (original === undefined) delete process.env.USOL_RPC_URL;
      else process.env.USOL_RPC_URL = original;
    }
  };

  check("configuration matches the confirmed token details and wallets", () => {
    validateConfiguration();
  });

  check("both confirmed wallets are valid on-curve wallet addresses", () => {
    config.assertValidWalletAddress(config.WALLETS.feePayer, "fee payer");
    config.assertValidWalletAddress(config.WALLETS.initialHolder, "original holder");
  });

  check("malformed and off-curve addresses are rejected", () => {
    assert.throws(
      () => config.assertValidWalletAddress("not-a-wallet", "fee payer"),
      /not a base58/
    );
    assert.throws(() =>
      config.assertValidWalletAddress(
        config.WALLETS.feePayer.slice(0, -1),
        "fee payer"
      )
    );
    const [offCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("usol-off-curve-check")],
      new PublicKey(config.METADATA_PROGRAM_ID)
    );
    assert.throws(
      () =>
        config.assertValidWalletAddress(offCurve.toBase58(), "off-curve account"),
      /on-curve/
    );
  });

  check("planned allocation totals exactly the 1,000,000,000 USOL supply", () => {
    assert.strictEqual(config.allocationTotal(), config.TOKEN.initialSupply);
    for (const entry of config.ALLOCATION) {
      assert.ok(entry.amount > 0n, `${entry.label} must be positive`);
    }
  });

  check("a changed confirmed wallet assignment is refused", () => {
    assert.deepStrictEqual(
      config.assertConfirmedWallets(),
      config.CONFIRMED_WALLETS
    );

    for (const role of ["feePayer", "initialHolder"]) {
      const swapped = {
        ...config.WALLETS,
        [role]: Keypair.generate().publicKey.toBase58()
      };

      assert.throws(
        () => config.assertConfirmedWallets(swapped),
        /differ from the confirmed Mainnet assignments/,
        `${role} must not be swappable`
      );
    }
  });

  check("a different mint address is never accepted as USOL", () => {
    assert.strictEqual(
      config.assertDeployedMintAddress(config.DEPLOYMENT.mintAddress),
      config.DEPLOYMENT.mintAddress
    );

    assert.throws(
      () =>
        config.assertDeployedMintAddress(
          Keypair.generate().publicKey.toBase58()
        ),
      /second token/
    );
  });

  check("recorded mint and metadata account describe the deployed USOL token", () => {
    const state = loadState(DEPLOYED_FIXTURE);

    assert.strictEqual(assertStateWallets(state), state);
    assert.strictEqual(assertStateDeployment(state), state);

    assert.strictEqual(state.mintAddress, config.DEPLOYMENT.mintAddress);
    assert.strictEqual(
      state.metadataAccount,
      config.metadataAccountAddress(config.DEPLOYMENT.mintAddress)
    );
    assert.strictEqual(state.metadataAccount, config.DEPLOYMENT.metadataAccount);
    assert.strictEqual(state.metadataUri, config.DEPLOYMENT.metadataUri);
    assert.strictEqual(state.status, "mainnet-deployed-and-verified");
  });

  check("a blank or tampered deployment record is refused, never re-created", () => {
    const blank = loadState(BLANK_FIXTURE);
    const deployed = loadState(DEPLOYED_FIXTURE);

    assert.throws(() => assertStateDeployment(blank), /does not record a mint/);
    assert.throws(
      () =>
        assertStateDeployment({
          ...deployed,
          mintAddress: Keypair.generate().publicKey.toBase58()
        }),
      /Refusing to continue/
    );
    assert.throws(
      () =>
        assertStateDeployment({
          ...deployed,
          metadataUri: "https://example.invalid/usol.json"
        }),
      /metadata URI/
    );
  });

  check("a deployment record with changed wallets is refused", () => {
    const state = loadState(DEPLOYED_FIXTURE);
    assert.strictEqual(assertStateWallets(state), state);

    const tampered = {
      ...state,
      wallets: {
        ...state.wallets,
        initialHolder: Keypair.generate().publicKey.toBase58()
      }
    };

    assert.throws(
      () => assertStateWallets(tampered),
      /differ from the confirmed assignments/
    );
  });

  // The deployed mint fields: nine decimals, one billion tokens and both
  // authorities revoked. These stubs stand in for a getMint() response.
  const deployedMint = {
    decimals: config.TOKEN.decimals,
    supply: config.rawInitialSupply(),
    mintAuthority: null,
    freezeAuthority: null
  };

  check("the deployed mint has 9 decimals, 1,000,000,000 USOL and revoked authorities", () => {
    assert.strictEqual(
      assertMintFields(deployedMint, {
        mintAddress: config.DEPLOYMENT.mintAddress,
        decimals: config.TOKEN.decimals,
        rawAmount: config.rawInitialSupply()
      }),
      deployedMint
    );
    assert.strictEqual(config.rawInitialSupply(), 1_000_000_000n * 10n ** 9n);
  });

  check("an active mint or freeze authority fails verification", () => {
    const holderAuthority = new PublicKey(config.WALLETS.initialHolder);

    assert.throws(
      () =>
        assertMintFields(
          { ...deployedMint, mintAuthority: holderAuthority },
          {
            mintAddress: config.DEPLOYMENT.mintAddress,
            decimals: config.TOKEN.decimals,
            rawAmount: config.rawInitialSupply()
          }
        ),
      /Mint authority is/
    );

    assert.throws(
      () =>
        assertMintFields(
          { ...deployedMint, freezeAuthority: holderAuthority },
          {
            mintAddress: config.DEPLOYMENT.mintAddress,
            decimals: config.TOKEN.decimals,
            rawAmount: config.rawInitialSupply()
          }
        ),
      /Freeze authority is/
    );

    assert.throws(
      () =>
        assertMintFields(
          { ...deployedMint, decimals: 6 },
          {
            mintAddress: config.DEPLOYMENT.mintAddress,
            decimals: config.TOKEN.decimals,
            rawAmount: config.rawInitialSupply()
          }
        ),
      /decimals/
    );

    assert.throws(
      () =>
        assertMintFields(
          { ...deployedMint, supply: 1n },
          {
            mintAddress: config.DEPLOYMENT.mintAddress,
            decimals: config.TOKEN.decimals,
            rawAmount: config.rawInitialSupply()
          }
        ),
      /Supply is/
    );
  });

  check("the metadata account must be the PDA of the deployed mint", () => {
    assert.strictEqual(
      config.metadataAccountAddress(config.DEPLOYMENT.mintAddress),
      config.DEPLOYMENT.metadataAccount
    );

    assert.notStrictEqual(
      config.metadataAccountAddress(
        Keypair.generate().publicKey.toBase58()
      ),
      config.DEPLOYMENT.metadataAccount,
      "an unrelated mint must not derive the USOL metadata account"
    );

    assert.throws(
      () =>
        assertMetadataAccount({
          mintAddress: config.DEPLOYMENT.mintAddress,
          metadataAccount: Keypair.generate().publicKey.toBase58(),
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

  check("on-chain metadata fields must match the deployed mint and URI", () => {
    const fields = {
      mint: config.DEPLOYMENT.mintAddress,
      uri: config.DEPLOYMENT.metadataUri,
      address: config.DEPLOYMENT.metadataAccount
    };
    const expected = {
      mintAddress: config.DEPLOYMENT.mintAddress,
      metadataUri: config.DEPLOYMENT.metadataUri,
      expectedAccount: config.DEPLOYMENT.metadataAccount
    };

    assert.strictEqual(assertMetadataFields(fields, expected), fields);

    assert.throws(
      () =>
        assertMetadataFields(
          { ...fields, mint: Keypair.generate().publicKey.toBase58() },
          expected
        ),
      /Metadata belongs to mint/
    );

    assert.throws(
      () =>
        assertMetadataFields(
          { ...fields, uri: "https://example.invalid/usol.json" },
          expected
        ),
      /Metadata URI is/
    );
  });

  check("token account checks reject the wrong mint, owner and balance", () => {
    const mint = new PublicKey(config.DEPLOYMENT.mintAddress);
    const holder = new PublicKey(config.WALLETS.initialHolder);
    const tokenAccountAddress = Keypair.generate().publicKey.toBase58();
    const rawAmount = config.rawInitialSupply();
    const account = { mint, owner: holder, amount: rawAmount };

    assert.strictEqual(
      assertTokenAccountFields(account, {
        mintAddress: mint.toBase58(),
        tokenAccountAddress,
        expectedAmount: rawAmount
      }).amount,
      rawAmount
    );

    assert.throws(
      () =>
        assertTokenAccountFields(
          { ...account, mint: Keypair.generate().publicKey },
          { mintAddress: mint.toBase58(), tokenAccountAddress }
        ),
      /belongs to mint/
    );

    assert.throws(
      () =>
        assertTokenAccountFields(
          { ...account, owner: Keypair.generate().publicKey },
          { mintAddress: mint.toBase58(), tokenAccountAddress }
        ),
      /is owned by/
    );

    assert.throws(
      () =>
        assertTokenAccountFields(account, {
          mintAddress: mint.toBase58(),
          tokenAccountAddress,
          expectedAmount: rawAmount + 1n
        }),
      /holds/
    );
  });

  check("a non-Mainnet RPC override is rejected", () => {
    assert.throws(
      () => withRpcOverride("https://api.testnet.solana.com", () => config.resolveRpcUrl()),
      /refusing/
    );
  });

  check("only the exact official HTTPS Mainnet origin is accepted", () => {
    assert.strictEqual(
      withRpcOverride("https://api.mainnet-beta.solana.com", () =>
        config.resolveRpcUrl()
      ),
      config.MAINNET_RPC_URL
    );

    assert.strictEqual(
      withRpcOverride("https://api.mainnet-beta.solana.com/", () =>
        config.resolveRpcUrl()
      ),
      config.MAINNET_RPC_URL
    );

    for (const rejected of [
      "http://api.mainnet-beta.solana.com",
      "https://api.mainnet-beta.solana.com:9443",
      "https://api.mainnet-beta.solana.com/rpc",
      "https://api.mainnet-beta.solana.com.evil.example",
      "https://user:pass@api.mainnet-beta.solana.com"
    ]) {
      assert.throws(
        () => withRpcOverride(rejected, () => config.resolveRpcUrl()),
        /refusing/,
        `${rejected} must be refused`
      );
    }
  });

  check("localhost and 127.0.0.1 are allowed only for non-submitting runs", () => {
    for (const local of ["http://localhost:8899", "http://127.0.0.1:8899"]) {
      assert.strictEqual(
        withRpcOverride(local, () => config.resolveRpcUrl()),
        local,
        `${local} is allowed for a dry run`
      );

      assert.throws(
        () =>
          withRpcOverride(local, () => config.resolveRpcUrl({ execute: true })),
        /Live execution requires/,
        `${local} must be refused when execution is requested`
      );
    }
  });

  await checkAsync("the Mainnet genesis hash is required and other clusters are refused", async () => {
    const mainnetStub = {
      getGenesisHash: async () => config.MAINNET_GENESIS_HASH
    };
    const otherClusterStub = {
      getGenesisHash: async () => "11111111111111111111111111111111"
    };

    assert.strictEqual(
      await assertMainnetRpc(mainnetStub),
      config.MAINNET_GENESIS_HASH
    );
    await assert.rejects(
      () => assertMainnetRpc(otherClusterStub),
      /not Solana Mainnet/
    );
  });

  await checkAsync("the fee still comes from the message, not a hardcoded constant", async () => {
    // Historical launch transaction, kept as an offline audit of the original
    // atomic design. No script can send it: USOL already exists.
    const preview = buildLaunchTransaction({
      mintKeypair: Keypair.generate(),
      feePayer: Keypair.generate().publicKey,
      mintAuthority: Keypair.generate().publicKey,
      freezeAuthority: Keypair.generate().publicKey,
      holder: new PublicKey(config.WALLETS.initialHolder),
      decimals: config.TOKEN.decimals,
      rawAmount: config.rawInitialSupply(),
      mintRentLamports: 1_461_600
    }).transaction;

    const feeStub = {
      getLatestBlockhash: async () => ({
        blockhash: "11111111111111111111111111111111"
      }),
      getFeeForMessage: async () => ({ value: 7_500 })
    };

    const { feeLamports } = await feeForTransaction(feeStub, preview);
    assert.strictEqual(feeLamports, 7_500);

    const nullFeeStub = {
      getLatestBlockhash: async () => ({
        blockhash: "11111111111111111111111111111111"
      }),
      getFeeForMessage: async () => ({ value: null })
    };

    await assert.rejects(
      () => feeForTransaction(nullFeeStub, preview),
      /refusing to guess/
    );
  });

  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label}`);
  }

  const failed = results.filter((result) => !result.ok).length;
  console.log(
    `\n${results.length - failed}/${results.length} checks passed. No network requests, signatures or SOL spent.`
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n${error.message || error}`);
  process.exitCode = 1;
});
