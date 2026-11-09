# Website Handover — read this before starting work

Recorded 2026-11-09. This note is the authoritative current status of the UnitedSOLANA website work. It does not override or relax the root [`AGENT.md`](../AGENT.md), [`SKILL.md`](SKILL.md), or [`WEBSITE_ARCHITECTURE.md`](WEBSITE_ARCHITECTURE.md). If this note conflicts with them, those documents win.

## Current status at a glance

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 — Discovery and architecture | **Complete** | Architecture document approved |
| Phase 1 — Public website foundation | **Complete and verified** | Homepage, styling, server routes, logo |
| Phase 2 — Token information and design refinements | **Complete and verified** | Token section, mint card, mobile nav, Solscan links |
| Phase 3 — Connection-only wallet support | **Planned, NOT started, not authorized** | Detailed scope needs owner approval first |

No further phase, transaction capability, or deployment is authorized. Phase Three must be planned and explicitly approved by the owner before any implementation.

## Branch and repository state

- Repository: `davidcloud001/usol-token`
- Phase Two work is committed on branch **`usol-token-info`**:
  - `9474e59` — "Implement Phase Two design refinements and mobile navigation" (current HEAD)
  - `5f0aa8d` — "Implement Token section and site navigation updates"
- `origin/fix-website` (the repository default) is at `2d37dcd` — "Update project documentation and handover plan". It contains Phase One only and does **not** include the Phase Two commits until a merge is explicitly authorized.
- Token configuration, deployment records, metadata, signatures, and verification tooling are unchanged.

## Verification performed at this handover

Commands were run from the repository root against the working tree at `9474e59` (`git status` clean).

```sh
node --test web/tests/server.test.js   # website tests
npm run test:offline                   # offline token tests (node test/mainnet-deployed.test.js)
npm run verify:mainnet                 # optional live read-only check; NOT run for this handover
```

| Suite | Command | Result |
| --- | --- | --- |
| Website route/asset tests | `node --test web/tests/server.test.js` | **13 passed / 0 failed** |
| Offline token tests | `npm run test:offline` | **14/14 passed**, no Mainnet RPC or metadata gateway contacted |

These results belong to `9474e59` only. Re-run them; do not reuse them as evidence for later changes.

Owner-reported manual checks for Phase Two, passed in a real browser: the mint copy button, the Solscan token link, and the Solscan metadata link.

## Phase One — complete

Verified previously at `39a7333` ("Correct Phase One review findings"):

- Website tests: **8/8 passed** (that suite has since grown to 13 tests in Phase Two; the current 13/13 supersedes the count).
- Offline tests: **14/14 passed**.
- Homepage and mobile rendering verified with no horizontal overflow and no console errors.

Established behavior, still in force:

- The public homepage is server-rendered HTML/CSS with no wallet dependency.
- `/wallet` remains available, unlinked from the homepage, and served `noindex, nofollow`.
- Unknown paths return 404, unsupported methods 405, and traversal attempts 404.
- Only the approved logo asset is used, served locally; its digest is pinned in the tests.

## Phase Two — complete (token information and design refinements)

Delivered on `usol-token-info`:

- **Token information section** (`#token`) presenting only recorded deployment facts: UnitedSOLANA (USOL), Solana Mainnet, Classic SPL Token, mint `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`, 9 decimals, initial supply 1,000,000,000 USOL, mint authority revoked, freeze authority revoked.
- **Branded mint address card** with the canonical address, a copy button (`web/token.js`) and an accessible status message; the copy button falls back to selecting the address text when clipboard write is unavailable.
- **Branded inline SVG artwork**: the USOL emblem, copy icon, explorer glyphs, arrows, and mobile menu icons are all inline or local — no external CDN or tracker.
- **Mobile dropdown navigation** (`web/nav.js`): a local disclosure menu; without JavaScript the navigation stays a plain wrapped link list.
- **Branded Solscan tiles** linking to the specific records, not the explorer homepage: the token page `https://solscan.io/token/<mint>` and the metadata account `https://solscan.io/account/4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`.
- **Initial vs circulating supply kept distinct**: initial supply is labelled as recorded at deployment; no circulating-supply figure is published because none is verified.
- No price, market cap, liquidity, trading volume, listings, partnerships, audits, or utility were invented.

## Current website files

