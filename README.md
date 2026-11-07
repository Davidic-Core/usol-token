# UnitedSOLANA (USOL)

UnitedSOLANA (USOL) is a Classic SPL Token on the Solana blockchain.

## Project Status

**USOL is already deployed on Solana Mainnet.** It is not an undeployed or
“awaiting launch” token, and there is no second mint to create.

-   The Mainnet mint exists at
    `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`.
-   Its total supply of **1,000,000,000 USOL** was created with the mint and is
    established on-chain.
-   The Metaplex metadata is registered at
    `4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`.
-   The **mint authority is permanently revoked** (on-chain value `null`). No
    wallet can mint additional USOL.
-   The **freeze authority is permanently revoked** (on-chain value `null`). No
    wallet can freeze or unfreeze a USOL token account.

The revocations are permanent and irreversible. Nothing in this repository can
restore either authority, and no script here creates, deploys or revokes
anything.

Two activities are deliberately separate from token creation:

-   **Liquidity** — no USOL pool exists or is created by this repository.
-   **Distribution** — no allocation has been transferred. The split described
    below is a **planned allocation**, not proof of completed transfers.

The application in `web/` is a **wallet-connect page only**. It shows the public
address of a connected Phantom wallet. It is not a trading application, does not
hold or display balances, and does not sign, swap or transfer anything.

## Token Details

  Property           Value
  ------------------ ----------------------------------------------------------
  Name               UnitedSOLANA
  Symbol             USOL
  Network            Solana Mainnet (`mainnet-beta`)
  Token standard     Classic SPL Token
  Decimals           9
  Total supply       1,000,000,000 USOL
  Mint address       `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`
  Metadata account   `4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`
  Metadata URI       `https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY`
  Logo URI           `https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo`
  Mint authority     REVOKED (permanent)
  Freeze authority   REVOKED (permanent)

Description:

> UnitedSOLANA (USOL) is a high-speed community and utility token built on the
> Solana blockchain. Designed to facilitate seamless decentralized trading,
> liquidity pairing, and ecosystem transaction fees across Solana dApps

### Deployment transactions

  Step                        Signature
  --------------------------- -------------------------------------------------
  Mint creation               `3N1UJdVAC8AGiCe9mJetrZHzBNW3aZTnAgfqtjoDMQey91jphBri5SGXsFBzt1cdnQAUtaA54Sv9k211EiJoHdUY`
  Metadata registration       `2LKc5pLimSyiAQhCsUYpYNvjySjJZ8asmHo8qtopf3J6wvgqF2Abx1oYVBLK2gUT3niS4CKyvDoXJShuoJuEuD8C`
  Mint authority revocation   `3N5WpNkkJQ3uSEtGBBxU7z5mkcesJnZaVyShb1mMhRPYWsVNXdYYYE8YbZieSZkreMfkReFuRY4aQqMvYz26dCAe`
  Freeze authority revocation `3ZjBcDEMmoYBSwD8y2GyJVkgxkGyWJQpc4aEowXmrn7bQ3upzeHyxpB2hQhNEADBiDotCmngFDMqUxkXp8kR2JJ8`

## Confirmed Wallet Assignments

  Role               Address
  ------------------ ----------------------------------------------------------
  Fee payer          `FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU`
  Original holder    `HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT`

The fee payer and the holder are separate wallets: FRPP paid transaction fees,
account rent and upload costs, while HxDW received the initial supply and is the
original holder.

Neither wallet is an active mint or freeze authority. The Metaplex metadata has
its own update authority, which is separate from the token authorities and can
change metadata only — it cannot mint or freeze USOL. HxDW signed the metadata
registration. Both authority revocations are permanent.

## Planned Allocation

The entire 1,000,000,000 USOL supply was minted into the HxDW token account. The
split below is a plan recorded in `config/mainnet.js` and
`deployments/mainnet.json`; **it is not proof that any transfer, pool or
distribution has happened**. No USOL has been transferred, pooled or distributed
by this repository.

  Amount          Purpose
  --------------- ------------------------------------------------------------
  300,000,000     Initial liquidity reserve (future USOL/SOL and USOL/USDC pools)
  250,000,000     Treasury and reserves
  200,000,000     Ecosystem and community
  150,000,000     Future distribution
  100,000,000     Retained allocation
  --------------- ------------------------------------------------------------
  1,000,000,000   Total, minted to the original holder at creation

