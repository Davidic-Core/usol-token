#!/usr/bin/env node
"use strict";

// UnitedSOLANA (USOL) — Metaplex metadata registration on Solana Mainnet.
//
// Registers the token name, symbol, logo/metadata URI and description for the
// mint recorded in deployments/mainnet.json.
//
// USOL is already registered on Mainnet: the metadata account and registration
// signature are recorded, so this script refuses to register a second time. The
// mint and freeze authorities are permanently revoked (null); HxDW holds only
// the Metaplex metadata update authority and cannot mint or freeze USOL.
//
// Every validation fails closed: a mint that does not match the confirmed
// configuration, an unreachable metadata URI, or metadata that is already
// registered stops the run before anything is signed.
//
// Dry run by default. `--execute` (plus the confirmation phrase) would send one
// registration transaction, and only if no metadata were recorded yet.

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const { PublicKey, Keypair } = require("@solana/web3.js");

const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const {
  keypairIdentity,
  publicKey,
  createSignerFromKeypair,
  percentAmount
} = require("@metaplex-foundation/umi");
const {
  mplTokenMetadata,
  createV1,
  findMetadataPda,
  fetchMetadataFromSeeds,
  TokenStandard
} = require("@metaplex-foundation/mpl-token-metadata");
const { base58 } = require("@metaplex-foundation/umi/serializers");

const config = require("./config/mainnet");
const {
  loadState,
  saveState,
  assertStateWallets,
  assertStateDeployment
} = require("./lib/state");
const { withDeploymentLock } = require("./lib/lock");
const {
  readKeypair,
  assertAddress,
  describeKeypairFile
} = require("./lib/wallets");
const { assertMainnetRpc } = require("./lib/rpc");
const { assertMintOnChain, assertHolderTokenAccount } = require("./lib/verify");
const {
  heading,
  confirmExecution,
  wantsExecution
} = require("./lib/cli");
const { assertExecutionWallets } = require("./lib/preflight");

function loadMetadataTemplate() {
  const metadata = JSON.parse(
    fs.readFileSync(config.METADATA_TEMPLATE_PATH, "utf8")
  );

  if (metadata.name !== config.TOKEN.name) {
    throw new Error(
      `metadata.json name is "${metadata.name}", expected "${config.TOKEN.name}".`
    );
  }

  if (metadata.symbol !== config.TOKEN.symbol) {
    throw new Error(
      `metadata.json symbol is "${metadata.symbol}", expected "${config.TOKEN.symbol}".`
    );
  }

  if (metadata.description !== config.TOKEN.description) {
    throw new Error(
      "metadata.json description does not match the confirmed USOL description."
    );
  }

  return metadata;
}

function loadRegistrationKeypairs() {
  const feePayer = readKeypair(config.KEYPAIRS.feePayer, "fee payer");
  assertAddress(feePayer, config.WALLETS.feePayer, "fee payer");

  const authority = readKeypair(config.KEYPAIRS.authority, "metadata update authority");
  assertAddress(
    authority,
    config.METADATA_UPDATE_AUTHORITY,
    "metadata update authority"
  );

  return { feePayer, authority };
}

function umiSigner(umi, keypair) {
  return createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(keypair.secretKey)
  );
}

function buildMetadataTransaction({
  umi,
  feePayerSigner,
  authoritySigner,
  mintAddress,
  metadataUri
}) {
  return createV1(umi, {
    mint: publicKey(mintAddress),
    authority: authoritySigner,
    payer: feePayerSigner,
    updateAuthority: authoritySigner,
    name: config.TOKEN.name,
    symbol: config.TOKEN.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    tokenStandard: TokenStandard.Fungible,
    isMutable: true
  });
}

function assertMetadataUriShape(metadataUri) {
  if (typeof metadataUri !== "string" || !metadataUri.startsWith("https://")) {
    throw new Error(`Metadata URI must be https, got "${metadataUri}".`);
  }
}

