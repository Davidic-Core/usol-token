"use strict";

// Offline tests for read-only SOL and USOL balance formatting.
// Run with: node --test web/tests/wallet-balances.test.js

const { test } = require("node:test");
const assert = require("node:assert/strict");

const core = require("../wallet-core.js");

function tokenAccount(amount) {
  return {
    account: {
      data: {
        program: "spl-token",
        parsed: {
          type: "account",
          info: {
            mint: core.USOL_MINT,
            owner: "11111111111111111111111111111111",
            tokenAmount: { amount: String(amount), decimals: 9, uiAmount: null }
          }
        }
      }
    },
    pubkey: "11111111111111111111111111111111"
  };
}

test("keeps the pinned USOL mint and decimals", () => {
  assert.equal(core.USOL_MINT, "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG");
  assert.equal(core.USOL_DECIMALS, 9);
});

test("divides lamports by 1e9 for the SOL balance", () => {
  assert.equal(core.formatSolBalance(1500000000), "1.5 SOL");
  assert.equal(core.formatSolBalance("1000000000"), "1 SOL");
  assert.equal(core.formatSolBalance(0), "0 SOL");
  assert.equal(core.formatSolBalance(1234567890), "1.23456789 SOL");
  assert.equal(core.formatSolBalance(1), "0.000000001 SOL");
});

test("returns Unavailable instead of a misleading number for bad SOL input", () => {
  assert.equal(core.formatSolBalance("not-a-number"), "Unavailable");
  assert.equal(core.formatSolBalance(Number.NaN), "Unavailable");
  assert.equal(core.formatSolBalance(1.5), "Unavailable", "lamports are whole numbers");
});

test("sums every matching token account and divides by 1e9", () => {
  const total = core.sumTokenAccounts([tokenAccount("1500000000"), tokenAccount("2500000000")]);
  assert.equal(total, 4000000000n);
  assert.equal(core.formatUsolBalance(total), "4 USOL");
});

test("shows 0 USOL for an account with no USOL holdings", () => {
  assert.equal(core.formatUsolBalance(core.sumTokenAccounts([])), "0 USOL");
  assert.equal(core.formatUsolBalance(0n), "0 USOL");
  assert.equal(core.formatUsolBalance(0), "0 USOL");
});

test("ignores malformed token account entries", () => {
  const total = core.sumTokenAccounts([
    null,
    {},
    { account: { data: {} } },
    tokenAccount("1000000000"),
    { account: { data: { parsed: { info: { tokenAmount: { amount: "oops" } } } } } }
  ]);
  assert.equal(core.formatUsolBalance(total), "1 USOL");
  assert.equal(core.sumTokenAccounts(null), 0n);
});

test("keeps precision for amounts as large as the USOL supply", () => {
  const total = core.sumTokenAccounts([tokenAccount("1000000000000000000")]);
  assert.equal(core.formatUsolBalance(total), "1,000,000,000 USOL");
});

test("groups thousands and sums every USOL token account exactly", () => {
  const total = core.sumTokenAccounts([
    tokenAccount("900000000194665284"),
    tokenAccount("18807841000000000")
  ]);
  assert.equal(core.formatUsolBalance(total), "918,807,841.194665284 USOL");
  assert.doesNotMatch(core.formatUsolBalance(total), /\$|USD/);
});

test("explains an RPC failure in plain language", () => {
  assert.equal(
    core.describeBalanceError({ message: "Failed to fetch" }),
    "Balances could not be read. Check your connection and try again."
  );
  assert.equal(
    core.describeBalanceError({ message: "Solana Mainnet RPC returned HTTP 503." }),
    "Solana Mainnet RPC returned HTTP 503."
  );
  assert.equal(
    core.describeBalanceError(new Error("")),
    "Balances could not be read. Check your connection and try again."
  );
});
