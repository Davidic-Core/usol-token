"use strict";

// Fail-closed gates for the Mainnet scripts.
//
// Every check here runs before a network step. Any failure throws, so a run
// stops without spending SOL: a changed wallet, a changed supply, a damaged
// deployment record, a wrong authority inside a compiled transaction, an
// unpriced fee or an underfunded fee payer all abort the same way.
//
// `assertLaunchTransaction` validates the historical mint-creation transaction
// described in lib/launch-transaction.js. USOL already exists on Mainnet, so it
// is exercised only by the offline self-tests and cannot be sent by any script.

const { PublicKey, SystemProgram } = require("@solana/web3.js");

const {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} = require("@solana/spl-token");

const config = require("../config/mainnet");
const { assertStateWallets, assertStateDeployment } = require("./state");

// 1. Wallets and record: the active configuration and the recorded deployment
//    must both still be the confirmed assignments, and the record must describe
//    the USOL mint that already exists on Mainnet.
function assertExecutionWallets(state) {
  config.assertConfirmedWallets();

  if (state) {
    assertStateWallets(state);
    assertStateDeployment(state);
  }

  return config.WALLETS;
}

// 2. Supply: the token constants, the exact raw amount and the allocation plan
//    must all be the confirmed ones. A changed supply stops the run.
function assertSupplyPlan() {
  const problems = [];

  if (config.TOKEN.name !== "UnitedSOLANA") {
    problems.push(`token name is ${config.TOKEN.name}`);
  }

  if (config.TOKEN.symbol !== "USOL") {
    problems.push(`token symbol is ${config.TOKEN.symbol}`);
  }

  if (config.TOKEN.decimals !== 9) {
    problems.push(`decimals are ${config.TOKEN.decimals}`);
  }

  if (config.TOKEN.initialSupply !== 1_000_000_000n) {
    problems.push(`initial supply is ${config.TOKEN.initialSupply}`);
  }

  if (config.rawInitialSupply() !== 1_000_000_000n * 10n ** 9n) {
    problems.push(
      `raw supply is ${config.rawInitialSupply()}, expected 1000000000000000000`
    );
  }

  if (config.allocationTotal() !== config.TOKEN.initialSupply) {
    problems.push(
      `planned allocation totals ${config.allocationTotal()}, expected ${config.TOKEN.initialSupply}`
    );
  }

  if (problems.length > 0) {
    throw new Error(
      `Supply plan differs from the confirmed launch:\n- ${problems.join(
        "\n- "
      )}\nNothing was signed or submitted.`
    );
  }

  return config.rawInitialSupply();
}