async function assertMetadataUri(metadataUri) {
  assertMetadataUriShape(metadataUri);

  const response = await fetch(metadataUri);

  if (!response.ok) {
    throw new Error(`Metadata URI returned HTTP ${response.status}.`);
  }

  const metadata = await response.json();

  if (
    metadata.name !== config.TOKEN.name ||
    metadata.symbol !== config.TOKEN.symbol ||
    metadata.description !== config.TOKEN.description ||
    !metadata.image
  ) {
    throw new Error(
      "Uploaded metadata does not carry the confirmed USOL name, symbol, description and image."
    );
  }

  return metadata;
}

function trimMetadataString(value) {
  return String(value ?? "").replace(/\0+$/, "");
}

async function assertMetadataRegistered(umi, mintAddress, metadataUri) {
  const onChain = await fetchMetadataFromSeeds(umi, {
    mint: publicKey(mintAddress)
  });

  if (trimMetadataString(onChain.name) !== config.TOKEN.name) {
    throw new Error(
      `On-chain metadata name is "${trimMetadataString(onChain.name)}", expected "${config.TOKEN.name}".`
    );
  }

  if (trimMetadataString(onChain.symbol) !== config.TOKEN.symbol) {
    throw new Error(
      `On-chain metadata symbol is "${trimMetadataString(onChain.symbol)}", expected "${config.TOKEN.symbol}".`
    );
  }

  if (onChain.uri !== metadataUri) {
    throw new Error(
      `On-chain metadata URI is "${onChain.uri}", expected the recorded "${metadataUri}".`
    );
  }

  if (
    trimMetadataString(onChain.updateAuthority) !==
    config.METADATA_UPDATE_AUTHORITY
  ) {
    throw new Error(
      `On-chain metadata update authority is ${onChain.updateAuthority}, expected ${config.METADATA_UPDATE_AUTHORITY}.`
    );
  }

  if (trimMetadataString(onChain.mint) !== mintAddress) {
    throw new Error(
      `On-chain metadata belongs to mint ${onChain.mint}, expected ${mintAddress}.`
    );
  }

  return onChain;
}

