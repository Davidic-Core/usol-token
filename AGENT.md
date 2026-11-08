# UnitedSOLANA (USOL) — agent operating rules

## Project mode: verification only

USOL already exists on Solana Mainnet. The repository must remain a read-only verifier and historical record. Never create a mint, mint tokens, change mint/freeze authorities, upload or register metadata, sign or submit a transaction, or add website trading/wallet-transaction features.

Pinned deployment:

- Name/symbol: `UnitedSOLANA` / `USOL`
- Network: `mainnet-beta`
- Mint: `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`
- Decimals/supply: 9 / 1,000,000,000 USOL
- Metadata account: `4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`
- Metadata URI: `https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY`
- Logo URI: `https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo`
- Mint and freeze authorities: revoked (`null`)

Treat `config/mainnet.js` as pinned expected values and `deployments/mainnet.json` as a historical deployment record. Validate canonical fields explicitly; allow unrelated additional record fields. Missing or inconsistent state is an error, never a reason to deploy, upload, or register. Preserve recorded deployment transaction signatures and useful history.

## Executable tooling

- `deploy-mainnet.js` may make read-only RPC and metadata HTTP reads only. It must not sign, submit, or automatically modify deployment files.
- `revoke-mint-authority.js`, `revoke-freeze-authority.js`, `upload-metadata-mainnet.js`, and `register-metadata-mainnet.js` are inert notices. Do not add imports, key loaders, networking, uploaders, transaction builders, signers, or submit calls.
- Normal tests are offline, fixture-based, and mock external reads. Optional live verification is a separate read-only command.
- Keep `web/` static and connection-only; do not add wallet signing, transfers, balances, swaps, or trading functionality.

Never request or expose secrets. Do not add `.env` secrets, wallet files, keypair loading, or signing capabilities. Do not claim tests passed unless actually executed. Do not claim live Mainnet verification based only on fixtures.

## Completion reports

Report files changed, actual test commands and results, remaining risks, whether live verification was performed, and confirm that no blockchain transaction was submitted.
