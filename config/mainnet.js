"use strict";

// Canonical, read-only configuration for the already-deployed USOL token.
const { Connection, PublicKey } = require("@solana/web3.js");

const NETWORK = "mainnet-beta";
const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";
const MAINNET_RPC_ORIGIN = MAINNET_RPC_URL;
const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const TOKEN = Object.freeze({
  name: "UnitedSOLANA",
  symbol: "USOL",
  standard: "Classic SPL Token",
  decimals: 9,
  initialSupply: 1_000_000_000n,
  description:
    "UnitedSOLANA (USOL) is a high-speed community and utility token built on the Solana blockchain. Designed to facilitate seamless decentralized trading, liquidity pairing, and ecosystem transaction fees across Solana dApps"
});
const DEPLOYMENT = Object.freeze({
  status: "mainnet-deployed-and-verified",
  mintAddress: "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG",
  associatedTokenAccount: "4GGuwKMeqeN8c5tnhFyN3qK2715BNTrJPjZMYZiJpuS7",
  metadataAccount: "4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc",
  metadataUri: "https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY",
  imageUri: "https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo",
  transactions: Object.freeze({
    mintCreation: "3N1UJdVAC8AGiCe9mJetrZHzBNW3aZTnAgfqtjoDMQey91jphBri5SGXsFBzt1cdnQAUtaA54Sv9k211EiJoHdUY",
    metadataRegistration: "2LKc5pLimSyiAQhCsUYpYNvjySjJZ8asmHo8qtopf3J6wvgqF2Abx1oYVBLK2gUT3niS4CKyvDoXJShuoJuEuD8C",
    mintAuthorityRevocation: "3N5WpNkkJQ3uSEtGBBxU7z5mkcesJnZaVyShb1mMhRPYWsVNXdYYYE8YbZieSZkreMfkReFuRY4aQqMvYz26dCAe",
    freezeAuthorityRevocation: "3ZjBcDEMmoYBSwD8y2GyJVkgxkGyWJQpc4aEowXmrn7bQ3upzeHyxpB2hQhNEADBiDotCmngFDMqUxkXp8kR2JJ8"
  })
});
const AUTHORITIES = Object.freeze({
  mintAuthority: null,
  freezeAuthority: null,
  revoked: true,
  mintRevocationTransaction: DEPLOYMENT.transactions.mintAuthorityRevocation,
  freezeRevocationTransaction: DEPLOYMENT.transactions.freezeAuthorityRevocation
});
const CONFIRMED_WALLETS = Object.freeze({
  feePayer: "FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU",
  initialHolder: "HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT"
});
const WALLETS = CONFIRMED_WALLETS;
const WALLET_LABELS = Object.freeze({ feePayer: "fee payer", initialHolder: "original holder" });
const METADATA_UPDATE_AUTHORITY = WALLETS.initialHolder;
const ALLOCATION = Object.freeze([
  { key: "liquidityReserve", label: "Initial liquidity reserve (future USOL/SOL and USOL/USDC pools)", amount: 300_000_000n },
  { key: "treasury", label: "Treasury and reserves", amount: 250_000_000n },
  { key: "ecosystem", label: "Ecosystem and community", amount: 200_000_000n },
  { key: "distribution", label: "Future distribution", amount: 150_000_000n },
  { key: "retained", label: "Retained allocation", amount: 100_000_000n }
]);
const STATE_PATH = require("path").join(__dirname, "..", "deployments", "mainnet.json");
const LOGO_PATH = require("path").join(__dirname, "..", "logo.png");
const METADATA_TEMPLATE_PATH = require("path").join(__dirname, "..", "metadata.json");
const RPC_TIMEOUT_MS = Number(process.env.USOL_RPC_TIMEOUT_MS || 15000);

