"use strict";

// UnitedSOLANA (USOL) — Solana Mainnet configuration.
//
// This is the only network the active project targets. There is deliberately
// no cluster selector and no fallback: every deployment script imports the
// values below, so nothing can accidentally point at a test network.
//
// Keypair material NEVER lives here or anywhere in this repository. The scripts
// only read keypair files from the owner's machine (paths below, overridable by
// environment variable) and print public addresses — never secret bytes.

const os = require("os");
const path = require("path");
const { Connection, PublicKey } = require("@solana/web3.js");

const NETWORK = "mainnet-beta";
const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";

// Token details, exactly as confirmed for the Mainnet launch.
const TOKEN = {
  name: "UnitedSOLANA",
  symbol: "USOL",
  standard: "Classic SPL Token",
  decimals: 9,
  initialSupply: 1_000_000_000n,
  description:
    "UnitedSOLANA (USOL) is a high-speed community and utility token built on the Solana blockchain. Designed to facilitate seamless decentralized trading, liquidity pairing, and ecosystem transaction fees across Solana dApps"
};

// Confirmed wallet assignments. Do not change these.
// The fee payer pays transaction fees and rents; the HxDW wallet is the initial
// holder and keeps the mint and freeze authorities.
const WALLETS = {
  feePayer: "FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU",
  initialHolder: "HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT",
  mintAuthority: "HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT",
  freezeAuthority: "HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT"
};

const REPO_ROOT = path.resolve(__dirname, "..");

// Existing project logo, re-uploaded for the Mainnet metadata.
const LOGO_PATH = path.join(REPO_ROOT, "logo.png");

// Metadata template (name, symbol, description). Image and file URIs are filled
// in by the Mainnet upload script.
const METADATA_TEMPLATE_PATH = path.join(REPO_ROOT, "metadata.json");

// Deployment record. `mintAddress` stays null until the Mainnet mint has been
// created and confirmed; the deploy script is the only writer.
const STATE_PATH = path.join(REPO_ROOT, "deployments", "mainnet.json");

// Keypairs live outside the repository, in the owner's home directory.
const KEYPAIR_DIR = path.join(
  os.homedir(),
  ".config",
  "unitedsolana",
  "mainnet"
);

const KEYPAIRS = {
  feePayer:
    process.env.USOL_FEE_PAYER_KEYPAIR ||
    path.join(KEYPAIR_DIR, "fee-payer.json"),
  authority:
    process.env.USOL_AUTHORITY_KEYPAIR ||
    path.join(KEYPAIR_DIR, "authority.json"),
  mint: path.join(KEYPAIR_DIR, "mint-keypair.json")
};

const IRYS_ADDRESS = process.env.USOL_IRYS_ADDRESS || "https://node1.irys.xyz";

// The owner must type this exact phrase before any Mainnet transaction is sent.
const CONFIRMATION_PHRASE = "LAUNCH USOL ON MAINNET";

const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

function isMainnetUrl(url) {
  try {
    return new URL(url).hostname === "api.mainnet-beta.solana.com";
  } catch (error) {
    return false;
  }
}

// The official Mainnet endpoint. USOL_RPC_URL exists only so the owner can run
// the scripts against a local validator for a dry run; anything else is refused
// so the project cannot be pointed at another Solana network.
function resolveRpcUrl() {
  const override = process.env.USOL_RPC_URL;

  if (!override) return MAINNET_RPC_URL;

  if (isMainnetUrl(override)) return override;

  let hostname = null;
  try {
    hostname = new URL(override).hostname;
  } catch (error) {
    hostname = null;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") return override;

  throw new Error(
    `USOL_RPC_URL may only be the official Mainnet endpoint or a local validator; refusing "${override}".`
  );
}

// A public RPC can stall; every request is aborted after this long instead of
// leaving a dry run hanging.
const RPC_TIMEOUT_MS = Number(process.env.USOL_RPC_TIMEOUT_MS || 15000);

function rpcFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS)
  });
}

function createConnection(rpcUrl) {
  return new Connection(rpcUrl, {
    commitment: "confirmed",
    fetch: rpcFetch,
    disableRetryOnRateLimit: true
  });
}

function isValidAddress(value) {
  try {
    new PublicKey(value);
    return true;
  } catch (error) {
    return false;
  }
}

function explorerAddressUrl(address) {
  return `https://explorer.solana.com/address/${address}`;
}

function explorerTransactionUrl(signature) {
  return `https://explorer.solana.com/tx/${signature}`;
}

module.exports = {
  NETWORK,
  MAINNET_RPC_URL,
  TOKEN,
  WALLETS,
  LOGO_PATH,
  METADATA_TEMPLATE_PATH,
  STATE_PATH,
  KEYPAIR_DIR,
  KEYPAIRS,
  IRYS_ADDRESS,
  CONFIRMATION_PHRASE,
  METADATA_PROGRAM_ID,
  resolveRpcUrl,
  createConnection,
  isValidAddress,
  explorerAddressUrl,
  explorerTransactionUrl
};
