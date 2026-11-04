# UnitedSOLANA (USOL)

UnitedSOLANA (USOL) is a Classic SPL Token project built on the Solana
blockchain.

## Project Status

**Network: Solana Mainnet — configuration and deployment scripts prepared.**

The USOL Mainnet mint has **not** been created. There is no Mainnet mint
address or transaction signature yet: `deployments/mainnet.json` keeps
`mintAddress` as `null` until a successful creation records the real value.

Test-network configuration and scripts have been removed. Solana Mainnet is the
only network the active project supports.

## Token Details

  Property         Value
  ---------------- -----------------------------------------------
  Name             UnitedSOLANA
  Symbol           USOL
  Network          Solana Mainnet
  Token Standard   Classic SPL Token
  Decimals         9
  Initial Supply   1,000,000,000 USOL
  Mint Address     Not created yet

Description:

> UnitedSOLANA (USOL) is a high-speed community and utility token built on the
> Solana blockchain. Designed to facilitate seamless decentralized trading,
> liquidity pairing, and ecosystem transaction fees across Solana dApps

## Confirmed Wallet Assignments

  Role               Address
  ------------------ ----------------------------------------------
  Fee payer          `FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU`
  Initial holder     `HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT`
  Mint authority     `HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT`
  Freeze authority   `HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT`

The fee payer and the token holder are separate wallets and are handled
separately: FRPP pays transaction fees, account rent and upload costs, while
HxDW receives the initial supply and keeps the mint and freeze authorities. Both
authorities stay active — nothing is revoked.

## Mainnet Configuration

All values live in one place, `config/mainnet.js`:

-   RPC endpoint: `https://api.mainnet-beta.solana.com`
-   Token name, symbol, decimals and initial supply.
-   The four confirmed wallet assignments above.
-   The confirmation phrase required before any transaction is sent.

`USOL_RPC_URL` may only point at the official Mainnet endpoint or a local
validator; any other network is rejected at startup.

## Project Scripts

  -----------------------------------------------------------------------------
  File                            Purpose
  ------------------------------- ---------------------------------------------
  `deploy-mainnet.js`             Creates the mint, the initial holder's token
                                  account and the 1B USOL supply in one atomic
                                  transaction

  `upload-metadata-mainnet.js`    Uploads the existing logo and the USOL
                                  metadata to Irys on Mainnet

  `register-metadata-mainnet.js`  Registers the Metaplex metadata for the
                                  recorded Mainnet mint

  `config/mainnet.js`             Network, token, wallet and keypair settings

  `lib/`                          Shared helpers: state record, keypair
                                  loading, transaction builder, approval prompt

  `deployments/mainnet.json`      Record of the actual mint address, token
                                  account, metadata account and signatures
  -----------------------------------------------------------------------------

Every script is a **dry run by default**. It validates the configuration, reads
what it can without changing anything and prints the plan and cost. Adding
`--execute` — and typing the exact confirmation phrase — is required before
anything is signed or submitted. `--self-test` runs offline checks that make no
network request and spend nothing.

## Deployment Order

Run from the repository root after `npm install`:

``` bash
# 0. Offline checks (no network, no SOL)
npm run test:mainnet

# 1. Validate configuration and estimate the cost (no transaction)
node deploy-mainnet.js

# 2. Fund FRPP with enough Mainnet SOL, then create the mint
node deploy-mainnet.js --execute

# 3. Upload the logo and metadata to Irys
node upload-metadata-mainnet.js --execute

# 4. Register the Metaplex metadata
node register-metadata-mainnet.js --execute
```

Each `--execute` run asks for the confirmation phrase
(`LAUNCH USOL ON MAINNET`) and refuses to continue without it. After step 2 the
real mint address is written to `deployments/mainnet.json`; steps 3 and 4 read
it from there and refuse to run while it is `null`, so no placeholder or
invented mint address can be used.

There is deliberately no transfer script: USOL transfers are not part of the
launch and will be added only when distribution is approved.

## Keypairs

The scripts never generate, print or store a secret for the confirmed wallets.
They read exported keypair files from outside the repository:

``` text
~/.config/unitedsolana/mainnet/fee-payer.json    FRPP keypair, mode 600
~/.config/unitedsolana/mainnet/authority.json    HxDW keypair, mode 600
```

Override the locations without committing anything:

