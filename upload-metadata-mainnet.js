#!/usr/bin/env node
"use strict";

// UnitedSOLANA (USOL) — Mainnet token logo and metadata upload (Irys).
//
// Uploads the existing project logo and the confirmed USOL metadata to Irys on
// Mainnet, then records the resulting image and metadata URIs in
// deployments/mainnet.json for the registration step.
//
// The mint must already exist and verify on-chain before anything is uploaded:
// metadata without a confirmed mint would describe a token that is not there.
//
// Dry run by default. `--execute` (plus the confirmation phrase) uploads and
// spends a small amount of Mainnet SOL.

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const { Keypair, PublicKey } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } = require("@solana/spl-token");

const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const {
  keypairIdentity,
  createGenericFile,
  createSignerFromKeypair
} = require("@metaplex-foundation/umi");
const {
  irysUploader
} = require("@metaplex-foundation/umi-uploader-irys/node");

const config = require("./config/mainnet");
const { loadState, saveState, assertStateWallets } = require("./lib/state");
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

const RESOLVED_METADATA_PATH = path.join(
  path.dirname(config.STATE_PATH),
  "metadata.mainnet.json"
);

// Offline tests read isolated fixtures, never the live deployment record.
const DEPLOYED_FIXTURE = path.join(
  __dirname,
  "test",
  "fixtures",
  "mainnet.deployed.json"
);

// Metadata is rebuilt from the confirmed config so no test-network URI from an
// earlier upload can be carried over.
function buildMetadata() {
  return {
    name: config.TOKEN.name,
    symbol: config.TOKEN.symbol,
    description: config.TOKEN.description,
    image: "",
    attributes: [],
    properties: {
      files: [],
      category: "image"
    }
  };
}

function loadMetadataTemplate() {
  const metadata = JSON.parse(
    fs.readFileSync(config.METADATA_TEMPLATE_PATH, "utf8")
  );

  if (
    metadata.name !== config.TOKEN.name ||
    metadata.symbol !== config.TOKEN.symbol ||
    metadata.description !== config.TOKEN.description
  ) {
    throw new Error(
      "metadata.json does not carry the confirmed USOL name, symbol and description."
    );
  }

  return metadata;
}

function loadUploadKeypair() {
  const feePayer = readKeypair(config.KEYPAIRS.feePayer, "fee payer");
  assertAddress(feePayer, config.WALLETS.feePayer, "fee payer");
  return feePayer;
}

function createUmiWithWallet(keypair, rpcUrl) {
  const umi = createUmi(rpcUrl);

  const signer = createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(keypair.secretKey)
  );

  umi.use(keypairIdentity(signer));
  umi.use(
    irysUploader({
      address: config.IRYS_ADDRESS
    })
  );

  return umi;
}

async function estimateCost(umi, logoBuffer, metadata) {
  try {
    const estimatedBytes =
      2000 +
      Math.max(80000, logoBuffer.length) +
      2000 +
      Math.max(80000, Buffer.byteLength(JSON.stringify(metadata)));

    const price = await umi.uploader.getUploadPriceFromBytes(estimatedBytes);
    return Number(price.basisPoints) / 1_000_000_000;
  } catch (error) {
    return null;
  }
}

// The mint, the holder's token account and the full supply must all verify
// before metadata can describe this token.
async function verifyMintAndSupply(connection, state) {
  await assertMintOnChain(connection, state.mintAddress);

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

  return tokenAccountAddress;
}

