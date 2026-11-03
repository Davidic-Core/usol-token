const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction
} = require("@solana/web3.js");

const {
  TOKEN_PROGRAM_ID,
  getAccount,
  getMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction
} = require("@solana/spl-token");

async function main() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const keyPath = path.join(
    os.homedir(),
    ".config",
    "unitedsolana",
    "devnet-keypair.json"
  );

  const secret = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const payer = Keypair.fromSecretKey(new Uint8Array(secret));

  const mint = new PublicKey(
    "98Y5HKzViGUhZqtqyqjcZZsAPpLf6k8Tx4SM8JxiMHvi"
  );

  const source = new PublicKey(
    "CuwTxJVtpAmLmfv3p6vtWUQiqybitkDDuVRMhV16dwig"
  );

  const recipient = new PublicKey(
    "GE1AQqinp6xJmeRvS87rfmNEDVaJqebyHM3oD7Q4yWwD"
  );

  const amount = 100n;
  const decimals = 9;
  const rawAmount = amount * 10n ** BigInt(decimals);

  console.log("\nUnitedSolana Devnet Transfer");
  console.log("From:", payer.publicKey.toBase58());
  console.log("To:", recipient.toBase58());
  console.log("Amount:", amount.toString(), "USOL");

  const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);

  if (mintInfo.decimals !== decimals) {
    throw new Error("Unexpected mint decimals.");
  }

  const sourceInfo = await getAccount(
    connection,
    source,
    "confirmed",
    TOKEN_PROGRAM_ID
  );

  if (!sourceInfo.owner.equals(payer.publicKey)) {
    throw new Error("Your development wallet does not own the source token account.");
  }

  if (!sourceInfo.mint.equals(mint)) {
    throw new Error("Source token account has the wrong mint.");
  }

  if (sourceInfo.amount < rawAmount) {
    throw new Error("Insufficient USOL balance.");
  }

  const destination = await getAssociatedTokenAddress(
    mint,
    recipient,
    false,
    TOKEN_PROGRAM_ID
  );

  const transaction = new Transaction();
  const destinationInfo = await connection.getAccountInfo(destination);

  if (!destinationInfo) {
    console.log("\nRecipient token account does not exist yet.");
    console.log("It will be created automatically in the transfer transaction.");
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        destination,
        recipient,
        mint,
        TOKEN_PROGRAM_ID
      )
    );
  } else {
    const account = await getAccount(
      connection,
      destination,
      "confirmed",
      TOKEN_PROGRAM_ID
    );

    if (!account.owner.equals(recipient) || !account.mint.equals(mint)) {
      throw new Error("Recipient token account validation failed.");
    }
  }

  transaction.add(
    createTransferCheckedInstruction(
      source,
      mint,
      destination,
      payer.publicKey,
      rawAmount,
      decimals,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  console.log("\nSource token account:", source.toBase58());
  console.log("Recipient token account:", destination.toBase58());
  console.log("Current sender balance:", (Number(sourceInfo.amount) / 1e9).toString(), "USOL");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question("\nSend exactly 100 USOL? Type YES to confirm: ", resolve);
  });

  rl.close();

  if (answer.trim() !== "YES") {
    console.log("Cancelled. No transfer submitted.");
    return;
  }

  console.log("\nSubmitting transfer...");

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer],
    { commitment: "confirmed" }
  );

  const updatedSource = await getAccount(connection, source);
  const updatedDestination = await getAccount(connection, destination);

  console.log("\nTRANSFER SUCCESSFUL");
  console.log("Transaction:", signature);
  console.log("Sender balance:", (Number(updatedSource.amount) / 1e9), "USOL");
  console.log("Recipient balance:", (Number(updatedDestination.amount) / 1e9), "USOL");
  console.log(
    "Explorer:",
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );
}

main().catch(error => {
  console.error("\nTransfer failed:", error.message || error);
  process.exit(1);
});
