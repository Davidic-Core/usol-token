"use strict";

// Historical audit copy of the transaction that created the USOL Mainnet mint,
// the original holder's associated token account and the 1,000,000,000 USOL
// supply. USOL already exists on Mainnet; this builder is not called by any
// runnable script and is exercised only by the offline self-tests.
//
// Signers the launch transaction required:
//   • the fee payer (FRPP...)   — paid rent and fees
//   • the new mint keypair      — the account being created
//   • the launch mint authority — authorized the initial mint (later revoked)
//
// The mint and freeze authorities are separate arguments and were written
// independently. Both are now permanently revoked on-chain.
//
// Keeping the instructions in one transaction made the launch atomic: either
// the mint, its token account and the supply all existed, or nothing did.

const {
  SystemProgram,
  Transaction
} = require("@solana/web3.js");

const {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync
} = require("@solana/spl-token");

function buildLaunchTransaction({
  mintKeypair,
  feePayer,
  mintAuthority,
  freezeAuthority,
  holder,
  decimals,
  rawAmount,
  mintRentLamports
}) {
  const mint = mintKeypair.publicKey;

  const associatedTokenAccount = getAssociatedTokenAddressSync(
    mint,
    holder,
    false,
    TOKEN_PROGRAM_ID
  );

  const transaction = new Transaction();
  transaction.feePayer = feePayer;

  transaction.add(
    // 1. Allocate the mint account, paid for by the fee payer.
    SystemProgram.createAccount({
      fromPubkey: feePayer,
      newAccountPubkey: mint,
      space: MINT_SIZE,
      lamports: mintRentLamports,
      programId: TOKEN_PROGRAM_ID
    }),
    // 2. Initialize a Classic SPL Token mint: 9 decimals, with the mint and
    //    freeze authorities set independently (never revoked).
    createInitializeMint2Instruction(
      mint,
      decimals,
      mintAuthority,
      freezeAuthority,
      TOKEN_PROGRAM_ID
    ),
    // 3. Associated token account for the initial holder, paid for by the fee
    //    payer but owned by the holder wallet.
    createAssociatedTokenAccountInstruction(
      feePayer,
      associatedTokenAccount,
      holder,
      mint,
      TOKEN_PROGRAM_ID
    ),
    // 4. Mint the initial supply to the holder's token account.
    createMintToInstruction(
      mint,
      associatedTokenAccount,
      mintAuthority,
      rawAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return { transaction, mint, associatedTokenAccount };
}

module.exports = { buildLaunchTransaction };