async function main() {
  if (process.argv.includes("--self-test")) {
    return selfTest();
  }

  heading("UnitedSOLANA (USOL) — Mainnet logo and metadata upload");

  const state = loadState();
  assertExecutionWallets(state);

  console.log(`Network            Solana Mainnet (${config.NETWORK})`);
  console.log(`Storage            Irys Mainnet (${config.IRYS_ADDRESS})`);
  console.log(`Logo               ${config.LOGO_PATH}`);
  console.log(`Name               ${config.TOKEN.name}`);
  console.log(`Symbol             ${config.TOKEN.symbol}`);
  console.log(`Description        ${config.TOKEN.description}`);
  console.log(`Mint               ${state.mintAddress}`);

  if (state.metadataUri) {
    throw new Error(
      `A metadata URI is already recorded: ${state.metadataUri}. Refusing to upload a second copy. Clear it only after confirming the recorded upload is unusable.`
    );
  }

  loadMetadataTemplate();

  const logoBuffer = fs.readFileSync(config.LOGO_PATH);

  if (logoBuffer.length === 0) {
    throw new Error(`Logo file is empty: ${config.LOGO_PATH}`);
  }

  const metadata = buildMetadata();
  const rpcUrl = config.resolveRpcUrl({ execute: wantsExecution() });
  const connection = config.createConnection(rpcUrl);

  console.log("\nVerifying the recorded mint on Mainnet…");
  const tokenAccountAddress = await verifyMintAndSupply(connection, state);
  console.log(`  Mint verified      ${state.mintAddress}`);
  console.log(`  Token account      ${tokenAccountAddress}`);
  console.log(`  Supply in holder   ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL`);

  let keypair = null;
  let keypairError = null;

  try {
    keypair = loadUploadKeypair();
  } catch (error) {
    keypairError = error;
  }

  console.log(
    `\nFee payer keypair  ${describeKeypairFile(config.KEYPAIRS.feePayer)} — ${config.KEYPAIRS.feePayer}`
  );

  if (keypairError) {
    console.log(`\nNOT READY: ${keypairError.message}`);
  } else {
    const umi = createUmiWithWallet(keypair, rpcUrl);
    const estimate = await estimateCost(umi, logoBuffer, metadata);

    console.log(
      estimate === null
        ? "\nUpload cost estimate unavailable (Irys did not answer)."
        : `\nEstimated upload cost: ${estimate.toFixed(6)} SOL (paid by the fee payer)`
    );
  }

  const approved = await confirmExecution({
    action: "upload the USOL logo and metadata to Irys on Mainnet"
  });

  if (!approved) return;

  if (keypairError) {
    throw new Error(`${keypairError.message} Nothing was uploaded.`);
  }

  await withDeploymentLock("metadata-upload", async () => {
    // Re-read and re-verify inside the lock so a concurrent run cannot change
    // the record between validation and upload.
    const current = loadState();

    if (current.metadataUri) {
      throw new Error(
        `A metadata URI is already recorded: ${current.metadataUri}. Nothing was uploaded.`
      );
    }

    assertExecutionWallets(current);
    config.assertOfficialMainnetRpcUrl(rpcUrl);
    await assertMainnetRpc(connection);
    await verifyMintAndSupply(connection, current);

    const umi = createUmiWithWallet(keypair, rpcUrl);

    const logoFile = createGenericFile(logoBuffer, "logo.png", {
      contentType: "image/png"
    });

    console.log("\nUploading logo…");
    const [imageUri] = await umi.uploader.upload([logoFile]);
    console.log(`Logo uploaded: ${imageUri}`);

    metadata.image = imageUri;
    metadata.properties.files = [{ uri: imageUri, type: "image/png" }];

    console.log("\nUploading metadata JSON…");
    const metadataUri = await umi.uploader.uploadJson(metadata);
    console.log(`Metadata uploaded: ${metadataUri}`);

    const response = await fetch(metadataUri);

    if (!response.ok) {
      throw new Error(
        `Metadata upload verification failed: HTTP ${response.status} for ${metadataUri}`
      );
    }

    const verified = await response.json();

    if (
      verified.name !== config.TOKEN.name ||
      verified.symbol !== config.TOKEN.symbol ||
      verified.image !== imageUri ||
      verified.description !== config.TOKEN.description
    ) {
      throw new Error(
        "Uploaded metadata did not read back with the expected name, symbol, description and image."
      );
    }

    current.imageUri = imageUri;
    current.metadataUri = metadataUri;
    current.status = "metadata-uploaded";
    saveState(current);

    fs.mkdirSync(path.dirname(RESOLVED_METADATA_PATH), { recursive: true });
    fs.writeFileSync(
      RESOLVED_METADATA_PATH,
      `${JSON.stringify(metadata, null, 2)}\n`
    );

    console.log("\nUpload verified. Recorded in deployments/mainnet.json.");
    console.log(`Logo URI       ${imageUri}`);
    console.log(`Metadata URI   ${metadataUri}`);
    console.log("Next: node register-metadata-mainnet.js");
  });
}

// ---------------------------------------------------------------------------
// Offline self-test.
// ---------------------------------------------------------------------------

function selfTest() {
  heading("USOL metadata upload self-test (offline — nothing is uploaded)");

  const results = [];
  const check = (label, fn) => {
    try {
      fn();
      results.push({ ok: true, label });
    } catch (error) {
      results.push({ ok: false, label: `${label}: ${error.message}` });
    }
  };

  check("metadata carries the confirmed name, symbol and description", () => {
    const metadata = buildMetadata();
    assert.strictEqual(metadata.name, "UnitedSOLANA");
    assert.strictEqual(metadata.symbol, "USOL");
    assert.strictEqual(metadata.description, config.TOKEN.description);
  });

  check("metadata.json template matches the confirmed token details", () => {
    loadMetadataTemplate();
  });

  check("metadata starts without any URI from an earlier network", () => {
    const metadata = buildMetadata();
    assert.strictEqual(metadata.image, "");
    assert.deepStrictEqual(metadata.properties.files, []);
  });

  check("the existing project logo is present and readable", () => {
    const logo = fs.readFileSync(config.LOGO_PATH);
    assert.ok(logo.length > 0);
    assert.strictEqual(logo.subarray(1, 4).toString("ascii"), "PNG");
  });

  check("upload targets Irys Mainnet", () => {
    const endpoint = new URL(config.IRYS_ADDRESS);
    assert.strictEqual(endpoint.protocol, "https:");
    assert.ok(endpoint.hostname.endsWith("irys.xyz"));
  });

  check("the deployed record already holds a metadata URI, so upload must refuse", () => {
    const state = loadState(DEPLOYED_FIXTURE);
    assert.strictEqual(state.mintAddress, config.DEPLOYMENT.mintAddress);
    assert.strictEqual(state.metadataUri, config.DEPLOYMENT.metadataUri);
  });

  check("a deployment record with changed wallets would be refused before uploading", () => {
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

  check("the holder token account is derived deterministically per mint and holder", () => {
    const mint = new PublicKey(config.DEPLOYMENT.mintAddress);
    const holder = new PublicKey(config.WALLETS.initialHolder);
    const otherHolder = new PublicKey(config.WALLETS.feePayer);

    const first = getAssociatedTokenAddressSync(mint, holder, false, TOKEN_PROGRAM_ID);
    const second = getAssociatedTokenAddressSync(mint, holder, false, TOKEN_PROGRAM_ID);
    const other = getAssociatedTokenAddressSync(mint, otherHolder, false, TOKEN_PROGRAM_ID);

    assert.ok(first.equals(second));
    assert.ok(!first.equals(other));
  });

  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label}`);
  }

  const failed = results.filter((result) => !result.ok).length;
  console.log(
    `\n${results.length - failed}/${results.length} checks passed. Nothing was uploaded or signed.`
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n${error.message || error}`);
  process.exitCode = 1;
});
