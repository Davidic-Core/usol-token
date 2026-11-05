"use strict";

// Reads and writes `deployments/mainnet.json`, the single place where the
// actual Mainnet mint address and transaction signatures are recorded.
//
// The record also names the confirmed wallets. It is re-checked before every
// signing step: a record edited to point at a different fee payer, holder or
// authority stops the run instead of being trusted.

const fs = require("fs");
const path = require("path");

const {
  STATE_PATH,
  NETWORK,
  CONFIRMED_WALLETS,
  WALLET_LABELS
} = require("../config/mainnet");

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    throw new Error(`Deployment record not found: ${STATE_PATH}`);
  }

  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));

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

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  state.updatedAt = new Date().toISOString();

  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`\nDeployment record updated: ${STATE_PATH}`);
}

module.exports = { loadState, saveState, assertStateWallets };
