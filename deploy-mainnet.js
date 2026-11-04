#!/usr/bin/env node
"use strict";

// UnitedSOLANA (USOL) — Solana Mainnet mint launch.
//
// Dry run by default: validates the Mainnet configuration, reads the fee payer's
// balance and prints the exact plan and cost. Nothing is signed or submitted.
//
// `--execute` (plus the confirmation phrase) creates the mint, the initial
// holder's associated token account and the 1,000,000,000 USOL supply in one
// atomic transaction — the only step in this project that spends Mainnet SOL.
//
// `--self-test` checks the configuration and transaction builder offline; it
// never touches the network.

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
  getAccount,
  getMint
} = require("@solana/spl-token");

const config = require("./config/mainnet");
const { loadState, saveState } = require("./lib/state");
const {
  readKeypair,
  assertAddress,
  describeKeypairFile,
  writeKeypair
} = require("./lib/wallets");
const { buildLaunchTransaction } = require("./lib/launch-transaction");
const { heading, formatSol, confirmExecution } = require("./lib/cli");

// Standard rent-exempt minimums, used only when the RPC cannot be reached.
const DEFAULT_MINT_RENT = 1_461_600;
const DEFAULT_ATA_RENT = 2_039_280;
const EXPECTED_FEE_LAMPORTS = 5_000;
const ATA_SIZE = 165;

