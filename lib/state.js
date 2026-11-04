"use strict";

// Reads and writes `deployments/mainnet.json`, the single place where the
// actual Mainnet mint address and transaction signatures are recorded.

const fs = require("fs");
const path = require("path");

const { STATE_PATH, NETWORK } = require("../config/mainnet");

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

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  state.updatedAt = new Date().toISOString();

  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`\nDeployment record updated: ${STATE_PATH}`);
}

module.exports = { loadState, saveState };
