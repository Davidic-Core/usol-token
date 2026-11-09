# Website Handover — read this before starting work

Recorded 2026-11-09, updated for the approved Phase Three (Phantom-only) implementation. This note is the authoritative current status of the UnitedSOLANA website work. It does not override or relax the root [`AGENT.md`](../AGENT.md), [`SKILL.md`](SKILL.md), or [`WEBSITE_ARCHITECTURE.md`](WEBSITE_ARCHITECTURE.md). If this note conflicts with them, those documents win.

## Current status at a glance

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 — Discovery and architecture | **Complete** | Architecture document approved |
| Phase 1 — Public website foundation | **Complete and verified** | Homepage, styling, server routes, logo |
| Phase 2 — Token information and design refinements | **Complete and verified** | Token section, mint card, mobile nav, Solscan links |
| Phase 3 — Phantom-only wallet connection | **Implemented in the working tree; pending owner review** | Not committed, pushed, or deployed |
| Multi-wallet expansion (Solflare, Backpack, Wallet Standard) | **Deferred, not authorized** | Requires a separate proposal and approval |

No transaction capability and no deployment is authorized. Phase Three does not sign messages or transactions, transfer, swap, buy, or sell.

## Branch and repository state

- Base44-connected repository: **`dave-clouds/usol-token`** (public); default branch `fix-website`.
- Phase Two is merged: PR #1 (`usol-token-info` → `fix-website`) and PR #5 (`fix-website` → working branch). `fix-website` is at **`c6bfa0c`** — "Merge pull request #5 from davidcloud001/fix-website".
- Active working branch: **`improve-wallet-connection`**, based on `c6bfa0c`. It is content-identical to `fix-website` at that commit plus the **uncommitted** Phase Three working-tree changes.
- The owner explicitly approved working on `improve-wallet-connection` and instructed: do not switch back to `fix-website`; do not commit, push, merge, or deploy until separate approval.
- Token configuration, deployment records, metadata, signatures, and verification tooling are unchanged.

## Phase One — complete

Verified previously at `39a7333` ("Correct Phase One review findings"):

- Public homepage is server-rendered HTML/CSS with no wallet dependency.
- `/wallet` remains available, unlinked from the homepage, and served `noindex, nofollow`.
- Unknown paths return 404, unsupported methods 405, and traversal attempts 404.
- Only the approved logo asset is used, served locally; its digest is pinned in the tests.

## Phase Two — complete (token information and design refinements)

- **Token information section** (`#token`) presenting only recorded deployment facts: UnitedSOLANA (USOL), Solana Mainnet, Classic SPL Token, mint `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`, 9 decimals, initial supply 1,000,000,000 USOL, mint authority revoked, freeze authority revoked.
- **Branded mint address card** with the canonical address, a copy button (`web/token.js`), an accessible status message, and a selection fallback when clipboard write is unavailable.
- **Branded inline SVG artwork**: the USOL emblem, copy icon, explorer glyphs, arrows, and mobile menu icons are all inline or local — no external CDN or tracker.
- **Mobile dropdown navigation** (`web/nav.js`): a local disclosure menu; without JavaScript the navigation stays a plain wrapped link list.
- **Branded Solscan tiles** linking to the specific records: `https://solscan.io/token/FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG` and `https://solscan.io/account/4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`.
- **Initial vs circulating supply kept distinct**; no price, market cap, liquidity, volume, listings, partnerships, audits, or utility were invented.

## Phase Three — Phantom-only connection improvements (implemented, pending review)

Approved scope decision: Phase Three is **Phantom-only**. Solflare, Backpack, Wallet Standard discovery, and multi-wallet selection are deferred to a future, separately approved increment. The phase documentation was updated to remove the earlier multi-wallet Phase Three definition.

Delivered in the working tree:

- **Documented Phantom provider detection** (`window.phantom.solana`, legacy `window.solana`), with late-injection polling for mobile in-app browsers and re-detection on `pageshow`, window focus, and `visibilitychange`.
- **Eager trusted-session restore** with `connect({ onlyIfTrusted: true })`, as documented; it never opens a prompt.
- **Public-address validation** in `web/wallet-core.js`: only base58 strings decoding to exactly 32 bytes are displayed. Malformed provider responses are treated as an error, not rendered.
- **Connect/disconnect feedback**: explicit detecting, ready, connecting, connected, disconnecting, and error states; `role="status"` announcements; `aria-busy`; controls disabled while an action is pending.
- **Documented error handling**: 4001 rejection, -32002 overlapping approval, 4100 unauthorized, 4900 disconnected network, -32000 invalid request, -32603 internal error, plus timeouts and unknown messages.
- **Provider events**: `connect`, `disconnect`, and `accountChanged`, including the no-account branch; events never open a prompt.
- **Accessibility**: connected account region is focusable (`tabindex="-1"`) and focused after connecting; focus returns to Connect after disconnecting; visible focus styling; no-JS guidance.
- **Mobile/embedded**: install hint no longer appears alongside the embedded-frame notice; the “Open in Phantom’s browser” link uses Phantom’s documented Browse deep link `https://phantom.com/ul/browse/<url>?ref=<ref>`; safe-area padding and `100dvh` handling; address wraps without overflow.
- **No dependencies added**: Phantom injects its own provider, so no wallet SDK or adapter library is used.

Official Phantom documentation checked for this phase (2026-11-09):

