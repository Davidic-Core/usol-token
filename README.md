# UnitedSolana (USOL)

UnitedSolana (USOL) is an SPL token project built on the Solana
blockchain.

## Project Status

**Current environment: Solana Devnet**

The existing USOL token is a development token for testing. It is not
the Mainnet token and has no guaranteed monetary value.

## Devnet Token Details

  Property         Value
  ---------------- ------------------------------------------------
  Name             UnitedSolana
  Symbol           USOL
  Network          Solana Devnet
  Token Standard   SPL Token
  Decimals         9
  Initial Supply   1,000,000,000 USOL
  Mint Address     `98Y5HKzViGUhZqtqyqjcZZsAPpLf6k8Tx4SM8JxiMHvi`

## On-chain Metadata

  -----------------------------------------------------------------------------------------------------------
  Property                            Value
  ----------------------------------- -----------------------------------------------------------------------
  Metadata Account                    `jmHyPCfoM45t4Qp47Zm16jMVDrufzb1hBDYYYqwHN6c`

  Metadata JSON                       https://gateway.irys.xyz/FgJdN28oHt7eirrPiCycFBdy9kF9EeSmxuPQrBk98FEj

  Token Logo                          https://gateway.irys.xyz/EJ7Z5xNQeGWgv6iHs9m5yrSLhvbjsjBebhTodBihPZyy
  -----------------------------------------------------------------------------------------------------------

## Development Stack

-   Node.js
-   JavaScript
-   Solana Web3.js
-   Solana SPL Token
-   Metaplex Token Metadata
-   Irys storage

## Project Scripts

  -----------------------------------------------------------------------
  File                                Purpose
  ----------------------------------- -----------------------------------
  `deploy.js`                         Creates a Devnet mint and initial
                                      supply

  `upload-metadata.js`                Uploads the token logo and metadata

  `register-metadata.js`              Registers Metaplex metadata on the
                                      Devnet mint

  `transfer-usol.js`                  Transfers USOL between Devnet
                                      wallets
  -----------------------------------------------------------------------

## Wallet Interface (Phase 1)

A minimal page for connecting a Phantom wallet. It detects whether Phantom is
installed, connects through Phantom's browser provider, shows the connected
public address, and disconnects again. It never asks for a seed phrase or
private key, and it does not sign transactions or move tokens.

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

Wallet connection is independent of the network configuration: `web/app.js`
contains no RPC endpoint, cluster or Devnet/Mainnet setting, so connecting works
regardless of which network the Devnet scripts are pointed at.

`web/server.js` needs no environment variables. The optional `PORT` and `HOST`
overrides are documented in `.env.example`; no file is required.

## Setup

Clone the repository:

``` bash
git clone https://github.com/Snr-Dave/usol-token.git
cd usol-token
npm install
```

## Development Wallet

The Devnet deployment script uses a local keypair stored outside this
repository:

``` text
~/.config/unitedsolana/devnet-keypair.json
```

Never commit wallet secret keys, private keys, seed phrases, or
credentials.

## Devnet Operations

Run the Devnet deployment script:

``` bash
npm run deploy
```

Upload metadata:

``` bash
node upload-metadata.js
```

Register token metadata:

``` bash
node register-metadata.js
```

Transfer test USOL:

``` bash
node transfer-usol.js
```

These scripts are intended for Devnet. Do not use them for Mainnet
deployment without a separate review.

## Development Roadmap

-   [x] Create Devnet SPL token mint
-   [x] Mint initial supply of 1 billion USOL
-   [x] Upload token logo and metadata
-   [x] Register Metaplex metadata
-   [x] Test USOL transfers
-   [x] Verify USOL in Phantom Testnet Mode
-   [ ] Prepare a separate Mainnet deployment
-   [ ] Deploy the Mainnet USOL mint
-   [ ] Test token discovery in compatible wallets
-   [ ] Prepare liquidity and distribution
-   [ ] Build the optional USOL website
-   [ ] Implement wallet connection and balance display

## Mainnet Notice

The Mainnet USOL token will require a separate mint address and
deployment. The Devnet mint cannot be converted into a Mainnet mint.

Mainnet deployment will take place only after configuration, wallet
security, supply, metadata, and deployment costs have been reviewed.

## Repository

https://github.com/Snr-Dave/usol-token
