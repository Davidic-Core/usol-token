const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const { Connection, PublicKey } = require("@solana/web3.js");
const { getMint, TOKEN_PROGRAM_ID } = require("@solana/spl-token");

const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const {
  keypairIdentity,
  publicKey,
  percentAmount
} = require("@metaplex-foundation/umi");

const {
  mplTokenMetadata,
  createV1,
  TokenStandard
} = require("@metaplex-foundation/mpl-token-metadata");

const MINT_ADDRESS = "98Y5HKzViGUhZqtqyqjcZZsAPpLf6k8Tx4SM8JxiMHvi";
const METADATA_PROGRAM = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function main() {
  const keyPath = path.join(
    os.homedir(),
    ".config",
    "unitedsolana",
    "devnet-keypair.json"
  );

  const secret = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const umi = createUmi("https://api.devnet.solana.com");
  const wallet = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(secret)
  );

  umi.use(keypairIdentity(wallet));
  umi.use(mplTokenMetadata());

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const mint = new PublicKey(MINT_ADDRESS);
  const walletAddress = new PublicKey(wallet.publicKey);

  console.log("\nUnitedSolana on-chain metadata registration");
  console.log("Network: Solana Devnet");
  console.log("Mint:", MINT_ADDRESS);
  console.log("Wallet:", walletAddress.toBase58());

  // Confirm the mint exists and is a standard SPL token.
  const mintAccount = await connection.getAccountInfo(mint);

  if (!mintAccount) {
    throw new Error("The USOL mint account was not found.");
  }

  if (!mintAccount.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error("This mint is not owned by the standard SPL Token program.");
  }

  const mintInfo = await getMint(connection, mint);

  if (mintInfo.decimals !== 9) {
    throw new Error("Unexpected token decimals. Expected 9.");
  }

  if (
    !mintInfo.mintAuthority ||
    !mintInfo.mintAuthority.equals(walletAddress)
  ) {
    throw new Error("Your wallet is not the current mint authority.");
  }

  // Derive the Metaplex metadata account and check it first.
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM.toBuffer(),
      mint.toBuffer()
    ],
    METADATA_PROGRAM
  );

  const existingMetadata = await connection.getAccountInfo(metadataPda);

  if (existingMetadata) {
    throw new Error(
      "Metadata already exists for this mint. Stopping to avoid overwriting it."
    );
  }

  // Load and validate the uploaded metadata.
  const metadataUri = fs.readFileSync("metadata-uri.txt", "utf8").trim();

  if (!metadataUri.startsWith("https://")) {
    throw new Error("Invalid metadata URI.");
  }

  const response = await fetch(metadataUri);

  if (!response.ok) {
    throw new Error(`Metadata URL returned HTTP ${response.status}.`);
  }

  const metadata = await response.json();

  if (
    metadata.name !== "UnitedSolana" ||
    metadata.symbol !== "USOL" ||
    !metadata.image
  ) {
    throw new Error("Metadata name, symbol, or image did not pass validation.");
  }

  console.log("\nMetadata account:", metadataPda.toBase58());
  console.log("Name:", metadata.name);
  console.log("Symbol:", metadata.symbol);
  console.log("Metadata URI:", metadataUri);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question(
      "\nRegister this metadata on Solana Devnet? Type YES to confirm: ",
      resolve
    );
  });

  rl.close();

  if (answer.trim() !== "YES") {
    console.log("Cancelled. No transaction was submitted.");
    return;
  }

  console.log("\nSubmitting metadata registration...");

  const result = await createV1(umi, {
    mint: publicKey(MINT_ADDRESS),
    authority: umi.identity,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    tokenStandard: TokenStandard.Fungible,
    isMutable: true
  }).sendAndConfirm(umi);

  console.log("\nSUCCESS: USOL metadata registered!");
  console.log("Mint:", MINT_ADDRESS);
  console.log("Metadata account:", metadataPda.toBase58());
  console.log("Metadata URI:", metadataUri);
  console.log(
    "Explorer:",
    `https://explorer.solana.com/address/${MINT_ADDRESS}?cluster=devnet`
  );
  console.log("Transaction signature bytes:", Buffer.from(result.signature).toString("hex"));
}

main().catch(error => {
  console.error("\nRegistration failed:", error.message || error);
  process.exit(1);
});
