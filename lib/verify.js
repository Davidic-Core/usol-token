"use strict";

// On-chain verification shared by the deployment scripts.
// Every helper throws on a mismatch: callers must treat any failure as a stop.
//
// USOL is already deployed, so verification expects the existing Mainnet state:
// the confirmed mint, nine decimals, one billion tokens and BOTH authorities
// revoked (null). An active mint or freeze authority is a failure, not a step.

const { PublicKey } = require("@solana/web3.js");
const {
  TOKEN_PROGRAM_ID,
  getAccount,
  getMint
} = require("@solana/spl-token");

const config = require("../config/mainnet");

// Field checks for a mint account, kept pure so they can be tested offline.
function assertMintFields(mintInfo, { mintAddress, decimals, rawAmount }) {
  if (mintAddress !== config.DEPLOYMENT.mintAddress) {
    throw new Error(
      `Mint is ${mintAddress}, expected the deployed USOL mint ${config.DEPLOYMENT.mintAddress}.`
    );
  }

  if (mintInfo.decimals !== decimals) {
    throw new Error(
      `Mint has ${mintInfo.decimals} decimals, expected ${decimals}.`
    );
  }

  const mintAuthority = mintInfo.mintAuthority?.toBase58() || null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() || null;

  if (mintAuthority !== config.AUTHORITIES.mintAuthority) {
    throw new Error(
      mintAuthority === null
        ? "Mint authority is not revoked."
        : `Mint authority is ${mintAuthority}, expected it to be permanently revoked (null).`
    );
  }

  if (freezeAuthority !== config.AUTHORITIES.freezeAuthority) {
    throw new Error(
      freezeAuthority === null
        ? "Freeze authority is not revoked."
        : `Freeze authority is ${freezeAuthority}, expected it to be permanently revoked (null).`
    );
  }

  if (mintInfo.supply !== rawAmount) {
    throw new Error(
      `Supply is ${mintInfo.supply} raw units, expected ${rawAmount}.`
    );
  }

  return mintInfo;
}

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
      `Mint ${mintAddress} does not exist on Mainnet.`
    );
  }

  if (!account.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error(`${mintAddress} is not a Classic SPL Token mint.`);
  }

  const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);

  return assertMintFields(mintInfo, {
    mintAddress,
    decimals: config.TOKEN.decimals,
    rawAmount: config.rawInitialSupply()
  });
}

// The metadata account recorded for USOL must be the Metaplex PDA of the
// deployed mint, and the recorded URI must be the one that was registered.
function assertMetadataAccount({ mintAddress, metadataAccount, metadataUri }) {
  const expectedAccount = config.metadataAccountAddress(mintAddress);

  if (metadataAccount !== expectedAccount) {
    throw new Error(
      `Metadata account is ${String(metadataAccount)}, expected the PDA of ${mintAddress}: ${expectedAccount}.`
    );
  }

  if (metadataAccount !== config.DEPLOYMENT.metadataAccount) {
    throw new Error(
      `Metadata account is ${metadataAccount}, expected the deployed USOL metadata account ${config.DEPLOYMENT.metadataAccount}.`
    );
  }

  if (metadataUri !== config.DEPLOYMENT.metadataUri) {
    throw new Error(
      `Metadata URI is ${String(metadataUri)}, expected the registered ${config.DEPLOYMENT.metadataUri}.`
    );
  }

  return { mintAddress, metadataAccount, metadataUri };
}

// Pure field checks for an on-chain Metaplex metadata account.
function assertMetadataFields(
  metadata,
  { mintAddress, metadataUri, expectedAccount }
) {
  const trim = (value) => String(value ?? "").replace(/\0+$/, "");

  if (trim(metadata.mint) !== mintAddress) {
    throw new Error(
      `Metadata belongs to mint ${trim(metadata.mint)}, expected ${mintAddress}.`
    );
  }

  if (trim(metadata.uri) !== metadataUri) {
    throw new Error(
      `Metadata URI is "${trim(metadata.uri)}", expected "${metadataUri}".`
    );
  }

  if (expectedAccount !== undefined && trim(metadata.address) !== expectedAccount) {
    throw new Error(
      `Metadata account is ${trim(metadata.address)}, expected ${expectedAccount}.`
    );
  }

  return metadata;
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
  assertMintFields,
  assertMintOnChain,
  assertMetadataAccount,
  assertMetadataFields,
  assertHolderTokenAccount,
  assertTokenAccountFields
};
