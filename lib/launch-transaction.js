"use strict";

// Builds the single transaction that creates the USOL Mainnet mint, the initial
// holder's associated token account and the 1,000,000,000 USOL supply.
//
// Signers the transaction requires:
//   • the fee payer (FRPP...) — pays rent and fees
//   • the new mint keypair      — the account being created
//   • the mint authority (HxDW...) — authorizes the initial mint
//
// Keeping the three instructions in one transaction makes the launch atomic:
// either the mint, its token account and the supply all exist, or nothing does.

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
  authority,
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

  const transaction = new Transaction().add(
    // 1. Allocate the mint account, paid for by the fee payer.
    SystemProgram.createAccount({
      fromPubkey: feePayer,
      newAccountPubkey: mint,
      space: MINT_SIZE,
      lamports: mintRentLamports,
      programId: TOKEN_PROGRAM_ID
    }),
    // 2. Initialize a Classic SPL Token mint: 9 decimals, mint and freeze
    //    authority both on the confirmed HxDW wallet (never revoked).
    createInitializeMint2Instruction(
      mint,
      decimals,
      authority,
      authority,
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
      authority,
      rawAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return { transaction, mint, associatedTokenAccount };
}

module.exports = { buildLaunchTransaction };
