#!/usr/bin/env node
"use strict";

// UnitedSOLANA (USOL) — Solana Mainnet mint launch.
//
// Dry run by default: validates the Mainnet configuration, the RPC's genesis
// hash, the fee payer's balance, the real network fee and the exact cost, then
// prints the plan. Nothing is signed or submitted.
//
// `--execute` (plus the confirmation phrase) creates the mint, the initial
// holder's associated token account and the 1,000,000,000 USOL supply in one
// atomic transaction — the only step in this project that spends Mainnet SOL.
//
// `--self-test` checks configuration, validation, fees and the transaction
// builder offline; it never touches the network.

const assert = require("assert");
const fs = require("fs");

const {
  Keypair,
  PublicKey,
  SystemProgram,
  sendAndConfirmTransaction
} = require("@solana/web3.js");

const {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} = require("@solana/spl-token");

const config = require("./config/mainnet");
const { loadState, saveState } = require("./lib/state");
const { withDeploymentLock } = require("./lib/lock");
const {
  readKeypair,
  assertAddress,
  describeKeypairFile,
  writeKeypair
} = require("./lib/wallets");
const { buildLaunchTransaction } = require("./lib/launch-transaction");
const { assertMainnetRpc, feeForTransaction } = require("./lib/rpc");
const {
  assertMintOnChain,
  assertHolderTokenAccount,
  assertTokenAccountFields
} = require("./lib/verify");
const { heading, formatSol, confirmExecution } = require("./lib/cli");

// Standard rent-exempt minimums, shown only when the RPC cannot be reached.
const DEFAULT_MINT_RENT = 1_461_600;
const DEFAULT_ATA_RENT = 2_039_280;
const ATA_SIZE = 165;

function validateConfiguration() {
  const problems = [];

  if (config.NETWORK !== "mainnet-beta") {
    problems.push(`network must be mainnet-beta, found "${config.NETWORK}"`);
  }

  try {
    config.assertValidWallets();
  } catch (error) {
    problems.push(error.message);
  }

  if (config.TOKEN.name !== "UnitedSOLANA" || config.TOKEN.symbol !== "USOL") {
    problems.push(
      `token must be UnitedSOLANA (USOL), found ${config.TOKEN.name} (${config.TOKEN.symbol})`
    );
  }

  if (config.TOKEN.decimals !== 9) {
    problems.push(`decimals must be 9, found ${config.TOKEN.decimals}`);
  }

  if (config.TOKEN.initialSupply !== 1_000_000_000n) {
    problems.push(
      `initial supply must be 1,000,000,000, found ${config.TOKEN.initialSupply}`
    );
  }

  if (config.allocationTotal() !== config.TOKEN.initialSupply) {
    problems.push(
      `planned allocation totals ${config.allocationTotal()}, expected ${config.TOKEN.initialSupply}`
    );
  }

  if (!fs.existsSync(config.LOGO_PATH)) {
    problems.push(`logo not found at ${config.LOGO_PATH}`);
  }

  if (problems.length > 0) {
    throw new Error(`Mainnet configuration is invalid:\n- ${problems.join("\n- ")}`);
  }
}

function printConfiguration(rpcUrl) {
  heading("UnitedSOLANA (USOL) — Mainnet launch");

  console.log(`Network            Solana Mainnet (${config.NETWORK})`);
  console.log(`RPC                ${rpcUrl}`);
  console.log(`Token name         ${config.TOKEN.name}`);
  console.log(`Symbol             ${config.TOKEN.symbol}`);
  console.log(`Standard           ${config.TOKEN.standard}`);
  console.log(`Decimals           ${config.TOKEN.decimals}`);
  console.log(
    `Initial supply     ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL`
  );
  console.log(`Fee payer          ${config.WALLETS.feePayer}`);
  console.log(`Initial holder     ${config.WALLETS.initialHolder}`);
  console.log(`Mint authority     ${config.WALLETS.mintAuthority}`);
  console.log(`Freeze authority   ${config.WALLETS.freezeAuthority}`);
}

function printAllocation() {
  heading("Planned allocation (recorded only — nothing is transferred)");

  for (const entry of config.ALLOCATION) {
    console.log(
      `  ${entry.amount.toLocaleString("en-US").padStart(13)} USOL  ${entry.label}`
    );
  }

  console.log(
    `  ${config.allocationTotal().toLocaleString("en-US").padStart(13)} USOL  Total (minted entirely to the HxDW wallet)`
  );
}

