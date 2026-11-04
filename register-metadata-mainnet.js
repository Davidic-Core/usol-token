#!/usr/bin/env node
"use strict";

// UnitedSOLANA (USOL) — Metaplex metadata registration on Solana Mainnet.
//
// Registers the token name, symbol, logo/metadata URI and description for the
// mint recorded in deployments/mainnet.json. The mint and freeze authorities stay
// with the confirmed HxDW wallet; nothing is revoked.
//
// Dry run by default. `--execute` (plus the confirmation phrase) sends one
// transaction, signed by the fee payer and the mint authority.

const fs = require("fs");
const assert = require("assert");

const { PublicKey, Keypair } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getMint } = require("@solana/spl-token");

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
  TokenStandard
} = require("@metaplex-foundation/mpl-token-metadata");
const { base58 } = require("@metaplex-foundation/umi/serializers");

const config = require("./config/mainnet");
const { loadState, saveState } = require("./lib/state");
const {
  readKeypair,
  assertAddress,
  describeKeypairFile
} = require("./lib/wallets");
const { heading, confirmExecution } = require("./lib/cli");

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

  const authority = readKeypair(config.KEYPAIRS.authority, "mint authority");
  assertAddress(authority, config.WALLETS.mintAuthority, "mint authority");

  return { feePayer, authority };
}

function umiSigner(umi, keypair) {
  return createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(keypair.secretKey)
  );
}

function buildMetadataTransaction({ umi, feePayerSigner, authoritySigner, mintAddress, metadataUri }) {
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

async function assertMintReady(connection, mintAddress) {
  const mint = new PublicKey(mintAddress);
  const account = await connection.getAccountInfo(mint, "confirmed");

  if (!account) {
    throw new Error(
      `Mint ${mintAddress} does not exist on Mainnet yet. Create it first with deploy-mainnet.js.`
    );
  }

  if (!account.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error(`${mintAddress} is not a Classic SPL Token mint.`);
  }

  const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);
  const mintAuthority = mintInfo.mintAuthority?.toBase58() || null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() || null;

  if (mintInfo.decimals !== config.TOKEN.decimals) {
    throw new Error(
      `Mint has ${mintInfo.decimals} decimals, expected ${config.TOKEN.decimals}.`
    );
  }

  if (mintAuthority !== config.WALLETS.mintAuthority) {
    throw new Error(
      `Mint authority is ${mintAuthority}, expected ${config.WALLETS.mintAuthority}.`
    );
  }

  if (freezeAuthority !== config.WALLETS.freezeAuthority) {
    throw new Error(
      `Freeze authority is ${freezeAuthority}, expected ${config.WALLETS.freezeAuthority}.`
    );
  }

  return mintInfo;
}

async function assertMetadataUri(metadataUri) {
  if (!metadataUri.startsWith("https://")) {
    throw new Error(`Metadata URI must be https, got "${metadataUri}".`);
  }

  const response = await fetch(metadataUri);

  if (!response.ok) {
    throw new Error(`Metadata URI returned HTTP ${response.status}.`);
  }

  const metadata = await response.json();

  if (
    metadata.name !== config.TOKEN.name ||
    metadata.symbol !== config.TOKEN.symbol ||
    !metadata.image
  ) {
    throw new Error(
      "Uploaded metadata does not carry the confirmed USOL name, symbol and image."
    );
  }

  return metadata;
}

async function main() {
  if (process.argv.includes("--self-test")) {
    return selfTest();
  }

  const rpcUrl = config.resolveRpcUrl();
  const state = loadState();

  heading("UnitedSOLANA (USOL) — Mainnet metadata registration");
  console.log(`Network            Solana Mainnet (${config.NETWORK})`);
  console.log(`RPC                ${rpcUrl}`);
  console.log(`Name               ${config.TOKEN.name}`);
  console.log(`Symbol             ${config.TOKEN.symbol}`);
  console.log(`Mint               ${state.mintAddress || "not created yet"}`);
  console.log(`Metadata URI       ${state.metadataUri || "not uploaded yet"}`);

  if (!state.mintAddress) {
    throw new Error(
      "No Mainnet mint address is recorded in deployments/mainnet.json. Create the mint first; registration cannot run before it exists."
    );
  }

  if (!state.metadataUri) {
    throw new Error(
      "No Mainnet metadata URI is recorded. Run upload-metadata-mainnet.js first."
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

  try {
    await assertMintReady(connection, state.mintAddress);
    const metadata = await assertMetadataUri(state.metadataUri);
    console.log(`\nMetadata verified: ${metadata.name} (${metadata.symbol}), image present.`);
  } catch (error) {
    console.log(`\nPreflight warning: ${error.message}`);
  }

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
  console.log("  Mint authority   authorizes the metadata and keeps update authority");

  const approved = await confirmExecution({
    action: "register the USOL Metaplex metadata"
  });

  if (!approved) return;

  if (keypairError) {
    throw new Error(`${keypairError.message} Nothing was submitted.`);
  }

  const feePayerSigner = umiSigner(umi, keypairs.feePayer);
  const authoritySigner = umiSigner(umi, keypairs.authority);

  umi.use(keypairIdentity(feePayerSigner));

  console.log("\nSubmitting metadata registration…");

  const result = await buildMetadataTransaction({
    umi,
    feePayerSigner,
    authoritySigner,
    mintAddress: state.mintAddress,
    metadataUri: state.metadataUri
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(result.signature)[0];

  state.metadataAccount = metadataPda;
  state.status = "ready-for-liquidity-and-distribution";
  state.transactions.metadataRegistration = signature;
  saveState(state);

  const confirmed = await connection.getAccountInfo(
    new PublicKey(metadataPda),
    "confirmed"
  );

  if (!confirmed) {
    throw new Error(
      `The registration transaction ${signature} was sent but the metadata account is not visible yet. Check the explorer before retrying.`
    );
  }

  console.log("\nMetadata registered and verified on Mainnet.");
  console.log(`Mint               ${state.mintAddress}`);
  console.log(`Metadata account   ${metadataPda}`);
  console.log(`Transaction        ${signature}`);
  console.log(config.explorerTransactionUrl(signature));
  console.log("\nMint and freeze authorities remain active.");
}

// ---------------------------------------------------------------------------
// Offline self-test: validates the metadata template and the instruction
// wiring (program, accounts, signers) without any network request.
// ---------------------------------------------------------------------------

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

  const mintAddress = Keypair.generate().publicKey.toBase58();

  check("no mint address is recorded before the token is created", () => {
    const state = loadState();
    assert.strictEqual(state.mintAddress, null, "mintAddress must stay null until creation");
    assert.strictEqual(state.transactions.metadataRegistration, null);
  });

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