| File | Role | Introduced |
| --- | --- | --- |
| `web/index.html` | Public homepage: hero, overview, token record, principles, transparency, risk disclosures | Phase 1, extended in Phase 2 |
| `web/styles.css` | Light visual system, responsive layout, token card and navigation styling | Phase 1, extended in Phase 2 |
| `web/server.js` | Dependency-free static server with explicit `/` and `/wallet` routes and security headers | Phase 1 |
| `web/nav.js` | Progressive-enhancement mobile navigation disclosure; no network or wallet code | Phase 2 |
| `web/token.js` | Progressive-enhancement mint copy control; no network, wallet, or transaction code | Phase 2 |
| `web/wallet.html` | Preserved Phantom connect page, reached only at `/wallet` | Phase 1 (preserved) |
| `web/wallet.css` | Styling for the wallet page | Phase 1 (preserved) |
| `web/app.js` | Existing Phantom connect script, intentionally not loaded by the homepage | Phase 1 (preserved) |
| `web/tests/server.test.js` | Dependency-free route/asset/security/token-content tests (13 tests) | Phase 1, extended in Phase 2 |
| `web/assets/brand/usol-logo.png` | Canonical logo served by the homepage (digest pinned in the tests) | Phase 1 |

## Phase Three — PLANNED, NOT STARTED

Proposed scope for the next phase, subject to the owner's approval of a detailed plan:

- Improve Phantom wallet connection and disconnection.
- Display the connected public wallet address.
- Improve the mobile wallet experience and connection error handling.
- No signing, transfers, swaps, or trading unless separately authorized.

Bounds that apply when Phase Three is planned (see `SKILL.md` §7 and `WEBSITE_ARCHITECTURE.md` §18 "Phase 3 — Connection-only multi-wallet support"):

- Connection-only: no signing, transaction request or submission, transfers, swaps, payments, or balance display.
- Public address and connection status only; never keys or seed phrases.
- Keep the page fully usable without a wallet, and keep wallet tests offline with mocked providers.
- Any change to the current unlinked, `noindex` `/wallet` page — including linking it from the homepage — must be part of the approved Phase Three scope.
- Root `AGENT.md` remains the highest authority; a request cannot authorize a prohibited capability.

## Next starting point — where to resume

1. Cold start: read root `AGENT.md`, then `agent/SKILL.md`, then `agent/WEBSITE_ARCHITECTURE.md`, then this file.
2. Confirm branch and commit state: Phase Two lives on `usol-token-info` at `9474e59`; `fix-website` is at `2d37dcd`. Ask the owner which branch Phase Three should build on and whether a Phase Two merge is authorized.
3. Write the Phase Three plan — objective, in-scope/out-of-scope features, deliverables, files likely to change, test plan, dependencies, risks, and security/privacy review — and **wait for the owner's explicit approval of that detailed scope before implementation**.
4. Only after approval: implement, run `node --test web/tests/server.test.js` and `npm run test:offline`, verify the wallet states that can be verified, and report actual results.

## Rules that still bind

- Read in this order on a cold start: root `AGENT.md`, then `agent/SKILL.md`, then `agent/WEBSITE_ARCHITECTURE.md`, then `agent/HANDOVER.md` (this file).
- All website source and assets stay inside `web/`.
- The token is already deployed and immutable here: never change token configuration, authorities, metadata, deployment records, signatures, or verification tooling, and never add key loading or transaction signing.
- Never request, store, or transmit seed phrases or private keys. No transaction without explicit user approval in their own wallet.
- Do not commit, push, merge, publish, or deploy without explicit approval.
- Do not claim a test passed unless it was run in this session. Do not present recorded deployment facts as a fresh live check.

## Known limitations / not verified here

- `navigator.clipboard.writeText` is blocked in the automated preview browser, so the clipboard write itself was only verified manually by the owner. The automatic test verifies that the copy script is served and contains no wallet or transaction code, and that the selection fallback exists.
- Keyboard tab order through the mobile dropdown was reviewed in code but not manually re-checked with assistive technology.
- No wallet handshake has been verified at this handover; Phase One reported that the `/wallet` connect UI renders but a real Phantom connection needs a manual check in a browser with Phantom installed, opened at `/wallet` directly (not embedded in a frame). Phase Three covers wallet improvements.
- `web/server.js` is a development/static server, not an approved production host. Hosting, domain, and deployment remain a separate approved phase (`WEBSITE_ARCHITECTURE.md` §17).
- No pull request, merge, deployment, or live Mainnet verification was performed for this handover.
