"use strict";

// Loads and validates the canonical local record for the existing deployment.
// This module intentionally has no state-writing function.
const fs = require("fs");
const config = require("../config/mainnet");

function loadState(filePath = config.STATE_PATH) {
  let state;
  try {
    state = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read deployment record at ${filePath}: ${error.message}`);
  }
  return assertStateIntegrity(state);
}

function assertStateWallets(state) {
  config.assertConfirmedWallets(state && state.wallets);
  return state;
}

function assertStateIntegrity(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Deployment record must be a JSON object.");
  const exact = [
    ["network", state.network, config.NETWORK],
    ["rpcUrl", state.rpcUrl, config.MAINNET_RPC_URL],
    ["genesisHash", state.genesisHash, config.MAINNET_GENESIS_HASH],
    ["token.name", state.token?.name, config.TOKEN.name],
    ["token.symbol", state.token?.symbol, config.TOKEN.symbol],
    ["token.standard", state.token?.standard, config.TOKEN.standard],
    ["token.decimals", state.token?.decimals, config.TOKEN.decimals],
    ["token.initialSupply", state.token?.initialSupply, config.TOKEN.initialSupply.toString()],
    ["status", state.status, config.DEPLOYMENT.status],
    ["mintAddress", state.mintAddress, config.DEPLOYMENT.mintAddress],
    ["associatedTokenAccount", state.associatedTokenAccount, config.DEPLOYMENT.associatedTokenAccount],
    ["metadataAccount", state.metadataAccount, config.DEPLOYMENT.metadataAccount],
    ["metadataUri", state.metadataUri, config.DEPLOYMENT.metadataUri],
    ["imageUri", state.imageUri, config.DEPLOYMENT.imageUri],
    ["authorities.mintAuthority", state.authorities?.mintAuthority, null],
    ["authorities.freezeAuthority", state.authorities?.freezeAuthority, null],
    ["authorities.revoked", state.authorities?.revoked, true],
    ["authorities.mintRevocationTransaction", state.authorities?.mintRevocationTransaction, config.AUTHORITIES.mintRevocationTransaction],
    ["authorities.freezeRevocationTransaction", state.authorities?.freezeRevocationTransaction, config.AUTHORITIES.freezeRevocationTransaction],
    ["transactions.mintCreation", state.transactions?.mintCreation, config.DEPLOYMENT.transactions.mintCreation],
    ["transactions.metadataRegistration", state.transactions?.metadataRegistration, config.DEPLOYMENT.transactions.metadataRegistration],
    ["transactions.mintAuthorityRevocation", state.transactions?.mintAuthorityRevocation, config.AUTHORITIES.mintRevocationTransaction],
    ["transactions.freezeAuthorityRevocation", state.transactions?.freezeAuthorityRevocation, config.AUTHORITIES.freezeRevocationTransaction]
  ];
  const mismatches = exact.filter(([, actual, expected]) => actual !== expected).map(([field, actual, expected]) => `${field}: got ${String(actual)}, expected ${String(expected)}`);
  try { config.assertConfirmedWallets(state.wallets); } catch (error) { mismatches.push(error.message); }
  if (!Array.isArray(state.plannedAllocation)) mismatches.push("plannedAllocation must be an array");
  else {
    const total = state.plannedAllocation.reduce((sum, item) => {
      if (!item || !/^\d+$/.test(String(item.amount))) { mismatches.push("plannedAllocation contains an invalid amount"); return sum; }
      return sum + BigInt(item.amount);
    }, 0n);
    if (total !== config.TOKEN.initialSupply) mismatches.push(`plannedAllocation total ${total} does not equal ${config.TOKEN.initialSupply}`);
  }
  if (mismatches.length) throw new Error(`Deployment record is inconsistent; no repair or transaction was attempted:\n- ${mismatches.join("\n- ")}`);
  return state;
}

module.exports = { loadState, assertStateWallets, assertStateIntegrity };