``` bash
export USOL_FEE_PAYER_KEYPAIR=/secure/path/fee-payer.json
export USOL_AUTHORITY_KEYPAIR=/secure/path/authority.json
```

Each script verifies that the loaded keypair resolves to the confirmed address
and refuses to continue otherwise.

The new mint account needs its own keypair to sign account creation. The launch
script generates it at execution time and writes it to
`~/.config/unitedsolana/mainnet/mint-keypair.json` (mode 600) before sending the
transaction, so a failed attempt can be retried instead of losing the address.
That file never enters the repository.

Never commit wallet secret keys, private keys, seed phrases or credentials.
`.gitignore` already excludes `*keypair*.json`, `*.key`, `*.pem` and `.env`
files. The website never asks for a seed phrase or private key.

## Deployment Record

`deployments/mainnet.json` is the single place the real Mainnet values are
recorded after each step:

-   `mintAddress` — the actual mint, filled in only after creation is confirmed.
-   `associatedTokenAccount` — the holder's token account.
-   `imageUri`, `metadataUri` — uploaded logo and metadata.
-   `metadataAccount`, `transactions.mintCreation`, `transactions.metadataRegistration` — Metaplex account and signatures.

## Wallet Interface (Phase 1)

A minimal page for connecting a Phantom wallet. It detects whether Phantom is
installed, connects through Phantom's browser provider, shows the connected
public address, and disconnects again. It never asks for a seed phrase or
private key, and it does not sign transactions or move tokens. This functionality
is unchanged by the Mainnet conversion.

Start the page (plain Node.js, no extra dependencies):

``` bash
npm start
```

Then open http://localhost:3000. The interface is in `web/` and the little
static server is `web/server.js`.

On mobile, open the page in Phantom's built-in browser. If Phantom already has
an active session the page reuses it; otherwise a connection request that gets
no answer times out after 20 seconds instead of leaving the button stuck, and
the diagnostics line under the buttons shows which provider was detected.

### How the wallet connection works

Phantom injects a provider object into the page (`window.phantom.solana`, also
exposed as `window.solana` for legacy integrations). The page calls that
provider's `connect()` method and reads the account's **public address** from
the result. That address is the only wallet data the page ever receives.

- `connect()` runs only after the visitor presses **Connect**.
- On page load the page calls `connect({ onlyIfTrusted: true })`, Phantom's
  documented eager connect: it restores an existing session silently and never
  shows a prompt for a site that has not been trusted yet.
- `connect`, `disconnect` and `accountChanged` events keep the display in sync,
  and only one connection request is ever pending at a time.
- `connect()` / `disconnect()` are bounded by a 20s / 10s timeout with an
  explicit error instead of a button that stays on "Connecting…".
- Phantom never injects its provider into iframes or `http://` pages. When the
  page is embedded in a frame it says so and offers to open itself in a new tab;
  on a mobile browser without Phantom it offers Phantom's `browse` deep link.

The page never asks for a seed phrase or private key, never imports or exports a
keypair, sends nothing to any server, and stores nothing in localStorage,
sessionStorage or cookies. Future transaction approvals belong to Phantom's own
signing provider, which would receive the transaction and return a signature.

`web/server.js` needs no environment variables. The optional `PORT` and `HOST`
overrides are documented in `.env.example`; no file is required.

## Setup

``` bash
git clone https://github.com/Snr-Dave/usol-token.git
cd usol-token
npm install
```

## Security Rules

-   Never request seed phrases or private keys through the website.
-   Never commit keypair files or secrets; never hardcode a private key.
-   Never revoke the mint or freeze authority.
-   Never change the confirmed wallet assignments.
-   Never submit a transaction without the owner's explicit approval.
-   No test-network endpoint, mint address or metadata record is used by the
    active code.

## Remaining Steps

-   [x] Prepare the Mainnet token configuration
-   [x] Remove test-network configuration and scripts
-   [x] Prepare Mainnet launch, upload and metadata scripts
-   [x] Offline self-tests for configuration and transaction building
-   [ ] Owner approval to execute the launch
-   [ ] Fund FRPP with Mainnet SOL
-   [ ] Create the USOL Mainnet mint and initial supply
-   [ ] Upload logo/metadata and register Metaplex metadata
-   [ ] Record the mint address and signatures
-   [ ] Verify token discovery in compatible wallets
-   [ ] Prepare liquidity and distribution

## Repository

https://github.com/Snr-Dave/usol-token
