# Website Handover — read this before starting work

Recorded 2026-11-08. This note is the current status of the UnitedSOLANA website work. It does not override or relax the root [`AGENT.md`](../AGENT.md), [`SKILL.md`](SKILL.md), or [`WEBSITE_ARCHITECTURE.md`](WEBSITE_ARCHITECTURE.md). If this note conflicts with them, those documents win.

## Repository state

- Repository: `Snr-Dave/usol-token`
- Branch: `fix-website`
- Latest verified commit: `39a73330de5051906a9b7a8132d59daab719bb28` — "Correct Phase One review findings"
- Phase One: **completed and verified**
- Phase Two: **not started**
- Nothing beyond Phase One is authorized.

## Verification at that commit

Run from the repository root. The website is a dependency-free static server, so no install is required for the route tests.

```sh
node --test web/tests/server.test.js   # website tests
node test/mainnet-deployed.test.js     # offline token tests (npm run test:offline)
npm run verify:mainnet                 # optional, read-only live check; NOT run as part of this handover
```

| Suite | Command | Result |
| --- | --- | --- |
| Website route tests | `node --test web/tests/server.test.js` | **8 passed / 0 failed** |
| Offline token tests | `node test/mainnet-deployed.test.js` | **14/14 passed**, no RPC or gateway contacted |

These results belong to commit `39a7333` only. Re-run them; do not reuse them as evidence for later changes.

Also verified at that commit: every file below matched its remote blob hash, and the homepage and `/wallet` page both render on mobile and desktop with no horizontal overflow and no console errors.

## Phase One deliverables (preserve these)

| File | Role |
| --- | --- |
| `web/index.html` | Public homepage: overview, principles, transparency, risk disclosures |
| `web/styles.css` | Light visual system; CSS-driven hero visuals; no external assets beyond the logo |
| `web/server.js` | Dependency-free static server with explicit `/` and `/wallet` routes and `noindex` headers |
| `web/wallet.html` | Preserved Phantom connect page, reached only at `/wallet` |
| `web/wallet.css` | Styling for the wallet page |
| `web/app.js` | Existing Phantom connect script, unchanged and intentionally not loaded by the homepage |
| `web/tests/server.test.js` | Dependency-free route/asset/security-header tests |
| `web/assets/brand/usol-logo.png` | Canonical logo served by the homepage (22,027 bytes; digest pinned in the tests) |

Phase One established: the public homepage carries no scripts and no wallet link; `/wallet` stays available but unlinked and `noindex, nofollow`; unknown paths return 404, unsupported methods 405, and traversal attempts 404.

## Next task — Phase Two (token information)

Objective: add accurate USOL token information to the existing website, per `WEBSITE_ARCHITECTURE.md` §18 "Phase 2 — Token information".

Acceptance criteria to meet:

- Mint, network, decimals, supply, and authority labels match the root records in `AGENT.md` and `config/mainnet.js`.
- Supply is not described as circulating supply.
- Recorded facts are labelled as recorded at deployment, never as a fresh live check.
- Any external or market information carries a source and a checked-time label; no invented prices, liquidity, volume, listings, partnerships, audits, or utility.
- Existing offline and website tests still pass; add website tests where appropriate.

Plan the phase and wait for explicit user approval before implementing, as §5 of `SKILL.md` requires.

## Rules that still bind

- Read in this order on a cold start: root `AGENT.md`, then `agent/SKILL.md`, then `agent/WEBSITE_ARCHITECTURE.md`, then `agent/HANDOVER.md` (this file).
- All website source and assets stay inside `web/`.
- The token is already deployed and immutable here: never change token configuration, authorities, metadata, deployment records, signatures, or verification tooling, and never add key loading or transaction signing.
- Never request, store, or transmit seed phrases or private keys. No transaction without explicit user approval in their own wallet.
- Do not commit, push, merge, publish, or deploy without explicit approval.
- Do not claim a test passed unless it was run in this session.

## Known limitations / not verified here

- A real Phantom wallet handshake was not verified; no wallet extension exists in the automated browser. The wallet page was rendered and its connect UI asserted, but the actual connection needs a manual check in a browser with Phantom installed, opened at `/wallet` directly (not embedded in a frame).
- `web/server.js` is a development/static server, not an approved production host. Hosting, domain, and deployment remain a separate approved phase (`WEBSITE_ARCHITECTURE.md` §17).
