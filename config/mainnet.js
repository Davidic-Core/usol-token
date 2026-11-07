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

// The only endpoint live execution may use: HTTPS and exactly this origin.
const MAINNET_RPC_ORIGIN = "https://api.mainnet-beta.solana.com";

// A local validator is allowed for dry runs that never submit a transaction.
const LOCAL_RPC_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

// The genesis hash identifies the Mainnet cluster. An RPC that reports any
// other value is not Solana Mainnet, whatever hostname it was reached through.
const MAINNET_GENESIS_HASH =
  "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

// Token details, exactly as deployed on Solana Mainnet.
const TOKEN = {
  name: "UnitedSOLANA",
  symbol: "USOL",
  standard: "Classic SPL Token",
  decimals: 9,
  initialSupply: 1_000_000_000n,
  description:
    "UnitedSOLANA (USOL) is a high-speed community and utility token built on the Solana blockchain. Designed to facilitate seamless decentralized trading, liquidity pairing, and ecosystem transaction fees across Solana dApps"
};

// USOL already exists on Solana Mainnet. These values are final on-chain facts:
// the mint, its metadata and its supply were created once, and both the mint and
// freeze authorities were permanently revoked afterwards. Nothing in this
// repository may create another USOL mint or restore an authority.
const DEPLOYMENT = Object.freeze({
  status: "mainnet-deployed-and-verified",
  mintAddress: "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG",
  metadataAccount: "4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc",
  imageUri:
    "https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo",
  metadataUri:
    "https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY",
  transactions: Object.freeze({
    mintCreation:
      "3N1UJdVAC8AGiCe9mJetrZHzBNW3aZTnAgfqtjoDMQey91jphBri5SGXsFBzt1cdnQAUtaA54Sv9k211EiJoHdUY",
    metadataRegistration:
      "2LKc5pLimSyiAQhCsUYpYNvjySjJZ8asmHo8qtopf3J6wvgqF2Abx1oYVBLK2gUT3niS4CKyvDoXJShuoJuEuD8C"
  })
});

// The mint and freeze authorities no longer exist. `null` is the on-chain
// value for both: no keypair can mint additional USOL or freeze an account.
const AUTHORITIES = Object.freeze({
  mintAuthority: null,
  freezeAuthority: null,
  revoked: true,
  mintRevocationTransaction:
    "3N5WpNkkJQ3uSEtGBBxU7z5mkcesJnZaVyShb1mMhRPYWsVNXdYYYE8YbZieSZkreMfkReFuRY4aQqMvYz26dCAe",
  freezeRevocationTransaction:
    "3ZjBcDEMmoYBSwD8y2GyJVkgxkGyWJQpc4aEowXmrn7bQ3upzeHyxpB2hQhNEADBiDotCmngFDMqUxkXp8kR2JJ8"
});

// The two wallet assignments confirmed by the project owner. This literal is the
// pin: `WALLETS` below must match it exactly before anything can run. Editing
// `WALLETS` alone is therefore not enough to move USOL to another wallet, and
// the mismatch is reported as an error instead of being accepted.
// The fee payer pays transaction fees and rents; HxDW is the original holder of
// the supply. Neither wallet is, or may become, a mint or freeze authority.
const CONFIRMED_WALLETS = Object.freeze({
  feePayer: "FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU",
  initialHolder: "HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT"
});

const WALLETS = {
  feePayer: CONFIRMED_WALLETS.feePayer,
  initialHolder: CONFIRMED_WALLETS.initialHolder
};

// The Metaplex metadata has its own update authority, separate from the token
// authorities: it can change metadata only and cannot create or freeze USOL.
// HxDW signed the metadata registration, so it is the authority used by the
// historical registration script.
const METADATA_UPDATE_AUTHORITY = WALLETS.initialHolder;