function loadLaunchKeypairs() {
  const feePayer = readKeypair(config.KEYPAIRS.feePayer, "fee payer");
  assertAddress(feePayer, config.WALLETS.feePayer, "fee payer");

  const authority = readKeypair(config.KEYPAIRS.authority, "mint authority");
  assertAddress(authority, config.WALLETS.mintAuthority, "mint authority");
  assertAddress(authority, config.WALLETS.freezeAuthority, "freeze authority");
  assertAddress(authority, config.WALLETS.initialHolder, "initial holder");

  return { feePayer, authority };
}

function buildPreviewTransaction(mintRentLamports) {
  return buildLaunchTransaction({
    mintKeypair: Keypair.generate(),
    feePayer: new PublicKey(config.WALLETS.feePayer),
    mintAuthority: new PublicKey(config.WALLETS.mintAuthority),
    freezeAuthority: new PublicKey(config.WALLETS.freezeAuthority),
    holder: new PublicKey(config.WALLETS.initialHolder),
    decimals: config.TOKEN.decimals,
    rawAmount: config.rawInitialSupply(),
    mintRentLamports
  }).transaction;
}

async function readPreflight(connection) {
  const preflight = {
    rpcOk: false,
    version: null,
    genesisHash: null,
    genesisOk: false,
    balance: null,
    mintRent: DEFAULT_MINT_RENT,
    ataRent: DEFAULT_ATA_RENT,
    feeLamports: null,
    holderExists: null,
    error: null
  };

  try {
    const version = await connection.getVersion();
    preflight.version = version["solana-core"] || "unknown";

    preflight.genesisHash = await connection.getGenesisHash();
    preflight.genesisOk = preflight.genesisHash === config.MAINNET_GENESIS_HASH;
    preflight.rpcOk = true;

    preflight.balance = await connection.getBalance(
      new PublicKey(config.WALLETS.feePayer),
      "confirmed"
    );

    preflight.mintRent = await connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );
    preflight.ataRent = await connection.getMinimumBalanceForRentExemption(
      ATA_SIZE
    );

    preflight.holderExists = Boolean(
      await connection.getAccountInfo(
        new PublicKey(config.WALLETS.initialHolder),
        "confirmed"
      )
    );

    const preview = buildPreviewTransaction(preflight.mintRent);
    preflight.feeLamports = (
      await feeForTransaction(connection, preview)
    ).feeLamports;
  } catch (error) {
    preflight.error = error.message;
  }

  return preflight;
}

function printPlan(preflight, keypairError) {
  heading("Preflight");

  console.log(
    preflight.rpcOk
      ? `RPC reachable (solana-core ${preflight.version})`
      : `RPC not reachable: ${preflight.error}`
  );

  if (preflight.rpcOk) {
    console.log(
      preflight.genesisOk
        ? `Genesis hash       ${preflight.genesisHash} (Mainnet confirmed)`
        : `Genesis hash       ${preflight.genesisHash} — NOT Mainnet, execution will be refused`
    );

    console.log(
      `Fee payer balance  ${formatSol(preflight.balance)} (${config.WALLETS.feePayer})`
    );
    console.log(
      `Holder wallet      ${preflight.holderExists ? "exists on Mainnet" : "not funded yet (it can still receive tokens)"}`
    );
  } else {
    console.log(
      "Rent figures below are standard values; the fee is recalculated from the real transaction at execution."
    );
  }

  console.log("\nTransaction plan (one atomic transaction):");
  console.log("  1. Create the USOL mint account (fee payer pays rent)");
  console.log(`  2. Initialize mint: ${config.TOKEN.decimals} decimals, mint authority ${config.WALLETS.mintAuthority}`);
  console.log(`  3. Set freeze authority ${config.WALLETS.freezeAuthority}`);
  console.log(`  4. Create the associated token account for ${config.WALLETS.initialHolder}`);
  console.log(
    `  5. Mint ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL to that account`
  );

  const estimatedTotal =
    preflight.feeLamports === null
      ? null
      : preflight.mintRent + preflight.ataRent + preflight.feeLamports;

  console.log("\nEstimated cost (paid by the fee payer):");
  console.log(`  Mint account rent      ${formatSol(preflight.mintRent)}`);
  console.log(`  Token account rent     ${formatSol(preflight.ataRent)}`);
  console.log(
    `  Network fee            ${
      preflight.feeLamports === null
        ? "calculated at execution"
        : formatSol(preflight.feeLamports)
    }`
  );
  console.log(
    `  Total                  ${
      estimatedTotal === null
        ? "rent only until the RPC answers"
        : formatSol(estimatedTotal)
    }`
  );

  console.log("\nRequired signers:");
  console.log(`  Fee payer (pays)       ${describeKeypairFile(config.KEYPAIRS.feePayer)} — ${config.KEYPAIRS.feePayer}`);
  console.log(`  Mint authority         ${describeKeypairFile(config.KEYPAIRS.authority)} — ${config.KEYPAIRS.authority}`);
  console.log("  Mint account keypair   generated at launch, stored outside the repository");

  if (keypairError) {
    console.log(`\nNOT READY: ${keypairError.message}`);
    console.log(
      "The dry run can still validate configuration and cost; execution needs both keypairs in place."
    );
  }
}

