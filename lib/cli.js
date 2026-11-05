"use strict";

// Shared console and approval handling.
//
// Every Mainnet script is a dry run unless `--execute` is passed, and even then
// it asks for the confirmation phrase from config/mainnet.js before anything is
// signed. There is no `--yes` shortcut.

const readline = require("readline");

const { CONFIRMATION_PHRASE } = require("../config/mainnet");

function heading(title) {
  const line = "=".repeat(72);
  console.log(`\n${line}\n${title}\n${line}`);
}

function formatSol(lamports) {
  return `${(Number(lamports) / 1_000_000_000).toFixed(6)} SOL`;
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function wantsExecution() {
  return process.argv.includes("--execute");
}

// Returns true only when the owner explicitly approved this run.
async function confirmExecution({ action }) {
  if (!wantsExecution()) {
    console.log("\nDRY RUN — nothing was signed and no transaction was submitted.");
    console.log(
      `To ${action} for real, re-run with --execute. That spends Mainnet SOL and cannot be undone.`
    );
    return false;
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      "--execute needs an interactive terminal so the confirmation phrase can be typed. Nothing was submitted."
    );
  }

  console.log(`\nThis will ${action} on Solana Mainnet and spend real SOL.`);

  const answer = await ask(`Type "${CONFIRMATION_PHRASE}" to continue: `);

  if (answer.trim() !== CONFIRMATION_PHRASE) {
    console.log("Confirmation did not match. Nothing was submitted.");
    return false;
  }

  return true;
}

module.exports = { heading, formatSol, ask, wantsExecution, confirmExecution };
