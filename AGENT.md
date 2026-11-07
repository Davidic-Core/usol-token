# UnitedSOLANA (USOL) — AGENT.md

Project state and operating rules for agents working in this repository.

## What exists on Solana Mainnet

UnitedSOLANA (USOL) is **already deployed** on Solana Mainnet as a Classic SPL
Token. The mint, the initial supply and the Metaplex metadata were created once,
and both the mint and freeze authorities were permanently revoked afterwards.
Nothing in this repository may create another USOL mint or restore an authority.

Use these exact details:

- Token name: `UnitedSOLANA`
- Symbol: `USOL`
- Network: `mainnet-beta` (Solana Mainnet)
- Token standard: Classic SPL Token
- Decimals: `9`
- Total supply: `1,000,000,000` USOL (`1000000000000000000` raw units)
- Mint address: `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`
- Metadata account: `4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`
- Logo URI: `https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo`
- Metadata URI: `https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY`

Deployment transactions:

- Mint creation: `3N1UJdVAC8AGiCe9mJetrZHzBNW3aZTnAgfqtjoDMQey91jphBri5SGXsFBzt1cdnQAUtaA54Sv9k211EiJoHdUY`
- Metadata registration: `2LKc5pLimSyiAQhCsUYpYNvjySjJZ8asmHo8qtopf3J6wvgqF2Abx1oYVBLK2gUT3niS4CKyvDoXJShuoJuEuD8C`
- Mint authority revocation: `3N5WpNkkJQ3uSEtGBBxU7z5mkcesJnZaVyShb1mMhRPYWsVNXdYYYE8YbZieSZkreMfkReFuRY4aQqMvYz26dCAe`
- Freeze authority revocation: `3ZjBcDEMmoYBSwD8y2GyJVkgxkGyWJQpc4aEowXmrn7bQ3upzeHyxpB2hQhNEADBiDotCmngFDMqUxkXp8kR2JJ8`

Description:

> UnitedSOLANA (USOL) is a high-speed community and utility token built on the
> Solana blockchain. Designed to facilitate seamless decentralized trading,
> liquidity pairing, and ecosystem transaction fees across Solana dApps

## Authorities — permanently revoked

- **Mint authority: revoked (on-chain value `null`).** No wallet can mint more
  USOL. The 1,000,000,000 supply is final.
- **Freeze authority: revoked (on-chain value `null`).** No wallet can freeze or
  unfreeze a USOL token account.

Do not attempt to restore either authority. That is impossible on-chain and any
code that suggests it is wrong. Do not add a mint or freeze authority to
`config/mainnet.js`, and do not treat a `null` authority as a missing value to
be filled in.

## Confirmed wallets

Fee payer — `FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU`

Original holder — `HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT`

Do not change these assignments. They are pinned literally in
`config/mainnet.js` and compared exactly, before any network step.

- FRPP paid transaction fees, account rent and upload costs.
- HxDW received the initial supply and is recorded as the original holder.
- The Metaplex metadata has its own update authority, separate from the token
  authorities. It can change metadata only — it is **not** a mint or freeze
  authority and cannot create or freeze USOL. HxDW signed the registration, so
  it is the authority the historical registration script uses.
- HxDW is **not** an active mint or freeze authority.

## Allocation is a plan, not a transfer

The 300M / 250M / 200M / 150M / 100M split in `config/mainnet.js` and
`deployments/mainnet.json` is a **planned allocation**. It is a record of intent,
not proof that transfers, pools or distributions happened. Token creation,
metadata registration, liquidity and distribution are separate activities;
liquidity and distribution have not been performed by this repository.

## What the code does now

- `deploy-mainnet.js` — **verification only**. It reads
  `deployments/mainnet.json` and verifies the existing deployment on Mainnet
  (mint, 9 decimals, full supply, `null` authorities, metadata account and URI,
  holder token account). It has no `--execute` path and cannot create a mint,
  sign a transaction or revoke an authority.
- `upload-metadata-mainnet.js` — refuses because a metadata URI is already
  recorded. Kept for the deployment history.
- `register-metadata-mainnet.js` — refuses because the metadata account is
  already recorded. Kept for the deployment history.
- `revoke-mint-authority.js`, `revoke-freeze-authority.js` — historical. Each
  stops as soon as it sees the on-chain authority is already `null`, before
  loading a keypair or building a transaction.
- `web/` — the vanilla HTML/CSS/JS Phantom **wallet-connect page** only. It shows
  a connected public address. It is not a trading application: it does not sign
  transactions, hold balances, swap or transfer tokens.

## Security rules — do not weaken

- Never create another USOL mint, deploy a second token or re-initialise the
  deployment record as if USOL did not exist.
- Never revoke an authority again or attempt to restore one.
- Never submit a Solana transaction, transfer tokens, or add/withdraw liquidity
  without explicit approval from the project owner.
- Never request seed phrases or private keys — not through the website, not in
  issues, not in chat. Never expose private key contents.
- Never commit keypair files, secrets or `.env` files. `.gitignore` covers
  `*keypair*.json`, `fee-payer.json`, `authority.json`, `*.key`, `*.pem` and
  `.env*` (except `.env.example`).
- Preserve the Mainnet genesis check, wallet pinning and strict wallet
  validation, message-based fee calculation, dry-run defaults, confirmation
  phrases, the deployment lock and the secret-file exclusions.
- Keep the official RPC rule: `https://api.mainnet-beta.solana.com` only, HTTPS,
  exact origin; a local validator is allowed for non-submitting dry runs only.

## Tests

```bash
npm run test:mainnet      # all offline self-tests + the deployment check
npm run test:deployment   # deployed-state checks only
```

Tests are offline: no network request and no transaction. They read isolated
fixtures in `test/fixtures/`, never the live `deployments/mainnet.json`, so
running them cannot change what the scripts read.

## Scope

Do not rewrite the vanilla HTML/CSS/JavaScript wallet page. Do not introduce
React, Express or PostgreSQL. Do not modify `main` or the historical `mainnet`
branch from a feature branch.

## Completion report

When changing this repository, report: the active branch, files changed, what
was corrected, offline test results, remaining issues, the commit hash if
committed, and confirm that no blockchain transaction was submitted.