// A recorded mint means the launch already happened: verify it instead of
// creating a second one. A mismatch stops everything.
async function verifyRecordedDeployment(state, rpcUrl) {
  const connection = config.createConnection(rpcUrl);

  heading("Existing Mainnet deployment found");
  console.log(`Recorded mint      ${state.mintAddress}`);
  console.log(`Status             ${state.status}`);

  await assertMainnetRpc(connection);
  await assertMintOnChain(connection, state.mintAddress);

  const tokenAccountAddress =
    state.associatedTokenAccount ||
    getAssociatedTokenAddressSync(
      new PublicKey(state.mintAddress),
      new PublicKey(config.WALLETS.initialHolder),
      false,
      TOKEN_PROGRAM_ID
    ).toBase58();

  await assertHolderTokenAccount(connection, {
    mintAddress: state.mintAddress,
    tokenAccountAddress,
    expectedAmount: config.rawInitialSupply()
  });

  // Correct the record after a verification failure or a run that stopped
  // before it could save these fields. No transaction is involved.
  const needsTokenAccount = !state.associatedTokenAccount;
  const needsStatusCorrection =
    state.status === "mint-created" || state.status === "mint-created-needs-review";

  if (needsTokenAccount || needsStatusCorrection) {
    if (needsTokenAccount) state.associatedTokenAccount = tokenAccountAddress;
    if (needsStatusCorrection) state.status = "mint-verified";
    saveState(state);
  }

  console.log(
    "\nRecorded deployment verified on-chain. No new mint was created and nothing was submitted."
  );
  console.log(
    state.metadataUri
      ? "Next: register the Metaplex metadata (node register-metadata-mainnet.js)."
      : "Next: upload the logo and metadata (node upload-metadata-mainnet.js)."
  );
}

// Reuses the mint keypair of an unfinished attempt. If its account already
// exists on-chain, the run was interrupted after the transaction landed: the
// caller verifies and records that mint instead of creating another one.
async function resolveMintKeypair(connection) {
  if (fs.existsSync(config.KEYPAIRS.mint)) {
    const existing = readKeypair(config.KEYPAIRS.mint, "mint");
    const account = await connection.getAccountInfo(
      existing.publicKey,
      "confirmed"
    );

    if (account) return { mintKeypair: existing, recovering: true };

    console.log(
      `\nReusing the mint keypair from a previous attempt: ${existing.publicKey.toBase58()} (no account exists yet).`
    );
    return { mintKeypair: existing, recovering: false };
  }

  const mintKeypair = Keypair.generate();
  writeKeypair(config.KEYPAIRS.mint, mintKeypair);

  console.log(
    `\nNew mint keypair written to ${config.KEYPAIRS.mint} (mode 600, outside the repository).`
  );
  console.log(`Mint address: ${mintKeypair.publicKey.toBase58()}`);

  return { mintKeypair, recovering: false };
}

