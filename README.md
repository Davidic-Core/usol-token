UnitedSOLANA (USOL)

UnitedSOLANA is an existing Classic SPL Token on Solana Mainnet. This repository contains its read-only verification tooling and website project.

The repository does not create tokens, mint tokens, change authorities, register replacement metadata or submit token transactions.

Canonical deployment record

- Network: Solana Mainnet ("mainnet-beta")
- Mint: "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG"
- Name / symbol: "UnitedSOLANA" / "USOL"
- Decimals / initial supply: 9 / 1,000,000,000 USOL
- Metadata account: "4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc"
- Metadata URI: "https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY"
- Logo URI: "https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo"
- Mint authority: revoked ("null")
- Freeze authority: revoked ("null")

"config/mainnet.js" contains pinned expected values. "deployments/mainnet.json" preserves the recorded deployment and transaction information. These local records are not independent proof of current chain state.

Read-only Mainnet verification

Install dependencies:

npm install

Run:

npm run verify:mainnet

This command performs read-only Mainnet and metadata verification. It does not sign transactions or modify blockchain state.

RPC and metadata gateway outages are reported as availability failures. Differences from pinned deployment values are reported as verification mismatches.

Offline tests

npm run test:offline

Offline tests use fixtures and mocks. They do not contact Mainnet or prove current on-chain state.

Website tests:

node --test web/tests/server.test.js web/tests/wallet.test.js

Retired utilities

The following scripts are permanently disabled historical notices:

- "revoke-mint-authority.js"
- "revoke-freeze-authority.js"
- "upload-metadata-mainnet.js"
- "register-metadata-mainnet.js"

They do not load keys, submit transactions or modify token information. Do not restore transaction capabilities.

Website

The "web/" directory contains the UnitedSOLANA public website.

Current website functionality includes:

- Project and token information.
- Canonical USOL mint address and copy control.
- Solscan token and metadata links.
- Responsive navigation.
- A homepage wallet panel: Solana Wallet Standard discovery, connect and
  disconnect, account switching, and read-only SOL and USOL balances.

Balances are read through the site's own server-side Solana Mainnet RPC proxy
(`POST /api/rpc`), which accepts only `getBalance` and `getTokenAccountsByOwner`.
The upstream endpoint is set with `SOLANA_RPC_URL` (or `HELIUS_API_KEY` for a
Helius Mainnet endpoint); the key stays on the server and is never served to the
browser.

The wallet panel does not sign messages or transactions, transfer tokens, buy or
sell tokens, or execute swaps.

Future functionality, including token swaps, requires separate technical review
and explicit owner approval.

Development documentation

Read these documents before working on the website:

1. ""AGENT.md"" (AGENT.md) — project-wide rules and security requirements.
2. ""agent/SKILL.md"" (agent/SKILL.md) — general development workflow.
3. ""agent/WEBSITE_ARCHITECTURE.md"" (agent/WEBSITE_ARCHITECTURE.md) — website architecture and roadmap.
4. ""agent/HANDOVER.md"" (agent/HANDOVER.md) — current project status and next steps.
5. ""agent/V0_INSTRUCTIONS.md"" (agent/V0_INSTRUCTIONS.md) — dedicated v0 implementation instructions.

Development workflow

- GitHub is the source of truth.
- "Davidic-core/usol-token" is the owner's working fork.
- "Snr-Dave/usol-token" is the canonical upstream repository.
- v0 is the planned website implementation agent.
- Vercel is intended for preview builds and hosting.
- Acode can be used for local development and testing.

Website implementation must use an approved development branch. Do not assume preview hosting or production deployment is configured until verified.

Security and approval

Never store or request private keys, seed phrases or wallet credentials in this repository.

Do not introduce key loading, custodial wallet functionality or transaction-signing code.

Do not change token configuration, authorities, metadata, deployment records or verification tooling.

Do not commit, push, merge, publish or deploy without explicit owner approval.

Keep implementations focused, preserve existing functionality and avoid unnecessary dependencies or changes.