Liquidity and distribution are separate activities from token creation and are
not performed by any script here.

## Mainnet Configuration

All values live in one place, `config/mainnet.js`:

-   RPC endpoint: `https://api.mainnet-beta.solana.com`
-   Mainnet genesis hash: `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d`
-   Token name, symbol, standard, decimals and total supply.
-   The deployed mint, metadata account, metadata URI, logo URI and deployment
    transactions (`DEPLOYMENT`).
-   The revoked authorities and their revocation transactions (`AUTHORITIES`),
    both recorded as `null`.
-   The two confirmed wallet assignments and the planned allocation.
-   The confirmation phrase required before any transaction could be sent.

Wallet addresses are validated strictly: base58, exactly 32 bytes, canonical
re-encoding and on the ed25519 curve — and, beyond validity, they are compared
exactly with the confirmed assignments before every run. A malformed or
substituted address stops every script. `USOL_RPC_URL` may only be the official
HTTPS Mainnet origin or a local validator for a non-submitting dry run; a local
endpoint is refused when `--execute` is used, any other network is rejected at
startup, and every network run additionally checks the cluster's genesis hash.

## Project Scripts

  -----------------------------------------------------------------------------
  File                            Purpose
  ------------------------------- ---------------------------------------------
  `deploy-mainnet.js`             Verifies the existing Mainnet deployment:
                                  mint, decimals, supply, revoked authorities,
                                  metadata account and URI, holder token account.
                                  Verification only — there is no path that
                                  creates a mint or signs a transaction.

  `upload-metadata-mainnet.js`    Historical. Refuses because a metadata URI is
                                  already recorded.

  `register-metadata-mainnet.js`  Historical. Refuses because the metadata
                                  account is already recorded.

  `revoke-mint-authority.js`      Historical. Stops as soon as it sees the mint
                                  authority is already `null`.

  `revoke-freeze-authority.js`    Historical. Stops as soon as it sees the freeze
                                  authority is already `null`.

  `config/mainnet.js`             Network, genesis hash, token, deployment,
                                  authorities, wallet and allocation settings

  `lib/rpc.js`                    Mainnet genesis check and message-based fee
                                  calculation

  `lib/preflight.js`              Fail-closed gate: endpoint, wallet pin, supply,
                                  record integrity, transaction and funding

  `lib/verify.js`                 Mint (9 decimals, 1B supply, null authorities),
                                  metadata account/URI and token account checks

  `lib/state.js`                  Deployment record read/write and integrity
                                  checks

  `lib/launch-transaction.js`     Historical launch transaction builder, used
                                  only by the offline audit checks

  `deployments/mainnet.json`      Record of the deployed mint, token account,
                                  metadata account, authorities and signatures
  -----------------------------------------------------------------------------

`deploy-mainnet.js` is a read-only verification run: it makes no signing step
available, so it cannot spend SOL or change the token. The metadata and
revocation scripts keep their historical `--execute` code but refuse before
reaching it because the deployment is complete.

## Verification

``` bash
npm run test:mainnet      # all offline checks, no network and no transaction
npm run test:deployment   # deployed-state checks only
```

`deploy-mainnet.js` can also verify the live deployment against Mainnet when
run without arguments. It reads the chain and reports; it never signs.

## Safety Behaviour

-   **Mainnet only.** The RPC must be exactly
    `https://api.mainnet-beta.solana.com` — HTTPS, the official origin, no
    alternative port, path or look-alike host. A local validator
    (`localhost` / `127.0.0.1`) is accepted for non-submitting dry runs only and
    is refused outright as soon as `--execute` is requested. Every network run
    re-checks the genesis hash first.
-   **Authorities must be revoked.** Verification fails if the mint or freeze
    authority is not `null`. An active authority is never accepted as normal.
-   **Deployment record integrity.** The recorded mint, metadata account and
    metadata URI must match the deployed USOL values. A blank or tampered record
    is refused — it is never treated as a reason to create a new token.
