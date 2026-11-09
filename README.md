# UnitedSOLANA (USOL)

This repository is a **verification-only** project for the existing UnitedSOLANA (USOL) Classic SPL Token on Solana Mainnet. It does not create tokens, mint, change authorities, upload/register metadata, or submit transactions.

## Canonical deployment record

- Network: Solana Mainnet (`mainnet-beta`)
- Mint: `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`
- Name / symbol: `UnitedSOLANA` / `USOL`
- Decimals / total supply: 9 / 1,000,000,000 USOL
- Metadata account: `4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`
- Metadata URI: `https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY`
- Logo URI: `https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo`
- Mint authority: revoked (`null`)
- Freeze authority: revoked (`null`)

`config/mainnet.js` contains pinned expected values. `deployments/mainnet.json` preserves the recorded deployment, allocation plan, and transaction signatures. These files are local records, not independent proof of current chain state. Verification reads the live chain; it never repairs or writes the record.

## Read-only Mainnet verification

Install dependencies, then run:

```sh
npm install
npm run verify:mainnet
```

This command uses only the official Mainnet RPC and checks the genesis hash, SPL mint ownership, mint address, decimals, exact raw supply, revoked authorities, holder token account, Metaplex metadata account and fields, and the pinned off-chain metadata JSON including its logo URI. RPC or metadata-gateway outages are reported as availability failures; a returned value that conflicts with the pinned deployment is reported as a verification mismatch. It performs no signing or state-changing calls. Do not treat local fixtures or configuration as live-chain verification.

## Offline tests

```sh
npm run test:offline
```

Offline tests use fixtures and mocks only. They do not contact Mainnet or the metadata gateway and do not prove current on-chain state. Live verification is a separate, optional read-only operation via `npm run verify:mainnet`.

## Retired utilities

`revoke-mint-authority.js`, `revoke-freeze-authority.js`, `upload-metadata-mainnet.js`, and `register-metadata-mainnet.js` are permanently disabled historical notices. They exit immediately and do not load keys, make network calls, construct/sign transactions, upload, register, or modify files. They are deliberately absent from package scripts.

No metadata correction or transaction workflow is supported here. Do not restore transaction capabilities. If an on-chain discrepancy is found, stop and investigate independently; this repository must not attempt to modify the token.

## Website scope

`web/` is a dependency-free static website. The public homepage (`/`) presents the approved Phase One project information and the Phase Two token information section (canonical mint address with a copy control, initial supply, revoked authorities, and links to the specific Solscan token and metadata records). The Phantom connect page remains at `/wallet`, unlinked and `noindex`; Phase Three improves it as a **Phantom-only, connection-only** experience with a validated public address, connect/disconnect feedback, and missing-provider, embedded-frame, and error guidance. Solflare, Backpack, and other wallets are deferred. The page does not display balances, sign messages or transactions, transfer, trade, or swap tokens. This repository does not implement a trading website or wallet transaction functionality.

Website and wallet tests: `node --test web/tests/server.test.js web/tests/wallet.test.js`. Current phase status, verification results, and the next authorized task are recorded in [`agent/HANDOVER.md`](agent/HANDOVER.md).

## Security

Never store or request private keys, seed phrases, or credentials in this repository. Do not introduce key loading or transaction-signing code. The only supported operational command is read-only verification; no transaction is authorized or required.