function rawInitialSupply() {
  return TOKEN.initialSupply * 10n ** BigInt(TOKEN.decimals);
}
function allocationTotal() {
  return ALLOCATION.reduce((total, entry) => total + entry.amount, 0n);
}
function assertDeployedMintAddress(address) {
  if (address !== DEPLOYMENT.mintAddress) throw new Error(`Unexpected USOL mint ${String(address)}; expected the pinned deployed mint.`);
  return address;
}
function metadataAccountAddress(mintAddress) {
  const program = new PublicKey(METADATA_PROGRAM_ID);
  const mint = new PublicKey(mintAddress);
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), program.toBuffer(), mint.toBuffer()], program
  );
  return address.toBase58();
}
function assertValidWalletAddress(value, label) {
  let key;
  try { key = new PublicKey(value); } catch { throw new Error(`${label} is not a valid Solana address.`); }
  if (key.toBase58() !== value || key.toBytes().length !== 32 || !PublicKey.isOnCurve(key.toBytes())) {
    throw new Error(`${label} is not a canonical on-curve wallet address.`);
  }
  return key;
}
function assertConfirmedWallets(wallets = WALLETS) {
  for (const [key, expected] of Object.entries(CONFIRMED_WALLETS)) {
    if (!wallets || wallets[key] !== expected) throw new Error(`Wallet assignment ${key} differs from the pinned deployment.`);
  }
  return wallets;
}
function assertValidWallets() {
  assertConfirmedWallets();
  for (const [key, label] of Object.entries(WALLET_LABELS)) assertValidWalletAddress(WALLETS[key], label);
  if (WALLETS.feePayer === WALLETS.initialHolder) throw new Error("Fee payer and original holder must be different wallets.");
  return WALLETS;
}
function isOfficialMainnetRpcUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.origin === MAINNET_RPC_ORIGIN &&
      parsed.username === "" && parsed.password === "" &&
      (parsed.pathname === "/" || parsed.pathname === "") && !parsed.search && !parsed.hash;
  } catch { return false; }
}
function assertOfficialMainnetRpcUrl(value) {
  if (!isOfficialMainnetRpcUrl(value)) throw new Error(`Verification requires the exact official Mainnet RPC origin ${MAINNET_RPC_ORIGIN}.`);
  return MAINNET_RPC_URL;
}
function resolveRpcUrl() {
  const override = process.env.USOL_RPC_URL;
  if (override && !isOfficialMainnetRpcUrl(override)) throw new Error("USOL_RPC_URL must be the official Solana Mainnet RPC; local and alternate endpoints are not accepted for live verification.");
  return MAINNET_RPC_URL;
}
function createConnection(rpcUrl = MAINNET_RPC_URL) {
  assertOfficialMainnetRpcUrl(rpcUrl);
  return new Connection(MAINNET_RPC_URL, {
    commitment: "confirmed",
    fetch: (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(RPC_TIMEOUT_MS) }),
    disableRetryOnRateLimit: true
  });
}
function explorerAddressUrl(address) { return `https://explorer.solana.com/address/${address}`; }
function explorerTransactionUrl(signature) { return `https://explorer.solana.com/tx/${signature}`; }

module.exports = {
  NETWORK, MAINNET_RPC_URL, MAINNET_RPC_ORIGIN, MAINNET_GENESIS_HASH,
  METADATA_PROGRAM_ID, TOKEN, DEPLOYMENT, AUTHORITIES, WALLETS,
  CONFIRMED_WALLETS, WALLET_LABELS, METADATA_UPDATE_AUTHORITY, ALLOCATION,
  STATE_PATH, LOGO_PATH, METADATA_TEMPLATE_PATH,
  rawInitialSupply, allocationTotal, assertDeployedMintAddress,
  metadataAccountAddress, assertValidWalletAddress, assertConfirmedWallets,
  assertValidWallets, isOfficialMainnetRpcUrl, assertOfficialMainnetRpcUrl,
  resolveRpcUrl, createConnection, explorerAddressUrl, explorerTransactionUrl
};