-   **No second mint.** The deployment record already holds the mint, and the
    deployed address is pinned in `config/mainnet.js`. Scripts that would create
    a mint are gone; the historical launch builder is only exercised by offline
    tests.
-   **Fees are calculated, not assumed.** Where a fee is shown, it comes from
    `getFeeForMessage` on the exact transaction message. If the RPC cannot price
    it, the scripts refuse to continue.
-   **Exact wallet pinning.** The confirmed assignments are a frozen literal in
    `config/mainnet.js` and are compared byte for byte with the active
    configuration and with `deployments/mainnet.json` before any network step.
-   **Strict wallet validation.** Every configured wallet must also be a
    canonical, on-curve ed25519 address; the fee payer and holder must differ.
-   **Fail closed.** Metadata registration stops on any mismatch. Only a
    successful read-back of the on-chain metadata marks the deployment ready.
-   **No duplicate uploads or registrations.** A recorded metadata URI or
    metadata account stops the upload/registration scripts instead of
    overwriting it.
-   **Token account verification.** The holder's associated token account is
    checked for the right mint, the right owner (HxDW) and the full
    1,000,000,000 USOL balance.

## Deployment Record

`deployments/mainnet.json` is the single place the real Mainnet values are
recorded:

-   `status` — `mainnet-deployed-and-verified` for the existing deployment.
    Earlier statuses (`mint-created`, `mint-verified`, `metadata-uploaded`,
    `metadata-registration-needs-review`) remain meaningful only as history.
-   `mintAddress` — the deployed USOL mint.
-   `associatedTokenAccount` — the original holder's token account.
-   `metadataAccount`, `metadataUri`, `imageUri` — registered metadata.
-   `authorities.mintAuthority` / `authorities.freezeAuthority` — both `null`,
    with the revocation transactions.
-   `transactions` — mint creation, metadata registration and both authority
    revocations.
-   `plannedAllocation` — the recorded distribution plan, not an executed
    transfer.

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

Each script verifies that a loaded keypair resolves to the confirmed address and
refuses to continue otherwise.

The deployment is complete, so no keypair is needed to verify it. Never commit
wallet secret keys, private keys, seed phrases or credentials. `.gitignore`
already excludes `*keypair*.json`, `fee-payer.json`, `authority.json`, `*.key`,
`*.pem` and `.env` files. The website never asks for a seed phrase or private
key.

## Wallet Interface

A minimal page for connecting a Phantom wallet. It detects whether Phantom is
installed, connects through Phantom's browser provider, shows the connected
public address, and disconnects again. It never asks for a seed phrase or
private key, and it does not sign transactions, show balances, swap or move
tokens. It is a wallet-connect page, not a trading application.

Start the page (plain Node.js, no extra dependencies):

``` bash
npm start
```

Then open http://localhost:3000. The interface is in `web/` and the static server
is `web/server.js`.

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
sessionStorage or cookies. Future transaction approvals would belong to
Phantom's own signing provider, which would receive the transaction and return a
signature.

`web/server.js` needs no environment variables. The optional `PORT` and `HOST`
overrides are documented in `.env.example`; no file is required.

## Setup

``` bash
git clone https://github.com/Snr-Dave/usol-token.git
cd usol-token
npm install
```

## Security Rules

-   Never create another USOL mint or deploy a second token.
-   Never attempt to revoke an authority again or restore a revoked one.
-   Never request seed phrases or private keys through the website.
-   Never commit keypair files or secrets; never hardcode a private key.
-   Never change the confirmed wallet assignments.
-   Never submit a transaction without the owner's explicit approval.
-   No test-network endpoint, mint address or metadata record is used by the
    active code.

## Remaining Work

Token creation is complete. The remaining items are separate activities and are
not part of this repository's scripts:

-   [x] Create the USOL Mainnet mint and initial supply
-   [x] Upload logo/metadata and register Metaplex metadata
-   [x] Record the mint address, metadata account and signatures
-   [x] Permanently revoke the mint and freeze authorities
-   [ ] Verify token discovery in compatible wallets
-   [ ] Plan and fund liquidity (separate activity)
-   [ ] Execute the allocation (separate activity, requires owner approval)

## Repository

https://github.com/Snr-Dave/usol-token