// Planned distribution of the deployed supply. This is a record only: the whole
// supply was minted to the HxDW wallet and nothing has been transferred or
// pooled. It is a plan, not proof that any transfer happened.
const ALLOCATION = [
  {
    key: "liquidityReserve",
    label: "Initial liquidity reserve (future USOL/SOL and USOL/USDC pools)",
    amount: 300_000_000n
  },
  {
    key: "treasury",
    label: "Treasury and reserves",
    amount: 250_000_000n
  },
  {
    key: "ecosystem",
    label: "Ecosystem and community",
    amount: 200_000_000n
  },
  {
    key: "distribution",
    label: "Future distribution",
    amount: 150_000_000n
  },
  {
    key: "retained",
    label: "Retained allocation",
    amount: 100_000_000n
  }
];

const REPO_ROOT = path.resolve(__dirname, "..");

// Existing project logo, re-uploaded for the Mainnet metadata.
const LOGO_PATH = path.join(REPO_ROOT, "logo.png");

// Metadata template (name, symbol, description). Image and file URIs are filled
// in by the Mainnet upload script.
const METADATA_TEMPLATE_PATH = path.join(REPO_ROOT, "metadata.json");

// Deployment record. `mintAddress` records the existing Mainnet mint; a record
// without one is treated as damaged and is never a reason to create a new mint.
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

const WALLET_LABELS = {
  feePayer: "fee payer",
  initialHolder: "original holder"
};

const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Strict wallet validation. A wallet address must be base58, decode to exactly
// 32 bytes, re-encode to the identical string (no truncated or non-canonical
// encodings) and lie on the ed25519 curve, i.e. be a real wallet rather than a
// program-derived address.
function assertValidWalletAddress(value, label) {
  if (typeof value !== "string" || !BASE58_PATTERN.test(value)) {
    throw new Error(
      `${label} is not a base58 Solana address: ${String(value)}`
    );
  }

  let key;
  try {
    key = new PublicKey(value);
  } catch (error) {
    throw new Error(`${label} is not a valid Solana public key: ${value}`);
  }

  if (key.toBase58() !== value) {
    throw new Error(`${label} is not canonically encoded base58: ${value}`);
  }

  if (key.toBytes().length !== 32) {
    throw new Error(`${label} does not decode to 32 bytes: ${value}`);
  }

  if (!PublicKey.isOnCurve(key.toBytes())) {
    throw new Error(
      `${label} is not an on-curve ed25519 wallet address: ${value}`
    );
  }

  return key;
}

