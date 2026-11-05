const fs = require("fs");
const readline = require("readline");
const {
  Connection,
  Keypair,
  PublicKey,
  Transaction
} = require("@solana/web3.js");

const {
  getMint,
  createSetAuthorityInstruction,
  AuthorityType,
  TOKEN_PROGRAM_ID
} = require("@solana/spl-token");

const MINT_ADDRESS = "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG";
const EXPECTED_AUTHORITY = "HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT";
const EXPECTED_FEE_PAYER = "FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU";

async function main() {
  const dir = process.env.HOME + "/.config/unitedsolana/mainnet/";

  const loadKey = name => Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(dir + name, "utf8")))
  );

  const authority = loadKey("authority.json");
  const feePayer = loadKey("fee-payer.json");

  if (authority.publicKey.toBase58() !== EXPECTED_AUTHORITY) {
    throw new Error("Authority wallet mismatch. Stopping.");
  }

  if (feePayer.publicKey.toBase58() !== EXPECTED_FEE_PAYER) {
    throw new Error("Fee-payer wallet mismatch. Stopping.");
  }

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  const mintAddress = new PublicKey(MINT_ADDRESS);
  const mintBefore = await getMint(
    connection, mintAddress, "confirmed", TOKEN_PROGRAM_ID
  );

  if (!mintBefore.mintAuthority ||
      !mintBefore.mintAuthority.equals(authority.publicKey)) {
    throw new Error("On-chain mint authority does not match. Stopping.");
  }

  console.log("USOL mint:", MINT_ADDRESS);
  console.log("Current supply:", mintBefore.supply.toString());
  console.log("Current mint authority:", mintBefore.mintAuthority.toBase58());
  console.log("Freeze authority:", mintBefore.freezeAuthority?.toBase58() ?? "REVOKED");
  console.log("Fee payer:", feePayer.publicKey.toBase58());

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    feePayer: feePayer.publicKey,
    recentBlockhash: blockhash
  }).add(
    createSetAuthorityInstruction(
      mintAddress,
      authority.publicKey,
      AuthorityType.MintTokens,
      null,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  transaction.partialSign(authority, feePayer);

  console.log("\nSimulating transaction...");
  const simulation = await connection.simulateTransaction(transaction);

  if (simulation.value.err) {
    console.error("Simulation failed:", simulation.value.err);
    console.error(simulation.value.logs);
    throw new Error("Nothing was submitted.");
  }

  console.log("Simulation passed.");
  console.log("\nThis action permanently revokes mint authority.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question(
      '\nType REVOKE USOL MINT AUTHORITY to submit: ',
      resolve
    );
  });
  rl.close();

  if (answer.trim() !== "REVOKE USOL MINT AUTHORITY") {
    console.log("Confirmation did not match. Transaction NOT submitted.");
    return;
  }

  console.log("Submitting to Solana Mainnet...");

  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    { skipPreflight: false, preflightCommitment: "confirmed" }
  );

  console.log("Transaction signature:", signature);

  const confirmation = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  if (confirmation.value.err) {
    throw new Error("Transaction confirmation reported an error: " +
      JSON.stringify(confirmation.value.err));
  }

  const mintAfter = await getMint(
    connection, mintAddress, "confirmed", TOKEN_PROGRAM_ID
  );

  console.log("\nFinal mint authority:",
    mintAfter.mintAuthority?.toBase58() ?? "REVOKED");
  console.log("Final freeze authority:",
    mintAfter.freezeAuthority?.toBase58() ?? "REVOKED");
  console.log("Final supply:", mintAfter.supply.toString());
  console.log("Transaction confirmed:", signature);
}

main().catch(error => {
  console.error("\nStopped:", error.message);
  process.exitCode = 1;
});
