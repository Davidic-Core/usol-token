"use strict";

// Reads and writes `deployments/mainnet.json`, the single place where the
// existing Mainnet mint, metadata and transaction signatures are recorded.
//
// The record also names the confirmed wallets. It is re-checked before every
// network step: a record edited to point at a different fee payer or holder
// stops the run instead of being trusted.
//
// USOL is already deployed, so a record without a mint is a damaged record, not
// an invitation to create a new token. `assertStateDeployment` refuses it.

const fs = require("fs");
const path = require("path");

const {
  STATE_PATH,
  NETWORK,
  DEPLOYMENT,
  CONFIRMED_WALLETS,
  WALLET_LABELS
} = require("../config/mainnet");

// `filePath` exists so the offline tests can read isolated fixtures instead of
// the live deployment record.
function loadState(filePath = STATE_PATH) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Deployment record not found: ${filePath}`);
  }

  const state = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (state.network !== NETWORK) {
    throw new Error(
      `Deployment record targets "${state.network}", expected "${NETWORK}".`
    );
  }

  return state;
}

// Exact pin of the recorded wallet assignments against the confirmed ones.
function assertStateWallets(state) {
  const recorded = state.wallets || {};
  const problems = [];

  for (const [key, label] of Object.entries(WALLET_LABELS)) {
    if (recorded[key] !== CONFIRMED_WALLETS[key]) {
      problems.push(
        `${label} is ${String(recorded[key])}, confirmed ${CONFIRMED_WALLETS[key]}`
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `deployments/mainnet.json wallet assignments differ from the confirmed assignments:\n- ${problems.join(
        "\n- "
      )}\nRefusing to continue.`
    );
  }

  return state;
}

// The record must describe the USOL deployment that exists on Mainnet. A blank
// mint, an unknown status or a different mint address is refused: USOL is not
// created a second time and the record is never re-initialised.
function assertStateDeployment(state) {
  if (!state.mintAddress) {
    throw new Error(
      `deployments/mainnet.json does not record a mint address. USOL already exists on Mainnet as ${DEPLOYMENT.mintAddress}; restore the record instead of creating another mint.`
    );
  }

  if (state.mintAddress !== DEPLOYMENT.mintAddress) {
    throw new Error(
      `deployments/mainnet.json records mint ${state.mintAddress}, but USOL exists on Mainnet as ${DEPLOYMENT.mintAddress}. Refusing to continue.`
    );
  }

  if (state.metadataAccount !== DEPLOYMENT.metadataAccount) {
    throw new Error(
      `deployments/mainnet.json records metadata account ${String(
        state.metadataAccount
      )}, expected ${DEPLOYMENT.metadataAccount}.`
    );
  }

  if (state.metadataUri !== DEPLOYMENT.metadataUri) {
    throw new Error(
      `deployments/mainnet.json records metadata URI ${String(
        state.metadataUri
      )}, expected ${DEPLOYMENT.metadataUri}.`
    );
  }

  return state;
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  state.updatedAt = new Date().toISOString();

  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`\nDeployment record updated: ${STATE_PATH}`);
}

module.exports = {
  loadState,
  saveState,
  assertStateWallets,
  assertStateDeployment
};
