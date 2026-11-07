"use strict";

// Network safety and fee calculation for the Mainnet scripts.

const { MAINNET_GENESIS_HASH } = require("../config/mainnet");

// Refuses to continue unless the RPC really is Solana Mainnet. Comparing the
// genesis hash is the only reliable check: a hostname can be spoofed or
// misconfigured, but the cluster's genesis hash is fixed.
async function assertMainnetRpc(connection) {
  const genesisHash = await connection.getGenesisHash();

  if (genesisHash !== MAINNET_GENESIS_HASH) {
    throw new Error(
      `RPC is not Solana Mainnet (genesis hash ${genesisHash}, expected ${MAINNET_GENESIS_HASH}). Nothing was submitted.`
    );
  }

  return genesisHash;
}

// Fee for the actual compiled message — signature count and instructions as
// they will be sent — instead of a hardcoded guess. The transaction's recent
// blockhash is set here so the message can be compiled; callers that send the
// transaction afterwards reuse it.
async function feeForTransaction(connection, transaction) {
  if (!transaction.feePayer) {
    throw new Error("Cannot calculate a fee for a transaction without a fee payer.");
  }

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;

  const response = await connection.getFeeForMessage(
    transaction.compileMessage(),
    "confirmed"
  );

  if (response?.value === null || response?.value === undefined) {
    throw new Error(
      "The RPC could not calculate a fee for this transaction; refusing to guess. Nothing was submitted."
    );
  }

  return { feeLamports: response.value, blockhash };
}

module.exports = { assertMainnetRpc, feeForTransaction };