async function recordVerifiedLaunch({ connection, state, mintAddress, tokenAccountAddress, signature }) {
  const rawAmount = config.rawInitialSupply();

  state.status = "mint-created";
  state.mintAddress = mintAddress;
  state.associatedTokenAccount = tokenAccountAddress;
  if (signature) state.transactions.mintCreation = signature;
  saveState(state);

  try {
    await assertMintOnChain(connection, mintAddress);
    await assertHolderTokenAccount(connection, {
      mintAddress,
      tokenAccountAddress,
      expectedAmount: rawAmount
    });
  } catch (error) {
    state.status = "mint-created-needs-review";
    saveState(state);
    throw new Error(
      `The mint exists but verification failed: ${error.message}\nMint: ${mintAddress}${
        signature ? `\nSignature: ${signature}` : ""
      }`
    );
  }

  state.status = "mint-verified";
  saveState(state);

  console.log("\nVerified on Mainnet:");
  console.log(`  Decimals           ${config.TOKEN.decimals}`);
  console.log(`  Supply             ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL`);
  console.log(`  Mint authority     ${config.WALLETS.mintAuthority} (active)`);
  console.log(`  Freeze authority   ${config.WALLETS.freezeAuthority} (active)`);
  console.log(`  Holder             ${config.WALLETS.initialHolder}`);
  console.log(`  Holder balance     ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL`);
  console.log(`\nMint address       ${mintAddress}`);
  console.log(`Token account      ${tokenAccountAddress}`);
  console.log(config.explorerAddressUrl(mintAddress));
  console.log("\nNext: upload the logo and metadata (node upload-metadata-mainnet.js).");
}

async function recoverInterruptedLaunch(connection, mintKeypair) {
  const mintAddress = mintKeypair.publicKey.toBase58();
  const tokenAccountAddress = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    new PublicKey(config.WALLETS.initialHolder),
    false,
    TOKEN_PROGRAM_ID
  ).toBase58();

  console.log(
    `\nInterrupted deployment detected: mint ${mintAddress} already exists on-chain. Verifying it instead of creating a second mint.`
  );

  try {
    await assertMintOnChain(connection, mintAddress);
    await assertHolderTokenAccount(connection, {
      mintAddress,
      tokenAccountAddress,
      expectedAmount: config.rawInitialSupply()
    });
  } catch (error) {
    throw new Error(
      `A mint account exists at ${mintAddress} but it does not match the confirmed launch: ${error.message}\nNothing was changed or recorded. Inspect that mint before retrying.`
    );
  }

  const state = loadState();
  state.recovery = {
    recoveredAt: new Date().toISOString(),
    note: "Recovered from an interrupted launch; the creation signature was not recorded. Verify it on the explorer before registering metadata."
  };
  state.status = "mint-verified";
  state.mintAddress = mintAddress;
  state.associatedTokenAccount = tokenAccountAddress;
  saveState(state);
}

async function executeLaunch({ connection, keypairs, state }) {
  const { mintKeypair, recovering } = await resolveMintKeypair(connection);

  if (recovering) {
    await recoverInterruptedLaunch(connection, mintKeypair);
    return;
  }

  console.log("\nConfirming Solana Mainnet before building the transaction…");
  await assertMainnetRpc(connection);

  const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
  const ataRent = await connection.getMinimumBalanceForRentExemption(ATA_SIZE);

  const { transaction, mint, associatedTokenAccount } = buildLaunchTransaction({
    mintKeypair,
    feePayer: keypairs.feePayer.publicKey,
    mintAuthority: keypairs.authority.publicKey,
    freezeAuthority: new PublicKey(config.WALLETS.freezeAuthority),
    holder: new PublicKey(config.WALLETS.initialHolder),
    decimals: config.TOKEN.decimals,
    rawAmount: config.rawInitialSupply(),
    mintRentLamports: mintRent
  });

  // Fee for this exact message: three signatures and four instructions.
  const { feeLamports } = await feeForTransaction(connection, transaction);
  const requiredLamports = mintRent + ataRent + feeLamports;
  const balance = await connection.getBalance(
    keypairs.feePayer.publicKey,
    "confirmed"
  );

  console.log(`Network fee for this transaction: ${formatSol(feeLamports)}`);
  console.log(`Total required: ${formatSol(requiredLamports)}`);
  console.log(`Fee payer balance: ${formatSol(balance)}`);

  if (balance < requiredLamports) {
    throw new Error(
      `Fee payer holds ${formatSol(balance)} but the launch needs ${formatSol(requiredLamports)}. Nothing was submitted.`
    );
  }

  console.log("\nSimulating against Mainnet (no state change)…");

  const simulation = await connection.simulateTransaction(transaction, [
    keypairs.feePayer,
    mintKeypair,
    keypairs.authority
  ]);

  if (simulation.value.err) {
    throw new Error(
      `Simulation failed: ${JSON.stringify(simulation.value.err)} ${(simulation.value.logs || []).join(" | ")}`
    );
  }

  console.log("Simulation succeeded. Submitting…");

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [keypairs.feePayer, mintKeypair, keypairs.authority],
    { commitment: "confirmed" }
  );

  console.log(`\nTransaction confirmed: ${signature}`);
  console.log(config.explorerTransactionUrl(signature));

  await recordVerifiedLaunch({
    connection,
    state,
    mintAddress: mint.toBase58(),
    tokenAccountAddress: associatedTokenAccount.toBase58(),
    signature
  });
}