// 3. Transaction: the compiled instructions must be exactly the confirmed
//    launch, with the confirmed fee payer, mint, authorities, holder and amount.
function assertLaunchTransaction(transaction, expected) {
  const problems = [];
  const push = (message) => problems.push(message);
  const isKey = (actual, wanted) =>
    Boolean(actual && wanted && actual.equals(wanted));

  const instructions = transaction.instructions || [];

  if (instructions.length !== 4) {
    throw new Error(
      `Launch transaction has ${instructions.length} instructions, expected 4. Nothing was signed or submitted.`
    );
  }

  const [createMintIx, initMintIx, createAtaIx, mintToIx] = instructions;

  const associatedTokenAccount = getAssociatedTokenAddressSync(
    expected.mint,
    expected.holder,
    false,
    TOKEN_PROGRAM_ID
  );

  if (!isKey(transaction.feePayer, expected.feePayer)) {
    push(
      `fee payer is ${transaction.feePayer?.toBase58()}, confirmed ${expected.feePayer.toBase58()}`
    );
  }

  if (!createMintIx.programId.equals(SystemProgram.programId)) {
    push("the mint account is not created by the System program");
  }
  if (!isKey(createMintIx.keys[0]?.pubkey, expected.feePayer)) {
    push("the mint account rent would not be paid by the confirmed fee payer");
  }
  if (!isKey(createMintIx.keys[1]?.pubkey, expected.mint)) {
    push("the created account is not the launch mint");
  }
  if (Number(createMintIx.data.readBigUInt64LE(12)) !== MINT_SIZE) {
    push(`the mint account is not ${MINT_SIZE} bytes`);
  }
  if (
    new PublicKey(createMintIx.data.subarray(20, 52)).toBase58() !==
    TOKEN_PROGRAM_ID.toBase58()
  ) {
    push("the mint account would not be owned by the SPL Token program");
  }
  if (
    Number(createMintIx.data.readBigUInt64LE(4)) !== expected.mintRentLamports
  ) {
    push(
      `mint rent is ${createMintIx.data.readBigUInt64LE(4)} lamports, expected ${expected.mintRentLamports}`
    );
  }

  if (!initMintIx.programId.equals(TOKEN_PROGRAM_ID)) {
    push("the mint is not initialized by the SPL Token program");
  }
  if (initMintIx.data[0] !== 20) {
    push("the mint is not initialized with InitializeMint2");
  }
  if (initMintIx.data[1] !== expected.decimals) {
    push(
      `the mint would have ${initMintIx.data[1]} decimals, expected ${expected.decimals}`
    );
  }
  if (
    new PublicKey(initMintIx.data.subarray(2, 34)).toBase58() !==
    expected.mintAuthority.toBase58()
  ) {
    push("the mint authority is not the confirmed mint authority");
  }
  if (initMintIx.data[34] !== 1) {
    push("the freeze authority would be absent");
  }
  if (
    new PublicKey(initMintIx.data.subarray(35, 67)).toBase58() !==
    expected.freezeAuthority.toBase58()
  ) {
    push("the freeze authority is not the confirmed freeze authority");
  }

  if (!createAtaIx.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
    push("the holder token account is not an associated token account");
  }
  if (!isKey(createAtaIx.keys[0]?.pubkey, expected.feePayer)) {
    push("the token account rent would not be paid by the confirmed fee payer");
  }
  if (!isKey(createAtaIx.keys[1]?.pubkey, associatedTokenAccount)) {
    push("the token account is not derived from the launch mint and holder");
  }
  if (!isKey(createAtaIx.keys[2]?.pubkey, expected.holder)) {
    push("the token account would not be owned by the confirmed holder");
  }
  if (!isKey(createAtaIx.keys[3]?.pubkey, expected.mint)) {
    push("the token account is not for the launch mint");
  }

  if (!mintToIx.programId.equals(TOKEN_PROGRAM_ID)) {
    push("the supply is not minted by the SPL Token program");
  }
  if (mintToIx.data[0] !== 7) {
    push("the supply instruction is not MintTo");
  }
  if (mintToIx.data.readBigUInt64LE(1) !== expected.rawAmount) {
    push(
      `the minted amount is ${mintToIx.data.readBigUInt64LE(1)}, expected ${expected.rawAmount}`
    );
  }
  if (!isKey(mintToIx.keys[0]?.pubkey, expected.mint)) {
    push("the supply would not be minted on the launch mint");
  }
  if (!isKey(mintToIx.keys[1]?.pubkey, associatedTokenAccount)) {
    push("the supply would not be minted into the holder's token account");
  }
  if (!isKey(mintToIx.keys[2]?.pubkey, expected.mintAuthority)) {
    push("the supply would not be minted by the confirmed mint authority");
  }
  if (!mintToIx.keys[2]?.isSigner) {
    push("the mint authority is not a signer of the supply instruction");
  }

  if (problems.length > 0) {
    throw new Error(
      `Launch transaction differs from the confirmed plan:\n- ${problems.join(
        "\n- "
      )}\nNothing was signed or submitted.`
    );
  }

  return associatedTokenAccount;
}

// 4. Fee and funding: the fee must be a real, positive quote for this message,
//    and the balance must cover rent plus fee before anything is signed.
function assertFunding({
  mintRentLamports,
  ataRentLamports,
  feeLamports,
  balance,
  feePayer
}) {
  const problems = [];

  for (const [label, value] of [
    ["mint rent", mintRentLamports],
    ["token account rent", ataRentLamports]
  ]) {
    if (!Number.isInteger(value) || value <= 0) {
      problems.push(`${label} is not a positive integer: ${value}`);
    }
  }

  if (!Number.isInteger(feeLamports) || feeLamports <= 0) {
    problems.push(`the network fee is not a positive integer: ${feeLamports}`);
  }

  if (!Number.isInteger(balance) || balance < 0) {
    problems.push(`the fee payer balance could not be read: ${balance}`);
  }

  if (problems.length === 0) {
    const requiredLamports = mintRentLamports + ataRentLamports + feeLamports;

    if (balance < requiredLamports) {
      problems.push(
        `the fee payer holds ${balance} lamports but the launch needs ${requiredLamports}`
      );
    }

    if (problems.length === 0) {
      return { requiredLamports, feePayer };
    }
  }

  throw new Error(
    `Preflight funding checks failed:\n- ${problems.join(
      "\n- "
    )}\nNothing was signed or submitted.`
  );
}

module.exports = {
  assertExecutionWallets,
  assertSupplyPlan,
  assertLaunchTransaction,
  assertFunding
};
