#!/usr/bin/env node
"use strict";

// UnitedSOLANA (USOL) — Mainnet token logo and metadata upload (Irys).
//
// Uploads the existing project logo and the confirmed USOL metadata to Irys on
// Mainnet, then records the resulting image and metadata URIs in
// deployments/mainnet.json for the registration step.
//
// Dry run by default. `--execute` (plus the confirmation phrase) uploads and
// spends a small amount of Mainnet SOL to fund the upload.

const fs = require("fs");
const path = require("path");
const assert = require("assert");

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
const { loadState, saveState } = require("./lib/state");
const {
  readKeypair,
  assertAddress,
  describeKeypairFile
} = require("./lib/wallets");
const { heading, confirmExecution } = require("./lib/cli");

const RESOLVED_METADATA_PATH = path.join(
  path.dirname(config.STATE_PATH),
  "metadata.mainnet.json"
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

function loadUploadKeypair() {
  const feePayer = readKeypair(config.KEYPAIRS.feePayer, "fee payer");
  assertAddress(feePayer, config.WALLETS.feePayer, "fee payer");
  return feePayer;
}

function createUmiWithWallet(keypair) {
  const umi = createUmi(config.resolveRpcUrl());

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

async function main() {
  if (process.argv.includes("--self-test")) {
    return selfTest();
  }

  heading("UnitedSOLANA (USOL) — Mainnet logo and metadata upload");

  const state = loadState();

  console.log(`Network            Solana Mainnet (${config.NETWORK})`);
  console.log(`Storage            Irys Mainnet (${config.IRYS_ADDRESS})`);
  console.log(`Logo               ${config.LOGO_PATH}`);
  console.log(`Name               ${config.TOKEN.name}`);
  console.log(`Symbol             ${config.TOKEN.symbol}`);
  console.log(`Description        ${config.TOKEN.description}`);

  const logoBuffer = fs.readFileSync(config.LOGO_PATH);

  if (logoBuffer.length === 0) {
    throw new Error(`Logo file is empty: ${config.LOGO_PATH}`);
  }

  const metadata = buildMetadata();

  let keypair = null;
  let keypairError = null;

  try {
    keypair = loadUploadKeypair();
  } catch (error) {
    keypairError = error;
  }

  console.log(
    `Fee payer keypair  ${describeKeypairFile(config.KEYPAIRS.feePayer)} — ${config.KEYPAIRS.feePayer}`
  );

  if (keypairError) {
    console.log(`\nNOT READY: ${keypairError.message}`);
  } else {
    const umi = createUmiWithWallet(keypair);
    const estimate = await estimateCost(umi, logoBuffer, metadata);

    console.log(
      estimate === null
        ? "\nUpload cost estimate unavailable (Irys did not answer)."
        : `\nEstimated upload cost: ${estimate.toFixed(6)} SOL (paid by the fee payer)`
    );
  }

  if (state.metadataUri) {
    console.log(
      `\nA metadata URI is already recorded: ${state.metadataUri}\nRefusing to upload again. Clear it to start over.`
    );
    process.exitCode = 1;
    return;
  }

  const approved = await confirmExecution({
    action: "upload the USOL logo and metadata to Irys on Mainnet"
  });

  if (!approved) return;

  if (keypairError) {
    throw new Error(`${keypairError.message} Nothing was uploaded.`);
  }

  const umi = createUmiWithWallet(keypair);

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
    verified.image !== imageUri
  ) {
    throw new Error("Uploaded metadata did not read back with the expected values.");
  }

  state.imageUri = imageUri;
  state.metadataUri = metadataUri;
  state.status = "metadata-uploaded";
  saveState(state);

  fs.mkdirSync(path.dirname(RESOLVED_METADATA_PATH), { recursive: true });
  fs.writeFileSync(
    RESOLVED_METADATA_PATH,
    `${JSON.stringify(metadata, null, 2)}\n`
  );

  console.log("\nUpload verified. Recorded in deployments/mainnet.json.");
  console.log(`Logo URI       ${imageUri}`);
  console.log(`Metadata URI   ${metadataUri}`);
  console.log("Next: node register-metadata-mainnet.js");
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