async function main() {
  if (process.argv.includes("--self-test")) {
    return selfTest();
  }

  const rpcUrl = config.resolveRpcUrl();

  validateConfiguration();
  printConfiguration(rpcUrl);

  const state = loadState();

  if (state.mintAddress) {
    return verifyRecordedDeployment(state, rpcUrl);
  }

  const connection = config.createConnection(rpcUrl);

  let keypairs = null;
  let keypairError = null;

  try {
    keypairs = loadLaunchKeypairs();
  } catch (error) {
    keypairError = error;
  }

  const preflight = await readPreflight(connection);
  printPlan(preflight, keypairError);
  printAllocation();

  const approved = await confirmExecution({
    action: "create the USOL mint and mint 1,000,000,000 USOL"
  });

  if (!approved) return;

  if (keypairError) {
    throw new Error(`${keypairError.message} Nothing was submitted.`);
  }

  if (!preflight.rpcOk) {
    throw new Error(`RPC is not reachable: ${preflight.error}`);
  }

  await withDeploymentLock("launch", async () => {
    const currentState = loadState();

    if (currentState.mintAddress) {
      throw new Error(
        `A Mainnet mint is already recorded: ${currentState.mintAddress}. Refusing to create a second mint.`
      );
    }

    await executeLaunch({
      connection,
      keypairs,
      state: currentState
    });
  });
}

// ---------------------------------------------------------------------------
// Offline self-test: proves configuration, validation, genesis check, dynamic
// fee calculation and the launch transaction without any network request.
// ---------------------------------------------------------------------------

