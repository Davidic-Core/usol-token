"use strict";

// Read-only verifier for the already deployed USOL token. There is no signing,
// transaction submission, minting, authority mutation, or deployment-record write.
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
  try {
    account = await connection.getAccountInfo(metadataAddress, "confirmed");
  } catch (error) {
    throw new Error(`Mainnet RPC connection/read failure while fetching metadata account: ${error.message}`);
  }
  if (!account) throw new Error(`Metadata account ${state.metadataAccount} is missing on Mainnet.`);
  if (!account.owner.equals(new PublicKey(config.METADATA_PROGRAM_ID))) {
    throw new Error(`Metadata account ${state.metadataAccount} has incorrect program ownership.`);
  }

  const umi = createUmi(config.MAINNET_RPC_URL);
  umi.use(mplTokenMetadata());
  let metadata;
  try {
    metadata = await fetchMetadataFromSeeds(umi, { mint: publicKey(state.mintAddress) });
  } catch (error) {
    throw new Error(`Metadata account exists and has the expected program owner, but its data could not be decoded/read; no metadata mismatch is concluded: ${error.message}`);
  }
  // Decoded content mismatches are intentionally reported by this assertion,
  // outside the fetch/decode error handler above.
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
  const state = loadState(); // validates canonical fields; never writes it
  const connection = config.createConnection(rpcUrl);

  try {
    await assertMainnetRpc(connection);
  } catch (error) {
    throw new Error(`Mainnet RPC connection/cluster verification failed: ${error.message}`);
  }

  // Mint supply is verified independently from any individual holder balance.
  const mintInfo = await assertMintOnChain(connection, state.mintAddress);
  assertMetadataAccount({ mintAddress: state.mintAddress, metadataAccount: state.metadataAccount, metadataUri: state.metadataUri });
  await verifyMetadataAccount(connection, state);
  await fetchAndAssertMetadataJson(state.metadataUri);

  const holderTokenAccount = state.associatedTokenAccount || getAssociatedTokenAddressSync(
    new PublicKey(state.mintAddress), new PublicKey(config.WALLETS.initialHolder), false, TOKEN_PROGRAM_ID
  ).toBase58();
  // Check that the recorded original holder account belongs to the expected USOL
  // mint and owner. Distribution means its current balance is not assumed here.
  await assertHolderTokenAccount(connection, {
    mintAddress: state.mintAddress,
    tokenAccountAddress: holderTokenAccount
  });

  console.log("USOL Mainnet deployment verified (read-only; no record updates or transactions).");
  console.log(`Mint: ${state.mintAddress}`);
  console.log(`Decimals: ${mintInfo.decimals}; total mint supply: ${config.TOKEN.initialSupply} USOL`);
  console.log("Mint and freeze authorities: revoked (null)");
  console.log(`Metadata account: ${state.metadataAccount}`);
  console.log(`Metadata URI: ${state.metadataUri}`);
  console.log(`Logo URI: ${config.DEPLOYMENT.imageUri}`);
  console.log(`Original holder token account: ${holderTokenAccount} (balance not assumed)`);
  console.log(config.explorerAddressUrl(state.mintAddress));
}

main().catch((error) => {
  console.error(`\nVerification failed: ${error.message || error}`);
  process.exitCode = 1;
});