async function main() {
  if (process.argv.includes("--self-test")) {
    return selfTest();
  }

  const rpcUrl = config.resolveRpcUrl({ execute: wantsExecution() });
  const state = loadState();

  heading("UnitedSOLANA (USOL) — Mainnet metadata registration");

  assertExecutionWallets(state);

  console.log(`Network            Solana Mainnet (${config.NETWORK})`);
  console.log(`RPC                ${rpcUrl}`);
  console.log(`Name               ${config.TOKEN.name}`);
  console.log(`Symbol             ${config.TOKEN.symbol}`);
  console.log(`Mint               ${state.mintAddress}`);
  console.log(`Metadata URI       ${state.metadataUri || "not recorded"}`);

  if (!state.metadataUri) {
    throw new Error(
      "No Mainnet metadata URI is recorded in deployments/mainnet.json; refusing to register metadata without one."
    );
  }

  if (state.metadataAccount) {
    throw new Error(
      `Metadata is already recorded at ${state.metadataAccount} for this mint. Refusing to register it twice.`
    );
  }

  loadMetadataTemplate();

  let keypairs = null;
  let keypairError = null;

  try {
    keypairs = loadRegistrationKeypairs();
  } catch (error) {
    keypairError = error;
  }

  console.log(
    `Fee payer keypair  ${describeKeypairFile(config.KEYPAIRS.feePayer)} — ${config.KEYPAIRS.feePayer}`
  );
  console.log(
    `Authority keypair  ${describeKeypairFile(config.KEYPAIRS.authority)} — ${config.KEYPAIRS.authority}`
  );

  if (keypairError) {
    console.log(`\nNOT READY: ${keypairError.message}`);
  }

  const connection = config.createConnection(rpcUrl);

  // Fail closed: every check below must pass before anything is signed.
  console.log("\nVerifying the mint and metadata on Mainnet…");
  await assertMintOnChain(connection, state.mintAddress);

  if (state.associatedTokenAccount) {
    await assertHolderTokenAccount(connection, {
      mintAddress: state.mintAddress,
      tokenAccountAddress: state.associatedTokenAccount,
      expectedAmount: config.rawInitialSupply()
    });
  }

  await assertMetadataUri(state.metadataUri);
  console.log("  Mint, supply and metadata URI verified.");

  const umi = createUmi(rpcUrl);
  umi.use(mplTokenMetadata());

  const metadataPda = findMetadataPda(umi, {
    mint: publicKey(state.mintAddress)
  })[0];

  const existing = await connection.getAccountInfo(
    new PublicKey(metadataPda),
    "confirmed"
  );

  if (existing) {
    throw new Error(
      `Metadata already exists at ${metadataPda} for this mint. Refusing to overwrite it.`
    );
  }

  console.log(`\nMetadata account   ${metadataPda} (does not exist yet)`);
  console.log("\nRequired signers:");
  console.log("  Fee payer        pays for the metadata account");
  console.log("  Update authority authorizes the metadata (not a mint authority)");

  const approved = await confirmExecution({
    action: "register the USOL Metaplex metadata"
  });

  if (!approved) return;

  if (keypairError) {
    throw new Error(`${keypairError.message} Nothing was submitted.`);
  }

  await withDeploymentLock("metadata-registration", async () => {
    const current = loadState();

    if (current.metadataAccount) {
      throw new Error(
        `Metadata is already recorded at ${current.metadataAccount}. Nothing was submitted.`
      );
    }

    assertExecutionWallets(current);
    config.assertOfficialMainnetRpcUrl(rpcUrl);
    await assertMainnetRpc(connection);
    await assertMintOnChain(connection, current.mintAddress);
    await assertMetadataUri(current.metadataUri);

    const feePayerSigner = umiSigner(umi, keypairs.feePayer);
    const authoritySigner = umiSigner(umi, keypairs.authority);

    umi.use(keypairIdentity(feePayerSigner));

    console.log("\nSubmitting metadata registration…");

    const result = await buildMetadataTransaction({
      umi,
      feePayerSigner,
      authoritySigner,
      mintAddress: current.mintAddress,
      metadataUri: current.metadataUri
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(result.signature)[0];

    current.metadataAccount = metadataPda;
    current.transactions.metadataRegistration = signature;
    current.status = "metadata-registration-needs-review";
    saveState(current);

    // Only a read-back that matches the configuration marks the deployment
    // ready. A mismatch keeps the "needs review" status and stops the run.
    try {
      await assertMetadataRegistered(
        umi,
        current.mintAddress,
        current.metadataUri
      );
      await assertMintOnChain(connection, current.mintAddress);

      if (current.associatedTokenAccount) {
        await assertHolderTokenAccount(connection, {
          mintAddress: current.mintAddress,
          tokenAccountAddress: current.associatedTokenAccount,
          expectedAmount: config.rawInitialSupply()
        });
      }
    } catch (error) {
      throw new Error(
        `The registration transaction ${signature} was sent but on-chain verification failed: ${error.message}\nMint: ${current.mintAddress}\nMetadata account: ${metadataPda}`
      );
    }

    current.status = config.DEPLOYMENT.status;
    saveState(current);

    console.log("\nMetadata registered and verified on Mainnet.");
    console.log(`Mint               ${current.mintAddress}`);
    console.log(`Metadata account   ${metadataPda}`);
    console.log(`Transaction        ${signature}`);
    console.log(config.explorerTransactionUrl(signature));
    console.log("Mint authority     REVOKED (permanent)");
    console.log("Freeze authority   REVOKED (permanent)");
    console.log(`Metadata update authority ${config.METADATA_UPDATE_AUTHORITY}`);
    console.log(
      `\nSupply of ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL remains in ${config.WALLETS.initialHolder}.`
    );
    console.log("Nothing has been distributed or pooled.");
  });
}

// ---------------------------------------------------------------------------
// Offline self-test: validates the metadata template, the fail-closed URI
// check and the instruction wiring (program, accounts, signers) without any
// network request.
// ---------------------------------------------------------------------------

const FIXTURE_DIR = path.join(__dirname, "test", "fixtures");
const DEPLOYED_FIXTURE = path.join(FIXTURE_DIR, "mainnet.deployed.json");
const BLANK_FIXTURE = path.join(FIXTURE_DIR, "mainnet.blank.json");

function selfTest() {
  heading("USOL metadata self-test (offline — nothing is signed or sent)");

  const results = [];
  const check = (label, fn) => {
    try {
      fn();
      results.push({ ok: true, label });
    } catch (error) {
      results.push({ ok: false, label: `${label}: ${error.message}` });
    }
  };

  check("metadata template matches the confirmed USOL details", () => {
    loadMetadataTemplate();
  });

  check("changed wallet assignments are refused before registration", () => {
    assert.deepStrictEqual(
      config.assertConfirmedWallets(),
      config.CONFIRMED_WALLETS
    );

    assert.throws(
      () =>
        config.assertConfirmedWallets({
          ...config.WALLETS,
          initialHolder: Keypair.generate().publicKey.toBase58()
        }),
      /differ from the confirmed Mainnet assignments/
    );

    const state = loadState(DEPLOYED_FIXTURE);
    assert.strictEqual(assertStateWallets(state), state);
    assert.throws(
      () =>
        assertStateWallets({
          ...state,
          wallets: {
            ...state.wallets,
            feePayer: Keypair.generate().publicKey.toBase58()
          }
        }),
      /differ from the confirmed assignments/
    );
  });

  check("metadata URIs that are not https are rejected", () => {
    assert.throws(
      () => assertMetadataUriShape("http://example.com/usol.json"),
      /must be https/
    );
    assert.throws(() => assertMetadataUriShape(""), /must be https/);
    assert.doesNotThrow(() =>
      assertMetadataUriShape("https://example.com/usol.json")
    );
  });

  check("the deployed record already holds the mint, metadata URI and account", () => {
    const state = loadState(DEPLOYED_FIXTURE);

    assert.strictEqual(state.mintAddress, config.DEPLOYMENT.mintAddress);
    assert.strictEqual(state.metadataUri, config.DEPLOYMENT.metadataUri);
    assert.strictEqual(state.metadataAccount, config.DEPLOYMENT.metadataAccount);
    assert.strictEqual(
      state.transactions.metadataRegistration,
      config.DEPLOYMENT.transactions.metadataRegistration
    );

    // Registration must refuse this record rather than register a second time.
    assert.ok(state.metadataAccount, "a second registration must be refused");
  });

  check("a blank deployment record is refused as damaged, not as a new launch", () => {
    const blank = loadState(BLANK_FIXTURE);
    assert.strictEqual(blank.mintAddress, null);
    assert.throws(
      () => assertStateDeployment(blank),
      /does not record a mint/
    );
  });

  const mintAddress = Keypair.generate().publicKey.toBase58();

  const umi = createUmi(config.MAINNET_RPC_URL);
  umi.use(mplTokenMetadata());

  const feePayerKeypair = Keypair.generate();
  const authorityKeypair = Keypair.generate();
  const feePayerSigner = umiSigner(umi, feePayerKeypair);
  const authoritySigner = umiSigner(umi, authorityKeypair);

  umi.use(keypairIdentity(feePayerSigner));

  check("metadata instruction targets the Metaplex program for the right mint", () => {
    const builder = buildMetadataTransaction({
      umi,
      feePayerSigner,
      authoritySigner,
      mintAddress,
      metadataUri: "https://example.invalid/usol.json"
    });

    const wrapped = builder.items.find((item) => item && item.instruction);

    assert.ok(wrapped, "createV1 must produce an instruction");

    const { programId, keys } = wrapped.instruction;

    assert.strictEqual(programId, config.METADATA_PROGRAM_ID);

    const metadataPda = findMetadataPda(umi, { mint: publicKey(mintAddress) })[0];

    assert.ok(
      keys.some((key) => key.pubkey === metadataPda),
      "metadata PDA must be a writable account"
    );
    assert.ok(
      keys.some((key) => key.pubkey === mintAddress),
      "mint must be present"
    );
    assert.ok(
      keys.some((key) => key.pubkey === authoritySigner.publicKey && key.isSigner),
      "mint authority must sign"
    );
    assert.ok(
      keys.some((key) => key.pubkey === feePayerSigner.publicKey && key.isSigner),
      "fee payer must sign"
    );
  });

  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label}`);
  }

  const failed = results.filter((result) => !result.ok).length;
  console.log(
    `\n${results.length - failed}/${results.length} checks passed. No network requests and no transaction submitted.`
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n${error.message || error}`);
  process.exitCode = 1;
});
