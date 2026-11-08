# UnitedSOLANA (USOL) — agent operating rules

## Project mode and existing token protection

UnitedSOLANA (USOL) is already deployed on Solana Mainnet. Preserve the existing token and its history. Never create another USOL mint, mint additional tokens, change mint or freeze authorities, upload or register replacement token metadata, modify historical deployment records or transaction signatures, or execute token deployment or authority-management transactions.

The repository's deployment and verification tooling must remain read-only and safe. Website features do not change these restrictions or authorize changes to token configuration, deployment records, or deployment tooling.

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
- Keep website functionality and source separate from deployment and verification tooling. Website transaction features must not change the read-only and safe behavior of those tools.

## Website isolation and permitted features

- All website source code and assets must remain inside `web/`.
- Do not weaken repository security rules or modify protected token configuration, historical records, or deployment and verification tooling to accommodate website features.
- The website may provide official USOL project information, verified token details, wallet connection and disconnection, USOL and SOL balance display, buying and selling USOL through supported swap integrations, project documentation, transparency information, and risk disclosures.
- Support Phantom, Solflare, and Backpack where technically appropriate, using established Solana wallet standards.
- Use reputable integrations such as Jupiter where technically supported. Never claim that a trading pair, liquidity pool, or swap route exists without verifying it.
- Avoid unnecessary changes to existing dependencies and project configuration.

## Non-custodial wallet security

- The website must be non-custodial; users must retain control of their wallets.
- Never request, collect, store, or transmit seed phrases or private keys. Never sign transactions using project-owned private keys. Do not add wallet key files, keypair loading, or server-side signing.
- Clearly present transaction details before approval. Transactions must require explicit user action and approval inside the user's connected wallet. Never initiate or submit a transaction without that interaction and approval.
- Connecting a wallet does not authorize a transaction. Never bypass the connected wallet's review and approval flow.

## Accuracy and transparency

- Never invent token prices, market capitalization, trading volume, liquidity, exchange listings, partnerships, audits, or project utilities.
- Clearly distinguish verified on-chain information from third-party market information and estimates. Identify external sources and when information was checked where appropriate.
- Include appropriate cryptocurrency risk disclosures. Do not promise returns or present estimates as guaranteed outcomes.

## Development and testing

- Preserve existing repository tests and project configuration. Do not break existing offline tests.
- Keep offline tests independent of live blockchain services. Add website-specific tests where appropriate.
- Never perform real transactions as part of automated tests.
- Avoid unnecessary dependencies and deprecated syntax. Review security implications before adding wallet or transaction functionality.
- Do not modify protected token files, pinned configuration, or historical deployment records unless explicitly required and approved. Any approved change must not violate the protections in this document.
- Never request or expose secrets. Do not add `.env` secrets or commit credentials.
- Do not claim tests passed unless actually executed. Do not claim live Mainnet verification based only on fixtures.

## Approval, completion reports, and publishing

Do not commit, push, merge, publish, or deploy without explicit user approval.

After development tasks, report:

- Files created or modified.
- Functionality implemented.
- Actual test commands and results.
- Remaining issues and security considerations.
- Whether live verification was performed and whether any blockchain transaction occurred.

