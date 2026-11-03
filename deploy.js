
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  clusterApiUrl
} = require("@solana/web3.js");

const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} = require("@solana/spl-token");

const fs = require("fs");
const path = require("path");
const os = require("os");

const TOKEN_NAME = "UnitedSolana";
const TOKEN_SYMBOL = "USOL";
const TOTAL_SUPPLY = 1_000_000_000n;
const DECIMALS = 9;

const connection = new Connection(
  clusterApiUrl("devnet"),
  "confirmed"
);

// Keep wallet outside the GitHub project.
const walletDir = path.join(
  os.homedir(),
  ".config",
  "unitedsolana"
);

const keyfile = path.join(
  walletDir,
  "devnet-keypair.json"
);

async function main() {
  console.log(`Starting ${TOKEN_NAME} (${TOKEN_SYMBOL})`);
  console.log("Network: Solana Devnet");

  // Prevent accidental duplicate deployment.
  if (fs.existsSync("mint-address.txt")) {
    throw new Error(
      "Mint address already exists. Deployment stopped."
    );
  }

  // Load or generate development wallet.
  fs.mkdirSync(walletDir, { recursive: true });

  let deployer;

  if (fs.existsSync(keyfile)) {
    const secret = JSON.parse(
      fs.readFileSync(keyfile, "utf8")
    );

    deployer = Keypair.fromSecretKey(
      Uint8Array.from(secret)
    );

    console.log("Development wallet loaded.");
  } else {
    deployer = Keypair.generate();

    fs.writeFileSync(
      keyfile,
      JSON.stringify(Array.from(deployer.secretKey)),
      { mode: 0o600 }
    );

    fs.chmodSync(keyfile, 0o600);

    console.log("New development wallet created.");
  }

  console.log(
    "Wallet address:",
    deployer.publicKey.toBase58()
  );

  // Check balance.
  let balance = await connection.getBalance(
    deployer.publicKey
  );

  console.log(
    "Balance:",
    balance / LAMPORTS_PER_SOL,
    "SOL"
  );

  // Request Devnet SOL if needed.
  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.log("Requesting Devnet SOL...");

    const signature = await connection.requestAirdrop(
      deployer.publicKey,
      2 * LAMPORTS_PER_SOL
    );

    await connection.confirmTransaction(
      signature,
      "confirmed"
    );

    balance = await connection.getBalance(
      deployer.publicKey
    );

    console.log(
      "Updated balance:",
      balance / LAMPORTS_PER_SOL,
      "SOL"
    );
  }

  if (balance < 0.05 * LAMPORTS_PER_SOL) {
    throw new Error("Insufficient Devnet SOL.");
  }

  // Create USOL mint.
  console.log("Creating USOL token mint...");

  const mint = await createMint(
    connection,
    deployer,
    deployer.publicKey,
    deployer.publicKey,
    DECIMALS
  );

  const mintAddress = mint.toBase58();

  fs.writeFileSync(
    "mint-address.txt",
    mintAddress
  );

  console.log("USOL Mint:", mintAddress);

  // Create associated token account.
  console.log("Creating token account...");

  const tokenAccount =
    await getOrCreateAssociatedTokenAccount(
      connection,
      deployer,
      mint,
      deployer.publicKey
    );

  console.log(
    "Token account:",
    tokenAccount.address.toBase58()
  );

  // Mint 1 billion USOL.
  console.log("Minting initial supply...");

  const amount =
    TOTAL_SUPPLY * (10n ** BigInt(DECIMALS));

  const mintSignature = await mintTo(
    connection,
    deployer,
    mint,
    tokenAccount.address,
    deployer,
    amount
  );

  console.log("Mint transaction:", mintSignature);

  console.log("\nDeployment successful!");
  console.log("Name:", TOKEN_NAME);
  console.log("Symbol:", TOKEN_SYMBOL);
  console.log("Supply:", TOTAL_SUPPLY.toString());
  console.log("Decimals:", DECIMALS);
  console.log("Mint:", mintAddress);
  console.log("Network: Devnet");
  console.log(
    "Explorer:",
    `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`
  );
  console.log("Mint authority remains active.");
  console.log("Freeze authority remains active.");
}

main().catch((error) => {
  console.error("Deployment failed:", error.message);
  process.exitCode = 1;
});
