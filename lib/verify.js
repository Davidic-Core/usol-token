"use strict";

// Pure checks and read-only RPC helpers for the already deployed USOL token.
const { PublicKey } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getAccount, getMint } = require("@solana/spl-token");
const config = require("../config/mainnet");

function addressString(value) {
  if (value && typeof value.toBase58 === "function") return value.toBase58();
  if (value && typeof value.toString === "function") return value.toString();
  return String(value ?? "");
}
function trim(value) { return addressString(value).replace(/\0+$/, ""); }

function assertMintFields(mintInfo, { mintAddress = config.DEPLOYMENT.mintAddress, decimals = config.TOKEN.decimals, rawAmount = config.rawInitialSupply() } = {}) {
  if (mintAddress !== config.DEPLOYMENT.mintAddress) throw new Error(`Mint address mismatch: ${mintAddress}`);
  if (mintInfo.decimals !== decimals || decimals !== 9) throw new Error(`Mint decimals mismatch: got ${mintInfo.decimals}, expected 9.`);
  if (mintInfo.mintAuthority !== null) throw new Error(`Mint authority is active (${addressString(mintInfo.mintAuthority)}); expected null.`);
  if (mintInfo.freezeAuthority !== null) throw new Error(`Freeze authority is active (${addressString(mintInfo.freezeAuthority)}); expected null.`);
  if (BigInt(mintInfo.supply) !== BigInt(rawAmount)) throw new Error(`Mint supply mismatch: got ${mintInfo.supply}, expected ${rawAmount} raw units.`);
  return mintInfo;
}

async function assertMintOnChain(connection, mintAddress = config.DEPLOYMENT.mintAddress) {
  config.assertDeployedMintAddress(mintAddress);
  const mint = new PublicKey(mintAddress);
  let account;
  try { account = await connection.getAccountInfo(mint, "confirmed"); }
  catch (error) { throw new Error(`Mainnet RPC connection/read failure while fetching mint account: ${error.message}`); }
  if (!account) throw new Error(`Mint account ${mintAddress} is missing on Mainnet.`);
  if (!account.owner.equals(TOKEN_PROGRAM_ID)) throw new Error(`${mintAddress} is not owned by the Classic SPL Token program.`);
  let mintInfo;
  try { mintInfo = await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID); }
  catch (error) { throw new Error(`Mint account exists with SPL ownership but could not be read or decoded; no supply/authority mismatch is concluded: ${error.message}`); }
  return assertMintFields(mintInfo);
}

function assertMetadataAccount({ mintAddress, metadataAccount, metadataUri }) {
  config.assertDeployedMintAddress(mintAddress);
  const expected = config.metadataAccountAddress(mintAddress);
  if (metadataAccount !== expected || metadataAccount !== config.DEPLOYMENT.metadataAccount) throw new Error(`Metadata account mismatch: got ${String(metadataAccount)}, expected ${config.DEPLOYMENT.metadataAccount}.`);
  if (metadataUri !== config.DEPLOYMENT.metadataUri) throw new Error(`Metadata URI mismatch: got ${String(metadataUri)}, expected ${config.DEPLOYMENT.metadataUri}.`);
  return { mintAddress, metadataAccount, metadataUri };
}

function assertMetadataFields(metadata, { mintAddress = config.DEPLOYMENT.mintAddress, metadataUri = config.DEPLOYMENT.metadataUri, expectedAccount = config.DEPLOYMENT.metadataAccount } = {}) {
  const expected = { mint: mintAddress, name: config.TOKEN.name, symbol: config.TOKEN.symbol, uri: metadataUri };
  for (const [field, value] of Object.entries(expected)) {
    if (trim(metadata[field]) !== value) throw new Error(`On-chain metadata ${field} mismatch: got "${trim(metadata[field])}", expected "${value}".`);
  }
  if (expectedAccount && trim(metadata.address) !== expectedAccount) throw new Error(`Metadata account mismatch: got ${trim(metadata.address)}, expected ${expectedAccount}.`);
  return metadata;
}

function assertMetadataJson(metadata, expectedImage = config.DEPLOYMENT.imageUri) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error("Metadata gateway returned invalid JSON object.");
  for (const [field, expected] of [["name", config.TOKEN.name], ["symbol", config.TOKEN.symbol], ["description", config.TOKEN.description], ["image", expectedImage]]) {
    if (metadata[field] !== expected) throw new Error(`Metadata JSON ${field} mismatch: got ${String(metadata[field])}, expected ${expected}.`);
  }
  return metadata;
}

async function fetchAndAssertMetadataJson(uri, fetchImpl = globalThis.fetch) {
  if (uri !== config.DEPLOYMENT.metadataUri) throw new Error(`Refusing to fetch unpinned metadata URI ${String(uri)}.`);
  let response;
  try { response = await fetchImpl(uri, { signal: AbortSignal.timeout(10000) }); }
  catch (error) { throw new Error(`Metadata gateway unavailable while fetching the pinned URI: ${error.message}`); }
  if (!response || !response.ok) throw new Error(`Metadata gateway unavailable: HTTP ${response ? response.status : "no response"}.`);
  let json;
  try { json = await response.json(); }
  catch (error) { throw new Error(`Metadata gateway returned invalid/unreadable JSON: ${error.message}`); }
  return assertMetadataJson(json);
}

function assertTokenAccountFields(account, { mintAddress = config.DEPLOYMENT.mintAddress, tokenAccountAddress, expectedAmount } = {}) {
  config.assertDeployedMintAddress(mintAddress);
  if (!account.mint.equals(new PublicKey(config.DEPLOYMENT.mintAddress))) throw new Error(`Token account ${tokenAccountAddress} belongs to an unexpected mint.`);
  if (!account.owner.equals(new PublicKey(config.WALLETS.initialHolder))) throw new Error(`Token account ${tokenAccountAddress} has an unexpected owner.`);
  // Holder balance is intentionally not pinned: distribution has occurred.
  if (expectedAmount !== undefined && BigInt(account.amount) !== BigInt(expectedAmount)) throw new Error(`Token account ${tokenAccountAddress} balance mismatch.`);
  return account;
}
async function assertHolderTokenAccount(connection, { mintAddress = config.DEPLOYMENT.mintAddress, tokenAccountAddress, expectedAmount } = {}) {
  config.assertDeployedMintAddress(mintAddress);
  let account;
  try { account = await getAccount(connection, new PublicKey(tokenAccountAddress), "confirmed", TOKEN_PROGRAM_ID); }
  catch (error) {
    if (error && (error.name === "TokenAccountNotFoundError" || error.name === "TokenInvalidAccountOwnerError")) {
      throw new Error(`Holder token account is missing or incorrectly owned: ${error.message}`);
    }
    throw new Error(`Mainnet RPC connection/read failure while fetching holder token account ${tokenAccountAddress}: ${error.message}`);
  }
  return assertTokenAccountFields(account, { mintAddress, tokenAccountAddress, expectedAmount });
}

module.exports = {
  assertMintFields, assertMintOnChain, assertMetadataAccount, assertMetadataFields,
  assertMetadataJson, fetchAndAssertMetadataJson, assertTokenAccountFields,
  assertHolderTokenAccount
};
