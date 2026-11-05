"use strict";

// On-chain verification shared by the launch, upload and registration scripts.
// Every helper throws on a mismatch: callers must treat any failure as a stop.

const { PublicKey } = require("@solana/web3.js");
const {
  TOKEN_PROGRAM_ID,
  getAccount,
  getMint
} = require("@solana/spl-token");

const config = require("../config/mainnet");

async function assertMintOnChain(connection, mintAddress) {
  let mint;
  try {
    mint = new PublicKey(mintAddress);
  } catch (error) {
    throw new Error(`Recorded mint address is not valid: ${mintAddress}`);
  }

  const account = await connection.getAccountInfo(mint, "confirmed");

  if (!account) {
    throw new Error(
      `Mint ${mintAddress} does not exist on Mainnet yet.`
    );
  }

  if (!account.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error(`${mintAddress} is not a Classic SPL Token mint.`);
  }

  const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);

  if (mintInfo.decimals !== config.TOKEN.decimals) {
    throw new Error(
      `Mint has ${mintInfo.decimals} decimals, expected ${config.TOKEN.decimals}.`
    );
  }

  const mintAuthority = mintInfo.mintAuthority?.toBase58() || null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() || null;

  if (mintAuthority !== config.WALLETS.mintAuthority) {
    throw new Error(
      `Mint authority is ${mintAuthority}, expected ${config.WALLETS.mintAuthority}.`
    );
  }

  if (freezeAuthority !== config.WALLETS.freezeAuthority) {
    throw new Error(
      `Freeze authority is ${freezeAuthority}, expected ${config.WALLETS.freezeAuthority}.`
    );
  }

  const expectedSupply = config.rawInitialSupply();

  if (mintInfo.supply !== expectedSupply) {
    throw new Error(
      `Supply is ${mintInfo.supply} raw units, expected ${expectedSupply}.`
    );
  }

  return mintInfo;
}

// Pure field checks for a holder token account: mint, owner and balance.
function assertTokenAccountFields(
  account,
  { mintAddress, tokenAccountAddress, expectedAmount }
) {
  if (!account.mint.equals(new PublicKey(mintAddress))) {
    throw new Error(
      `Token account ${tokenAccountAddress} belongs to mint ${account.mint.toBase58()}, expected ${mintAddress}.`
    );
  }

  if (!account.owner.equals(new PublicKey(config.WALLETS.initialHolder))) {
    throw new Error(
      `Token account ${tokenAccountAddress} is owned by ${account.owner.toBase58()}, expected ${config.WALLETS.initialHolder}.`
    );
  }

  if (expectedAmount !== undefined && account.amount !== expectedAmount) {
    throw new Error(
      `Token account ${tokenAccountAddress} holds ${account.amount} raw units, expected ${expectedAmount}.`
    );
  }

  return account;
}

async function assertHolderTokenAccount(
  connection,
  { mintAddress, tokenAccountAddress, expectedAmount }
) {
  let tokenAccount;

  try {
    tokenAccount = new PublicKey(tokenAccountAddress);
  } catch (error) {
    throw new Error(
      `Recorded token account address is not valid: ${tokenAccountAddress}`
    );
  }

  const account = await getAccount(
    connection,
    tokenAccount,
    "confirmed",
    TOKEN_PROGRAM_ID
  );

  return assertTokenAccountFields(account, {
    mintAddress,
    tokenAccountAddress,
    expectedAmount
  });
}

module.exports = {
  assertMintOnChain,
  assertHolderTokenAccount,
  assertTokenAccountFields
};