async function selfTest() {
  heading("USOL Mainnet self-test (offline — nothing is signed or sent)");

  const results = [];

  const check = (label, fn) => {
    try {
      fn();
      results.push({ ok: true, label });
    } catch (error) {
      results.push({ ok: false, label: `${label}: ${error.message}` });
    }
  };

  const checkAsync = async (label, fn) => {
    try {
      await fn();
      results.push({ ok: true, label });
    } catch (error) {
      results.push({ ok: false, label: `${label}: ${error.message}` });
    }
  };

  check("configuration matches the confirmed token details, wallets and allocation", () => {
    validateConfiguration();
  });

  check("all four confirmed wallets are valid on-curve wallet addresses", () => {
    config.assertValidWalletAddress(config.WALLETS.feePayer, "fee payer");
    config.assertValidWalletAddress(config.WALLETS.initialHolder, "initial holder");
    config.assertValidWalletAddress(config.WALLETS.mintAuthority, "mint authority");
    config.assertValidWalletAddress(config.WALLETS.freezeAuthority, "freeze authority");
  });

  check("malformed and off-curve addresses are rejected", () => {
    assert.throws(
      () => config.assertValidWalletAddress("not-a-wallet", "fee payer"),
      /not a base58/
    );
    assert.throws(() =>
      config.assertValidWalletAddress(
        config.WALLETS.feePayer.slice(0, -1),
        "fee payer"
      )
    );
    const [offCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("usol-off-curve-check")],
      new PublicKey(config.METADATA_PROGRAM_ID)
    );
    assert.throws(
      () =>
        config.assertValidWalletAddress(
          offCurve.toBase58(),
          "off-curve account"
        ),
      /on-curve/
    );
  });

  check("planned allocation totals exactly the 1,000,000,000 USOL supply", () => {
    assert.strictEqual(config.allocationTotal(), config.TOKEN.initialSupply);
    for (const entry of config.ALLOCATION) {
      assert.ok(entry.amount > 0n, `${entry.label} must be positive`);
    }
  });

  const mintKeypair = Keypair.generate();
  const feePayer = Keypair.generate();
  const mintAuthority = Keypair.generate();
  const freezeAuthority = Keypair.generate();
  const holder = new PublicKey(config.WALLETS.initialHolder);
  const decimals = config.TOKEN.decimals;
  const rawAmount = config.rawInitialSupply();
  const mintRentLamports = DEFAULT_MINT_RENT;

  const { transaction, associatedTokenAccount } = buildLaunchTransaction({
    mintKeypair,
    feePayer: feePayer.publicKey,
    mintAuthority: mintAuthority.publicKey,
    freezeAuthority: freezeAuthority.publicKey,
    holder,
    decimals,
    rawAmount,
    mintRentLamports
  });

  const [createMintIx, initMintIx, createAtaIx, mintToIx] = transaction.instructions;
  const initialize = initMintIx.data;

  check("launch transaction has four instructions", () => {
    assert.strictEqual(transaction.instructions.length, 4);
  });

  check("mint account is allocated by the SPL Token program", () => {
    assert.ok(createMintIx.programId.equals(SystemProgram.programId));
    assert.strictEqual(createMintIx.keys[0].pubkey.toBase58(), feePayer.publicKey.toBase58());
    assert.strictEqual(createMintIx.keys[1].pubkey.toBase58(), mintKeypair.publicKey.toBase58());
    assert.strictEqual(Number(createMintIx.data.readBigUInt64LE(12)), MINT_SIZE);
    assert.strictEqual(
      new PublicKey(createMintIx.data.subarray(20, 52)).toBase58(),
      TOKEN_PROGRAM_ID.toBase58()
    );
  });

  check("mint is initialized with 9 decimals and both authorities written separately", () => {
    assert.ok(initMintIx.programId.equals(TOKEN_PROGRAM_ID));
    assert.strictEqual(initialize[0], 20, "expected InitializeMint2");
    assert.strictEqual(initialize[1], 9);
    assert.strictEqual(
      new PublicKey(initialize.subarray(2, 34)).toBase58(),
      mintAuthority.publicKey.toBase58()
    );
    assert.strictEqual(initialize[34], 1, "freeze authority must be present");
    assert.strictEqual(
      new PublicKey(initialize.subarray(35, 67)).toBase58(),
      freezeAuthority.publicKey.toBase58()
    );
  });

  check("initial holder gets an associated token account it owns", () => {
    assert.ok(createAtaIx.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID));
    assert.strictEqual(createAtaIx.keys[0].pubkey.toBase58(), feePayer.publicKey.toBase58());
    assert.strictEqual(
      createAtaIx.keys[1].pubkey.toBase58(),
      associatedTokenAccount.toBase58()
    );
    assert.strictEqual(createAtaIx.keys[2].pubkey.toBase58(), holder.toBase58());
    assert.strictEqual(createAtaIx.keys[3].pubkey.toBase58(), mintKeypair.publicKey.toBase58());
  });

  check("mint instruction prints exactly 1,000,000,000 USOL to the holder", () => {
    assert.ok(mintToIx.programId.equals(TOKEN_PROGRAM_ID));
    assert.strictEqual(mintToIx.data[0], 7, "expected MintTo");
    assert.strictEqual(mintToIx.data.readBigUInt64LE(1), 1_000_000_000n * 10n ** 9n);
    assert.strictEqual(
      mintToIx.keys[1].pubkey.toBase58(),
      associatedTokenAccount.toBase58()
    );
    assert.strictEqual(
      mintToIx.keys[2].pubkey.toBase58(),
      mintAuthority.publicKey.toBase58()
    );
    assert.ok(mintToIx.keys[2].isSigner, "mint authority must sign");
  });

  check("token account checks reject the wrong mint, owner and balance", () => {
    const mint = mintKeypair.publicKey.toBase58();
    const tokenAccountAddress = associatedTokenAccount.toBase58();
    const account = { mint: mintKeypair.publicKey, owner: holder, amount: rawAmount };

    assert.strictEqual(
      assertTokenAccountFields(account, {
        mintAddress: mint,
        tokenAccountAddress,
        expectedAmount: rawAmount
      }).amount,
      rawAmount
    );

    assert.throws(
      () =>
        assertTokenAccountFields(
          { ...account, mint: Keypair.generate().publicKey },
          { mintAddress: mint, tokenAccountAddress }
        ),
      /belongs to mint/
    );

    assert.throws(
      () =>
        assertTokenAccountFields(
          { ...account, owner: Keypair.generate().publicKey },
          { mintAddress: mint, tokenAccountAddress }
        ),
      /is owned by/
    );

    assert.throws(
      () =>
        assertTokenAccountFields(account, {
          mintAddress: mint,
          tokenAccountAddress,
          expectedAmount: rawAmount + 1n
        }),
      /holds/
    );
  });

  check("all three required signers sign the transaction", () => {
    // A throwaway blockhash is enough to assemble and verify signatures offline.
    transaction.feePayer = feePayer.publicKey;
    transaction.recentBlockhash = "11111111111111111111111111111111";
    transaction.sign(feePayer, mintKeypair, mintAuthority);

    assert.strictEqual(
      transaction.signatures.length,
      3,
      "fee payer, mint keypair and authority must each have a signature slot"
    );

    for (const { publicKey, signature } of transaction.signatures) {
      assert.strictEqual(signature.length, 64, `${publicKey.toBase58()} did not sign`);
    }

    if (typeof transaction.verifySignatures === "function") {
      assert.ok(transaction.verifySignatures(), "signatures must verify");
    }
  });

  check("a keypair that is not the confirmed wallet is rejected", () => {
    assert.throws(
      () => assertAddress(Keypair.generate(), config.WALLETS.feePayer, "fee payer"),
      /Refusing to continue/
    );
  });

  check("a non-Mainnet RPC override is rejected", () => {
    const original = process.env.USOL_RPC_URL;
    process.env.USOL_RPC_URL = "https://api.testnet.solana.com";

    try {
      assert.throws(() => config.resolveRpcUrl(), /refusing/);
    } finally {
      if (original === undefined) delete process.env.USOL_RPC_URL;
      else process.env.USOL_RPC_URL = original;
    }
  });

  await checkAsync("the Mainnet genesis hash is required and other clusters are refused", async () => {
    const mainnetStub = {
      getGenesisHash: async () => config.MAINNET_GENESIS_HASH
    };
    const otherClusterStub = {
      getGenesisHash: async () => "11111111111111111111111111111111"
    };

    assert.strictEqual(
      await assertMainnetRpc(mainnetStub),
      config.MAINNET_GENESIS_HASH
    );
    await assert.rejects(() => assertMainnetRpc(otherClusterStub), /not Solana Mainnet/);
  });

  await checkAsync("the fee comes from the message, not a hardcoded constant", async () => {
    const feeMessage = buildPreviewTransaction(mintRentLamports);
    const feeStub = {
      getLatestBlockhash: async () => ({
        blockhash: "11111111111111111111111111111111"
      }),
      getFeeForMessage: async (message) => {
        assert.strictEqual(message.header.numRequiredSignatures, 3);
        return { value: 7_500 };
      }
    };

    const { feeLamports } = await feeForTransaction(feeStub, feeMessage);
    assert.strictEqual(feeLamports, 7_500);

    const nullFeeStub = {
      getLatestBlockhash: async () => ({
        blockhash: "11111111111111111111111111111111"
      }),
      getFeeForMessage: async () => ({ value: null })
    };

    await assert.rejects(
      () => feeForTransaction(nullFeeStub, buildPreviewTransaction(mintRentLamports)),
      /refusing to guess/
    );
  });

  check("the deployment record stores the mint field and planned allocation", () => {
    const state = loadState();
    assert.ok(Object.prototype.hasOwnProperty.call(state, "mintAddress"));
    assert.strictEqual(state.network, "mainnet-beta");
    assert.strictEqual(state.mintAddress, null);
    const total = state.plannedAllocation.reduce(
      (sum, entry) => sum + BigInt(entry.amount),
      0n
    );
    assert.strictEqual(total, config.TOKEN.initialSupply);
  });

  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label}`);
  }

  const failed = results.filter((result) => !result.ok).length;
  console.log(
    `\n${results.length - failed}/${results.length} checks passed. No network requests, signatures or SOL spent.`
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n${error.message || error}`);
  process.exitCode = 1;
});
