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