function validateConfiguration() {
  const problems = [];

  if (config.NETWORK !== "mainnet-beta") {
    problems.push(`network must be mainnet-beta, found "${config.NETWORK}"`);
  }

  for (const [label, address] of Object.entries(config.WALLETS)) {
    if (!config.isValidAddress(address)) {
      problems.push(`${label} is not a valid Solana address: ${address}`);
    }
  }

  if (config.WALLETS.feePayer === config.WALLETS.initialHolder) {
    problems.push("fee payer and initial holder must be different wallets");
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

function loadLaunchKeypairs() {
  const feePayer = readKeypair(config.KEYPAIRS.feePayer, "fee payer");
  assertAddress(feePayer, config.WALLETS.feePayer, "fee payer");

  const authority = readKeypair(config.KEYPAIRS.authority, "mint authority");
  assertAddress(authority, config.WALLETS.mintAuthority, "mint authority");
  assertAddress(authority, config.WALLETS.initialHolder, "initial holder");

  return { feePayer, authority };
}

async function readPreflight(connection) {
  const preflight = {
    rpcOk: false,
    version: null,
    balance: null,
    mintRent: DEFAULT_MINT_RENT,
    ataRent: DEFAULT_ATA_RENT,
    holderExists: null
  };

  try {
    const version = await connection.getVersion();
    preflight.version = version["solana-core"] || "unknown";
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
      `Fee payer balance  ${formatSol(preflight.balance)} (${config.WALLETS.feePayer})`
    );
    console.log(
      `Holder wallet      ${preflight.holderExists ? "exists on Mainnet" : "not funded yet (it can still receive tokens)"}`
    );
  } else {
    console.log("Cost estimate uses standard rent values because the RPC did not answer.");
  }

  const rentTotal = preflight.mintRent + preflight.ataRent;

  console.log("\nTransaction plan (one atomic transaction):");
  console.log("  1. Create the USOL mint account (fee payer pays rent)");
  console.log(`  2. Initialize mint: ${config.TOKEN.decimals} decimals, mint authority ${config.WALLETS.mintAuthority}`);
  console.log(`  3. Set freeze authority ${config.WALLETS.freezeAuthority}`);
  console.log(`  4. Create the associated token account for ${config.WALLETS.initialHolder}`);
  console.log(
    `  5. Mint ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL to that account`
  );

  console.log("\nEstimated cost (paid by the fee payer):");
  console.log(`  Mint account rent      ${formatSol(preflight.mintRent)}`);
  console.log(`  Token account rent     ${formatSol(preflight.ataRent)}`);
  console.log(`  Transaction fee        ${formatSol(EXPECTED_FEE_LAMPORTS)}`);
  console.log(`  Total                  ${formatSol(rentTotal + EXPECTED_FEE_LAMPORTS)}`);

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

async function loadOrCreateMintKeypair(connection) {
  if (fs.existsSync(config.KEYPAIRS.mint)) {
    const existing = readKeypair(config.KEYPAIRS.mint, "mint");

    if (await connection.getAccountInfo(existing.publicKey, "confirmed")) {
      throw new Error(
        `Mint account ${existing.publicKey.toBase58()} already exists on Mainnet. Record it instead of reusing its keypair.`
      );
    }

    console.log(
      `\nReusing the mint keypair from a previous attempt: ${existing.publicKey.toBase58()} (no account exists yet).`
    );
    return existing;
  }

  const mintKeypair = Keypair.generate();
  writeKeypair(config.KEYPAIRS.mint, mintKeypair);
  console.log(
    `\nNew mint keypair written to ${config.KEYPAIRS.mint} (mode 600, outside the repository).`
  );
  console.log(`Mint address: ${mintKeypair.publicKey.toBase58()}`);

  return mintKeypair;
}

async function verifyMint(connection, mint, rawAmount) {
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

  if (mintInfo.supply !== rawAmount) {
    throw new Error(
      `Supply is ${mintInfo.supply}, expected ${rawAmount} raw units.`
    );
  }

  return mintInfo;
}

async function executeLaunch({ connection, keypairs, mintKeypair }) {
  const rawAmount =
    config.TOKEN.initialSupply * 10n ** BigInt(config.TOKEN.decimals);

  const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const { transaction, mint, associatedTokenAccount } = buildLaunchTransaction({
    mintKeypair,
    feePayer: keypairs.feePayer.publicKey,
    authority: keypairs.authority.publicKey,
    holder: new PublicKey(config.WALLETS.initialHolder),
    decimals: config.TOKEN.decimals,
    rawAmount,
    mintRentLamports: mintRent
  });

  console.log(`\nSimulating against Mainnet (no state change)…`);
  transaction.feePayer = keypairs.feePayer.publicKey;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

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

  return { mint, associatedTokenAccount, signature, rawAmount };
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
    console.log(
      `\nA Mainnet mint is already recorded: ${state.mintAddress}\nRefusing to create a second mint.`
    );
    process.exitCode = 1;
    return;
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

  const estimatedCost =
    preflight.mintRent + preflight.ataRent + EXPECTED_FEE_LAMPORTS;

  if (preflight.balance < estimatedCost) {
    throw new Error(
      `Fee payer holds ${formatSol(preflight.balance)} but the launch needs about ${formatSol(estimatedCost)}. Nothing was submitted.`
    );
  }

  const mintKeypair = await loadOrCreateMintKeypair(connection);
  const { mint, associatedTokenAccount, signature, rawAmount } =
    await executeLaunch({ connection, keypairs, mintKeypair });

  // Record the mint immediately: the address now exists on Mainnet whether or
  // not the verification below passes.
  state.status = "mint-created";
  state.mintAddress = mint.toBase58();
  state.associatedTokenAccount = associatedTokenAccount.toBase58();
  state.transactions.mintCreation = signature;
  saveState(state);

  try {
    await verifyMint(connection, mint, rawAmount);

    const tokenAccount = await getAccount(
      connection,
      associatedTokenAccount,
      "confirmed",
      TOKEN_PROGRAM_ID
    );

    if (tokenAccount.amount !== rawAmount) {
      throw new Error(
        `Token account holds ${tokenAccount.amount} raw units, expected ${rawAmount}.`
      );
    }

    console.log("\nVerified on Mainnet:");
    console.log(`  Decimals           ${config.TOKEN.decimals}`);
    console.log(`  Supply             ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL`);
    console.log(`  Mint authority     ${config.WALLETS.mintAuthority} (active)`);
    console.log(`  Freeze authority   ${config.WALLETS.freezeAuthority} (active)`);
    console.log(`  Holder balance     ${config.TOKEN.initialSupply.toLocaleString("en-US")} USOL`);
    console.log(`\nMint address       ${state.mintAddress}`);
    console.log(`Token account      ${state.associatedTokenAccount}`);
    console.log(config.explorerAddressUrl(state.mintAddress));
    console.log(
      "\nNext: register the Metaplex metadata (node register-metadata-mainnet.js)."
    );
  } catch (error) {
    state.status = "mint-created-needs-review";
    saveState(state);
    throw new Error(
      `The mint transaction succeeded but verification failed: ${error.message}\nMint: ${state.mintAddress}\nSignature: ${signature}`
    );
  }
}

// ---------------------------------------------------------------------------
// Offline self-test: proves the configuration and the launch transaction are
// built correctly without contacting any network or spending anything.
// ---------------------------------------------------------------------------

function selfTest() {
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

  check("configuration matches the confirmed token details and wallets", () => {
    validateConfiguration();
  });

  const mintKeypair = Keypair.generate();
  const feePayer = Keypair.generate();
  const authority = Keypair.generate();
  const holder = new PublicKey(config.WALLETS.initialHolder);
  const decimals = config.TOKEN.decimals;
  const rawAmount = config.TOKEN.initialSupply * 10n ** BigInt(decimals);
  const mintRentLamports = DEFAULT_MINT_RENT;

  const { transaction, associatedTokenAccount } = buildLaunchTransaction({
    mintKeypair,
    feePayer: feePayer.publicKey,
    authority: authority.publicKey,
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

  check("mint is initialized with 9 decimals and the confirmed authorities", () => {
    assert.ok(initMintIx.programId.equals(TOKEN_PROGRAM_ID));
    assert.strictEqual(initialize[0], 20, "expected InitializeMint2");
    assert.strictEqual(initialize[1], 9);
    assert.strictEqual(
      new PublicKey(initialize.subarray(2, 34)).toBase58(),
      authority.publicKey.toBase58()
    );
    assert.strictEqual(initialize[34], 1, "freeze authority must be present");
    assert.strictEqual(
      new PublicKey(initialize.subarray(35, 67)).toBase58(),
      authority.publicKey.toBase58()
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

  check("mint instruction prints exactly 1,000,000,000 USOL", () => {
    assert.ok(mintToIx.programId.equals(TOKEN_PROGRAM_ID));
    assert.strictEqual(mintToIx.data[0], 7, "expected MintTo");
    assert.strictEqual(mintToIx.data.readBigUInt64LE(1), 1_000_000_000n * 10n ** 9n);
    assert.strictEqual(
      mintToIx.keys[2].pubkey.toBase58(),
      authority.publicKey.toBase58()
    );
    assert.ok(mintToIx.keys[2].isSigner, "mint authority must sign");
  });

  check("all three required signers sign the transaction", () => {
    // A throwaway blockhash is enough to assemble and verify signatures offline.
    transaction.feePayer = feePayer.publicKey;
    transaction.recentBlockhash = "11111111111111111111111111111111";
    transaction.sign(feePayer, mintKeypair, authority);

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

  check("the deployment record stores a Mainnet mint address field", () => {
    const state = loadState();
    assert.ok(Object.prototype.hasOwnProperty.call(state, "mintAddress"));
    assert.strictEqual(state.network, "mainnet-beta");
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