- `https://docs.phantom.com/solana/detecting-the-provider` — injected only on top-level https/localhost, not iframes; `window.phantom.solana` plus legacy `window.solana`; `isPhantom`.
- `https://docs.phantom.com/solana/establishing-a-connection` — `connect()`, `connect({ onlyIfTrusted: true })`, `disconnect()`, `accountChanged`, `connect`/`disconnect` events, and no eager connect in cross-origin iframes.
- `https://docs.phantom.com/solana/errors` — documented error-code table.
- `https://docs.phantom.com/phantom-deeplinks/other-methods/browse` — Browse deep link structure.

Files changed in Phase Three:

- `web/wallet-core.js` (new) — pure address, deep-link, and error-message helpers.
- `web/app.js` — detection, validation, state/feedback, disconnect, accessibility, mobile/embedded handling.
- `web/wallet.html` — script order, `noscript`, focusable account region, canonical title.
- `web/wallet.css` — state colours, focus styling, no-JS handling, safe areas, `100dvh`.
- `web/server.js` — explicit `/wallet-core.js` route.
- `web/tests/server.test.js` — wallet markup and connection-only script invariants.
- `web/tests/wallet.test.js` (new) — address/deep-link/error/helper tests.
- `README.md`, `agent/SKILL.md`, `agent/WEBSITE_ARCHITECTURE.md`, this file — approved Phantom-only scope and status.

Unchanged: `web/index.html`, `web/styles.css`, `web/nav.js`, `web/token.js`, `config/`, `deployments/`, and all token verification/deployment tooling.

## Verification performed for this handover

Run from the repository root against the current working tree:

```sh
node --test web/tests/server.test.js web/tests/wallet.test.js
npm run test:offline
```

| Suite | Command | Result |
| --- | --- | --- |
| Website route/asset tests + wallet helpers | `node --test web/tests/server.test.js web/tests/wallet.test.js` | **19/19 passed** (14 server, 5 wallet) |
| Offline token tests | `npm run test:offline` | **14/14 passed**, no Mainnet RPC or metadata gateway contacted |

Preview checks (development server, 375 px mobile viewport):

- Homepage token record, mint copy fallback, and mobile dropdown open/close verified with no console errors and no horizontal overflow.
- `/wallet` rendered in an embedded frame: connect control, embedded-frame notice, diagnostics, `noindex` metadata, and no console errors. The install hint is now correctly suppressed in that state.
- A real Phantom handshake/disconnect was **not** performed: the automation browser has no Phantom provider. This requires a manual check in a browser with Phantom installed and in Phantom’s in-app browser on a phone.

## Current website files

| File | Role |
| --- | --- |
| `web/index.html` | Public homepage: hero, overview, token record, principles, transparency, risk disclosures |
| `web/styles.css` | Light visual system, responsive layout, token card and navigation styling |
| `web/server.js` | Dependency-free static server with explicit routes and security headers |
| `web/nav.js` | Progressive-enhancement mobile navigation disclosure |
| `web/token.js` | Progressive-enhancement mint copy control |
| `web/wallet.html` | Phantom connect page at `/wallet` (unlinked, `noindex`) |
| `web/wallet.css` | Wallet page styling and mobile/safe-area layout |
| `web/wallet-core.js` | Pure address validation, Browse deep-link, and error-message helpers |
| `web/app.js` | Phantom-only connection/disconnection, validation, feedback, accessibility |
| `web/tests/server.test.js` | Route/asset/security/token-content/wallet-markup tests |
| `web/tests/wallet.test.js` | Offline tests for the pure wallet helpers |
| `web/assets/brand/usol-logo.png` | Canonical logo served by the homepage (digest pinned) |

## Next starting point — where to resume

1. Cold start: read root `AGENT.md`, then `agent/SKILL.md`, then `agent/WEBSITE_ARCHITECTURE.md`, then this file.
2. Owner reviews the Phase Three working-tree diff and either approves or requests changes. Nothing has been committed, pushed, merged, or deployed.
3. After approval: commit/push only the authorized files on `improve-wallet-connection` with separate Git approval; update this handover to “complete and verified”.
4. Perform the manual Phantom check (desktop extension, top-level `/wallet`, connect, account change, disconnect; then Phantom in-app browser on a phone).
5. Multi-wallet support remains deferred; it needs its own approved proposal, dependency/trust review, and test plan.

## Rules that still bind

- Read in this order on a cold start: root `AGENT.md`, then `agent/SKILL.md`, then `agent/WEBSITE_ARCHITECTURE.md`, then `agent/HANDOVER.md` (this file).
- All website source and assets stay inside `web/`.
- Phase Three is Phantom-only and connection-only: no signing (message or transaction), transfers, swaps, payments, balance display, or transaction submission.
- Never request, store, or transmit seed phrases or private keys.
- The token is already deployed and immutable here: never change token configuration, authorities, metadata, deployment records, signatures, or verification tooling.
- Do not commit, push, merge, publish, or deploy without explicit approval.
- Do not claim a test passed unless it was run in this session. Do not present recorded deployment facts as a fresh live check.

## Known limitations / not verified here

- A real Phantom connection, account change, and disconnect were not exercised automatically; the automation browser has no Phantom provider. Manual verification is required.
- `navigator.clipboard.writeText` is blocked in the automated preview browser, so the homepage clipboard write remains a manual check; the selection fallback was verified.
- Keyboard tab order through the mobile dropdown was reviewed in code but not re-checked with assistive technology.
- `web/server.js` is a development/static server, not an approved production host. Hosting, domain, and deployment remain a separate approved phase (`WEBSITE_ARCHITECTURE.md` §17).
- The Phantom in-app browser deep link was checked against current official documentation but not opened on a physical device in this session.
- No pull request, merge, deployment, or live Mainnet verification was performed for this update.