// Exact pin against the four confirmed assignments. Validity alone is not
// enough: an address swap must stop every script, even when the replacement is
// a perfectly valid Solana wallet.
function assertConfirmedWallets(wallets = WALLETS) {
  const problems = [];

  for (const [key, label] of Object.entries(WALLET_LABELS)) {
    if (wallets[key] !== CONFIRMED_WALLETS[key]) {
      problems.push(
        `${label} is ${String(wallets[key])}, confirmed ${CONFIRMED_WALLETS[key]}`
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Wallet assignments differ from the confirmed Mainnet assignments:\n- ${problems.join(
        "\n- "
      )}\nRefusing to continue.`
    );
  }

  return wallets;
}

// Every configured wallet is strictly validated, and the roles must not overlap
// in a way that would let one wallet pay for and hold the whole supply.
function assertValidWallets() {
  assertConfirmedWallets();

  for (const [key, label] of Object.entries(WALLET_LABELS)) {
    assertValidWalletAddress(WALLETS[key], label);
  }

  if (WALLETS.feePayer === WALLETS.initialHolder) {
    throw new Error("fee payer and original holder must be different wallets");
  }

  return WALLETS;
}

// The recorded mint must be the USOL mint that already exists on Mainnet. A
// different address is never treated as "the token to create": it is refused.
function assertDeployedMintAddress(mintAddress) {
  if (mintAddress !== DEPLOYMENT.mintAddress) {
    throw new Error(
      `Recorded mint is ${String(mintAddress)}, but USOL already exists on Mainnet as ${DEPLOYMENT.mintAddress}. A different mint would be a second token; refusing to continue.`
    );
  }

  return mintAddress;
}

// The Metaplex metadata account is a PDA of the mint. Deriving it here lets the
// deployment record be checked offline against the deployed mint.
function metadataAccountAddress(mintAddress) {
  const programId = new PublicKey(METADATA_PROGRAM_ID);
  const mint = new PublicKey(mintAddress);

  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), programId.toBuffer(), mint.toBuffer()],
    programId
  );

  return address.toBase58();
}

function rawInitialSupply() {
  return TOKEN.initialSupply * 10n ** BigInt(TOKEN.decimals);
}

function allocationTotal() {
  return ALLOCATION.reduce((total, entry) => total + entry.amount, 0n);
}

// The exact official Mainnet origin: HTTPS, no credentials, no port of its own,
// no path, query or fragment. Anything that merely contains the hostname (an
// http URL, a look-alike domain, a different port, a proxy path) is refused.
function isOfficialMainnetRpcUrl(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch (error) {
    return false;
  }

  return (
    parsed.protocol === "https:" &&
    parsed.origin === MAINNET_RPC_ORIGIN &&
    parsed.username === "" &&
    parsed.password === "" &&
    (parsed.pathname === "/" || parsed.pathname === "") &&
    parsed.search === "" &&
    parsed.hash === ""
  );
}

function isLocalRpcUrl(url) {
  try {
    return LOCAL_RPC_HOSTS.has(new URL(url).hostname);
  } catch (error) {
    return false;
  }
}

// The official Mainnet endpoint only. USOL_RPC_URL exists solely so the owner can
// run a local validator for a dry run that never submits; local endpoints are
// refused outright as soon as live execution is requested, and every other
// endpoint is refused always.
function resolveRpcUrl({ execute = false } = {}) {
  const override = process.env.USOL_RPC_URL;

  if (!override) {
    if (execute) assertOfficialMainnetRpcUrl(MAINNET_RPC_URL);
    return MAINNET_RPC_URL;
  }

  if (isOfficialMainnetRpcUrl(override)) return MAINNET_RPC_URL;

  if (isLocalRpcUrl(override)) {
    const parsed = new URL(override);

    if (execute) {
      throw new Error(
        `Live execution requires ${MAINNET_RPC_ORIGIN}; a local RPC (${parsed.hostname}) may only be used for non-submitting dry runs. Nothing was submitted.`
      );
    }

    return override;
  }

  throw new Error(
    `USOL_RPC_URL must be exactly ${MAINNET_RPC_ORIGIN} (https, official origin) or a local validator for a non-submitting dry run; refusing "${override}".`
  );
}

// Execution gate: the connection about to sign must be the official endpoint.
function assertOfficialMainnetRpcUrl(url) {
  if (!isOfficialMainnetRpcUrl(url)) {
    throw new Error(
      `Refusing to execute against "${url}": live execution requires exactly ${MAINNET_RPC_ORIGIN}. Nothing was signed or submitted.`
    );
  }

  return MAINNET_RPC_URL;
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

function explorerAddressUrl(address) {
  return `https://explorer.solana.com/address/${address}`;
}

function explorerTransactionUrl(signature) {
  return `https://explorer.solana.com/tx/${signature}`;
}

module.exports = {
  NETWORK,
  MAINNET_RPC_URL,
  MAINNET_RPC_ORIGIN,
  MAINNET_GENESIS_HASH,
  TOKEN,
  DEPLOYMENT,
  AUTHORITIES,
  WALLETS,
  CONFIRMED_WALLETS,
  METADATA_UPDATE_AUTHORITY,
  ALLOCATION,
  LOGO_PATH,
  METADATA_TEMPLATE_PATH,
  STATE_PATH,
  KEYPAIR_DIR,
  KEYPAIRS,
  IRYS_ADDRESS,
  CONFIRMATION_PHRASE,
  METADATA_PROGRAM_ID,
  WALLET_LABELS,
  assertValidWalletAddress,
  assertConfirmedWallets,
  assertValidWallets,
  assertDeployedMintAddress,
  metadataAccountAddress,
  rawInitialSupply,
  allocationTotal,
  isOfficialMainnetRpcUrl,
  isLocalRpcUrl,
  resolveRpcUrl,
  assertOfficialMainnetRpcUrl,
  createConnection,
  explorerAddressUrl,
  explorerTransactionUrl
};
