"use strict";

// Keypair handling for the Mainnet scripts.
//
// Keypairs are read from files on the owner's machine only. Secret bytes are
// never printed, logged, copied into the repository or written anywhere except
// the secure directory the owner controls.

const fs = require("fs");
const path = require("path");
const { Keypair } = require("@solana/web3.js");

function readKeypair(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `${label} keypair not found at ${filePath}. ` +
        "Place the exported keypair there (chmod 600) or set its path with an USOL_*_KEYPAIR environment variable."
    );
  }

  const stats = fs.statSync(filePath);
  const mode = stats.mode & 0o777;

  if (mode & 0o077) {
    console.warn(
      `WARNING: ${label} keypair ${filePath} is readable by other users (mode ${mode.toString(8)}). Run: chmod 600 ${filePath}`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} keypair at ${filePath} is not valid JSON.`);
  }

  // Accept both a bare secret-key array (solana-keygen) and { secretKey: [...] }.
  const secret = Array.isArray(parsed) ? parsed : parsed.secretKey;

  if (!Array.isArray(secret) || secret.length !== 64) {
    throw new Error(
      `${label} keypair at ${filePath} must be a 64-byte secret key array.`
    );
  }

  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

// Every script refuses to run with a keypair that is not the confirmed wallet.
function assertAddress(keypair, expected, label) {
  const actual = keypair.publicKey.toBase58();

  if (actual !== expected) {
    throw new Error(
      `${label} keypair resolves to ${actual}, but the confirmed Mainnet ${label} is ${expected}. Refusing to continue.`
    );
  }

  return actual;
}

function describeKeypairFile(filePath) {
  if (!fs.existsSync(filePath)) return "missing";

  const mode = fs.statSync(filePath).mode & 0o777;
  return `present (mode ${mode.toString(8)})`;
}

function writeKeypair(filePath, keypair) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });

  fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)), {
    mode: 0o600
  });

  fs.chmodSync(filePath, 0o600);
}

module.exports = {
  readKeypair,
  assertAddress,
  describeKeypairFile,
  writeKeypair
};
