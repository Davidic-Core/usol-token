#!/usr/bin/env node
"use strict";

// Read-only verification of the deployed USOL state. This program has no
// transaction builder, signer, keypair loader, uploader, or deployment-record
// writer. Network calls are read-only RPC/HTTP reads; the record is never fixed
// up automatically.
const { PublicKey } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } = require("@solana/spl-token");
const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const { mplTokenMetadata, fetchMetadataFromSeeds } = require("@metaplex-foundation/mpl-token-metadata");
const { publicKey } = require("@metaplex-foundation/umi");
const config = require("./config/mainnet");
const { loadState } = require("./lib/state");
const { assertMainnetRpc } = require("./lib/rpc");
const {
  assertMintOnChain, assertMetadataAccount, assertMetadataFields,
  fetchAndAssertMetadataJson, assertHolderTokenAccount
} = require("./lib/verify");

async function verifyMetadataAccount(connection, state) {
  const metadataAddress = new PublicKey(state.metadataAccount);
  let account;
  try { account = await connection.getAccountInfo(metadataAddress, "confirmed"); }
  catch (error) { throw new Error(`Mainnet RPC unavailable while reading metadata account: ${error.message}`); }
  if (!account) throw new Error(`Expected Metaplex metadata account ${state.metadataAccount} is absent on Mainnet.`);
  if (!account.owner.equals(new PublicKey(config.METADATA_PROGRAM_ID))) throw new Error("Metadata account is not owned by the Metaplex Token Metadata program.");

  const umi = createUmi(config.MAINNET_RPC_URL);
  umi.use(mplTokenMetadata());
  let metadata;
  try { metadata = await fetchMetadataFromSeeds(umi, { mint: publicKey(state.mintAddress) }); }
  catch (error) { throw new Error(`Mainnet RPC unavailable or metadata account could not be decoded: ${error.message}`); }
  assertMetadataFields({
    mint: metadata.mint,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    address: state.metadataAccount
  });
}

async function main() {
  if (process.argv.includes("--self-test")) {
    throw new Error("Use npm run test:offline for offline tests; this command only performs live read-only verification.");
  }
  const rpcUrl = config.resolveRpcUrl();
  config.assertValidWallets();
  const state = loadState(); // validates all canonical fields; never writes it
  const connection = config.createConnection(rpcUrl);

  try { await assertMainnetRpc(connection); }
  catch (error) { throw new Error(`Mainnet RPC verification failed: ${error.message}`); }

  const mintInfo = await assertMintOnChain(connection, state.mintAddress);
  assertMetadataAccount({ mintAddress: state.mintAddress, metadataAccount: state.metadataAccount, metadataUri: state.metadataUri });
  await verifyMetadataAccount(connection, state);
  await fetchAndAssertMetadataJson(state.metadataUri);

  const holderTokenAccount = state.associatedTokenAccount || getAssociatedTokenAddressSync(
    new PublicKey(state.mintAddress), new PublicKey(config.WALLETS.initialHolder), false, TOKEN_PROGRAM_ID
  ).toBase58();
  await assertHolderTokenAccount(connection, {
    mintAddress: state.mintAddress,
    tokenAccountAddress: holderTokenAccount,
    expectedAmount: config.rawInitialSupply()
  });

  console.log("USOL Mainnet deployment verified (read-only; no record updates or transactions).");
  console.log(`Mint: ${state.mintAddress}`);
  console.log(`Decimals: ${mintInfo.decimals}; supply: ${config.TOKEN.initialSupply} USOL`);
  console.log("Mint and freeze authorities: revoked (null)");
  console.log(`Metadata account: ${state.metadataAccount}`);
  console.log(`Metadata URI: ${state.metadataUri}`);
  console.log(`Logo URI: ${config.DEPLOYMENT.imageUri}`);
  console.log(`Holder token account: ${holderTokenAccount}`);
  console.log(config.explorerAddressUrl(state.mintAddress));
}

main().catch((error) => {
  console.error(`\nVerification failed: ${error.message || error}`);
  process.exitCode = 1;
});
