# UnitedSOLANA Website Architecture and Design Proposal

## 1. Document purpose and authority

This document records the inspected starting point and a phased architecture proposal for the official UnitedSOLANA (USOL) website. It is intended for the user, Base44 Agent, GitHub Copilot, and future implementation agents. It is a plan, not authorization to implement every item in it.

The root [`AGENT.md`](../AGENT.md) is the highest-authority instruction. Read it before this document. The operating workflow is in [`SKILL.md`](SKILL.md). If this proposal conflicts with root rules, root rules win; stop and document the conflict. Do not modify root `AGENT.md` to bypass a restriction.

**Inspected repository state:** `web/` currently contains `index.html`, `styles.css`, `app.js`, and `server.js`. The current site is a minimal, dependency-free static Phantom connection page. It can connect/disconnect, display a public address, and provide mobile/embedded-browser guidance. Its server serves an explicit allowlist of paths and also serves the repository-root logos. The current website is not a React application and the root `package.json` is for token verification tooling, not a website framework. The architecture below is a recommended direction; preserve this existing implementation until a phase is approved.

## 2. Mission and long-term vision

The initial mission is to provide an official, trustworthy, mobile-first public presence for the existing UnitedSOLANA project: explain verified information clearly, identify the canonical token, and provide safe navigation to official resources once those destinations are confirmed.

The long-term vision is a well-maintained project website that can expand gradually into approved wallet and ecosystem experiences without coupling the public website to token deployment tooling. Each expansion must have a separate plan, explicit user approval, acceptance criteria, security review, and documented handoff. A future possibility is not a commitment or current feature.

## 3. Existing structure and constraints

### Current files

- `web/index.html` — single HTML page describing Phantom-only wallet connection.
- `web/styles.css` — dark responsive styles with gradient accents and focus-visible styling.
- `web/app.js` — browser-side Phantom provider detection and connection/disconnection; it handles mobile and embedded contexts and does not sign, transfer, or make page network requests.
- `web/server.js` — dependency-free Node HTTP static server with GET/HEAD-only handling and explicit routes. It serves website files and root `logo.svg` / `logo.png`.
- Root `logo.svg` and `logo.png` are existing brand asset candidates; verify the files, quality, provenance, and official status before relying on or copying them.

### Repository constraints

- This is a token verification/deployment repository as well as a website repository. Keep all website code and website-specific assets inside `web/`; do not alter deployment tooling, historical records, pinned token configuration, or retired utilities to support a site feature.
- Root `package.json` currently has token tooling dependencies and a `start` script for `web/server.js`. Do not replace its purpose or add frontend framework dependencies without an approved migration proposal.
- The current minimal website and its route allowlist must not be overwritten or expanded casually. Inspect behavior and references before edits; use additive, reviewed changes and test the server's intended route behavior if it changes.
- Root instructions permit appropriate wallet connection/disconnection, but that does not authorize transactions. For this plan, the initial wallet feature is limited further to connection-only. Do not implement transaction capabilities unless separately proposed and approved and allowed by root instructions.

## 4. Recommended architecture and technology

### Initial recommendation

Start with a small, static, mobile-first site in `web/`, extending the existing HTML/CSS/JavaScript implementation incrementally. This suits the current repository and avoids installing or configuring a second toolchain for informational pages. Keep browser-facing code isolated from the root Node token scripts. Do not introduce a backend, database, account system, or server-side wallet handling for the initial site; no such service is currently required by the approved initial scope.

If the user later approves a richer application and React/TypeScript is justified, propose a contained frontend build under `web/` (for example Vite + React + TypeScript), with its own scripts/configuration and output directory. First document how it coexists with `web/server.js`, the root `start` command, static hosting, tests, dependencies, and deployment. Do not migrate by replacing files or changing root package scripts without approval. Use maintained, supported syntax and libraries; minimize dependencies.

Use semantic HTML, CSS custom properties/design tokens, and small focused modules/components. Keep public token information in a clearly identifiable data module only if the implementation warrants it; source canonical facts from root instructions and verify dynamic facts at their stated source and time. No secrets belong in a browser bundle or repository.

## 5. Proposed directory and file structure

The proposed end-state is illustrative. Adopt it incrementally and only within approved phases; do not create empty scaffolding or move current files merely to match the diagram.

```text
web/
├── index.html                 # app entry/document metadata
├── app.js                     # current entry point; may later become a small bootstrap
├── styles.css                 # current styles; may later import organized styles
├── server.js                  # existing local/static server; preserve unless approved
├── assets/
│   ├── brand/                 # approved copies/variants only, with source recorded
│   └── icons/                 # optimized local UI icons
├── pages/                     # approved public page templates/routes if needed
├── components/                # shared navigation, footer, cards, status UI
├── data/
│   └── token.ts|js            # verified display facts only; no invented market metrics
├── styles/
│   ├── tokens.css             # colors, spacing, typography, focus tokens
│   └── components.css         # optional component styles
├── wallet/                    # future, approved connection-only wallet adapter/UI
├── tests/                     # website tests and mocks, separate from root token tests
├── package.json               # only if separately approved and isolated
└── vite.config.ts             # only if a React/TypeScript migration is approved
```

A browser-compatible extension choice such as `token.ts|js` means select one appropriate to the approved stack, not create both. For the existing vanilla application, avoid introducing a TypeScript compilation step without an approved build plan. Keep current root `test/` and token scripts untouched. If static routes are added, update only approved website routing and verify no traversal or unintended file-serving behavior is introduced.

## 6. Initial website scope and future features

### Planned for the initial public website (subject to phase approval)

- Responsive official homepage with project introduction based only on approved facts.
- Clear site navigation and footer, including risk/accuracy disclosures appropriate to displayed content.
- Token information displaying canonical, verified facts and a copyable mint only if approved and tested for accessibility/usability.
- Official logo/brand usage after verifying the existing asset and appropriate variants.
- Known official links only after their destinations are confirmed.
- A clearly labeled wallet connection entry point only when the separate connection phase is approved. That feature remains strictly connection-only as specified below.

### Future features requiring separate proposal and approval

- Multi-wallet connection experience: wallet discovery and selection; connect/disconnect; connected public address; wallet identity and connection status; unsupported-wallet and connection-error states. Supported targets: Phantom, Solflare, Backpack, and other compatible Solana wallets detected using Wallet Standard where supported.
- Dynamic on-chain information, any external market-data integration, ecosystem pages, announcements, or additional content sources.
- Wallet balances, token holdings, transaction signing, transfers, swaps, payments, staking, rewards, smart-contract interactions, accounts, chat, analytics, or other integrations. These are not part of the initial wallet implementation. Each requires distinct approval, a technical/security plan, and review against root `AGENT.md`. Some may be prohibited or require further policy changes; no feature may bypass root rules.
- React/TypeScript migration, backend services, database, or content-management system.
- Production hosting, custom domain, deployment, or third-party services.

### Prohibited by root project instructions

- Creating another USOL mint, minting additional tokens, or changing mint/freeze authorities.
- Modifying pinned token configuration, historical deployment records, or protected deployment/verification tools to support the website; do not restore transaction-capable behavior to retired utilities.
- Requesting, collecting, storing, transmitting, or exposing seed phrases or private keys; adding key files/key loading; signing with project-owned private keys or server-side signing.
- Performing blockchain transactions, or implementing wallet signing, transfers, or swaps for the initial connection-only phase. The root's transaction approval requirements remain controlling even if a future transaction feature is separately considered.
- Inventing prices, market capitalization, volume, liquidity, exchange listings, partnerships, audits, utilities, or guaranteed returns/outcomes.
- Real blockchain transactions in tests, secrets in repository files, or publishing/deployment without explicit approval.

If a desired feature appears to conflict with root instructions, mark it blocked, state the relevant conflict, and request direction. Do not make a change that weakens or bypasses the root rules.

## 7. Homepage layout and content

Recommended mobile-first section order:

1. **Header:** verified official logo, UnitedSOLANA wordmark, compact navigation, and accessible menu control on narrow screens.
2. **Hero:** concise project identification and a factual, non-promissory introduction. Primary call to action should lead to an approved information section/resource. Do not imply investment returns or verified utility not documented by the project.
3. **Project overview:** explain only approved project purpose and status; avoid unsupported claims.
4. **Token facts:** network, name/symbol, canonical mint, decimals, and total/initial supply as recorded. Clearly label what each figure means and provide a safe copy action/explorer link only after verifying the destination/address. Authority status can be stated as root-recorded and should not be portrayed as a fresh live check unless one was performed.
5. **How to verify / resources:** link to confirmed official sources and clearly identify external explorers or sources. Do not invent community links.
6. **Wallet connection entry point (future approved phase):** describe that connecting shares a public address with the page; distinguish this from signing or authorizing transactions. Do not show transactional controls.
7. **Risk and transparency note:** concise cryptocurrency risk disclosure; no investment advice or promised return.
8. **Footer:** logo/name, approved navigation, verified contact/community links if supplied, copyright/legal links only if approved and available.

Content can be omitted until verified; do not fill unknowns with placeholders that look factual. A disconnected wallet should not block access to public pages.

## 8. Navigation and proposed pages

Start with a lightweight single-page navigation if that serves the approved initial content. Suggested top-level anchors or pages, subject to approved content:

- Home
- About / Project
- Token information
- Ecosystem (only when verified content exists)
- Resources (only confirmed destinations)
- Wallet (only after the separate connection phase is approved)

Do not create a “Buy,” “Trade,” “Swap,” “Staking,” or “Earn” route as part of the initial website. Any later marketplace or transaction experience needs a separate scope, route verification, user approval, and consistency with root rules. Avoid dead links and unverified social/community URLs. If multi-page routing is later approved, define 404 behavior and ensure the current static server or approved hosting correctly serves routes.

## 9. Mobile-first and desktop design

Design first for narrow phone viewports and touch interaction, then progressively enhance for tablets and desktop. Use responsive layouts, readable line lengths, scalable type, adequate spacing, and large touch targets (aim for at least 44 CSS pixels where practical). Avoid horizontal overflow, hover-only controls, and small address/copy controls. Wallet selection and connection states should remain understandable on mobile browsers and in-app wallet browsers, with graceful guidance when a wallet provider is unavailable or the page is embedded.

On wider screens, use a constrained content width, intentional whitespace, and responsive grids rather than stretching text. Respect reduced-motion preferences. Provide visible keyboard focus and do not rely on color alone for status. Test at representative small-phone and desktop sizes and with zoom/text scaling.

## 10. Branding, palette, and official logo

The existing stylesheet uses a dark visual system: background `#060b14`, surfaces around `#0d1524`, pale text `#e8effc`, muted text `#93a4c2`, and blue-to-purple gradient accents. Treat these as existing implementation colors, not confirmed official brand standards. Reuse or adjust them only through an approved design phase; check contrast ratios and define named CSS variables rather than scattering literals.

The repository contains root `logo.svg` and `logo.png`, and root instructions list a canonical metadata logo URI. Confirm the local asset's identity, resolution, and provenance before calling it the official logo. Preserve the source asset; do not overwrite it. Prefer a reviewed copy inside `web/assets/brand/` only if necessary and approved, keeping attribution/source documented. Provide meaningful alt text when the logo conveys information; use empty alt text for a decorative duplicate next to a text wordmark. Do not recolor or distort the mark without authorization.

## 11. Official token information and factual integrity

Root `AGENT.md` identifies the recorded canonical facts:

- Name/symbol: UnitedSOLANA / USOL.
- Network: Solana Mainnet (`mainnet-beta`).
- Mint: `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`.
- Decimals: 9.
- Total supply recorded: 1,000,000,000 USOL; do not relabel this as circulating supply.
- Metadata account: `4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`.
- Metadata URI: `https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY`.
- Logo URI: `https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo`.
- Mint and freeze authorities recorded as revoked (`null`).

Treat this as the project's pinned record, not proof of a new live check. If displaying live on-chain or third-party data is later approved, identify the source, timestamp/last-checked time, failure/staleness behavior, and whether the value is estimated. Never invent token price, market cap, trading volume, liquidity, listings, partnerships, audits, or utility. Do not promise returns. Use risk disclosures suitable to the displayed information.

## 12. Future wallet integration points — connection only

Wallet connectivity is a planned, separately approved feature. When authorized, architecture should support:

- Wallet discovery and selection for Phantom, Solflare, Backpack, and compatible Wallet Standard wallets where supported.
- Clear wallet identity and detected/unsupported states.
- User-initiated connect and disconnect; connection status and connected public address.
- Provider errors including cancellation/rejection, unavailable provider, unsupported wallet, and disconnect/account-change events, with accessible recovery guidance.
- Mobile and in-app-browser behavior, including browser/provider limitations.
- A provider abstraction or maintained compatibility library, selected after review; do not assume every wallet exposes identical APIs.

The initial implementation ends at connection state and public-address display. It must not request signatures, sign messages, submit transactions, transfer tokens, execute swaps, or make wallet-based payments. Do not display token/SOL balances in this initial scope. Connecting is not consent to transact. Do not persist or send the address unless a separately approved privacy design requires it; default to keeping connection data in page memory and explain any provider-managed trusted-site behavior accurately. Never request secrets.

## 13. Future swap integration points

Swap functionality is not part of the initial site or wallet phase. Any later proposal must separately establish whether it is permitted by root instructions and obtain explicit approval. It must verify that a genuine route and liquidity exist before presenting a route; disclose provider/source, quote age, fees, price impact, and slippage where available; show transaction details before the user approves inside their own wallet; and handle unavailable routes, rejection, and failures. No automated test may submit a real transaction. Do not claim a pair, route, pool, or exchange listing without verification. If root rules or user scope do not allow it, do not implement it.

## 14. Ecosystem and platform expansion

Potential later content may include verified project updates, approved ecosystem resources, and confirmed integrations. Each item must have a source and owner for ongoing maintenance. Do not imply partnership or endorsement without confirmation. Accounts, live chat, payments, staking, rewards, governance, and other interactive platform services are outside the initial architecture. They require a separate product, privacy, security, moderation, operational, and legal review before approval; some may be incompatible with repository rules.

## 15. Security and privacy requirements

- Follow root `AGENT.md` and the connection-only scope above; never expose or handle wallet secrets.
- Keep web code under `web/`, separate from token/deployment tooling. Do not add server-side signing or key files.
- Minimize external scripts, fonts, analytics, and wallet dependencies; review package provenance, maintenance, permissions, and supply-chain risk before approval.
- Use HTTPS in production; do not collect personal data by default. If any data collection is proposed, document purpose, retention, access, consent, and privacy disclosure before implementation.
- Prevent unsafe HTML injection; render untrusted text with safe DOM APIs. Validate/encode URLs and use safe external-link attributes. Do not leak addresses or diagnostics to logs/third parties.
- For any future server endpoints, define minimal methods, input validation, rate limiting, security headers, error handling, and privacy controls before approval. The existing server is static-only; do not turn it into a backend implicitly.
- Keep credentials out of source, examples, bundles, and commits; use no `.env` secrets in browser code.
- Keep offline tests independent from live chain services; mock providers and network responses. No real transaction in tests.

## 16. Performance, accessibility, and testing

Prefer local, optimized assets and minimal JavaScript for the initial informational site. Avoid unnecessary dependencies and large render-blocking resources. Set explicit image dimensions, lazy-load below-fold media when appropriate, and ensure page content remains useful if scripts or wallet providers fail. Any performance targets should be agreed and measured on the approved build; do not claim a score without running the measurement.

Use semantic landmarks and heading order, accessible names for controls, keyboard-operable navigation and wallet selection, focus management for menus/dialogs, visible focus, sufficient contrast, reduced-motion support, and status announcements that are not overly verbose. Test keyboard-only use and a screen reader where available.

Test plan by phase may include:

- Existing `npm run test:offline` regression test; preserve its offline nature.
- HTML/CSS/JavaScript checks and static server route/method behavior for approved site changes.
- Responsive viewport checks, overflow, link validity, focus, contrast, keyboard navigation, and manual accessibility checks.
- Wallet feature tests with mocked provider/Wallet Standard discovery: supported wallet selection, connect/disconnect, address/status rendering, missing/unsupported wallets, rejection, errors, account changes, and mobile/provider-unavailable states.
- Confirm wallet tests do not invoke signing, transaction submission, transfers, swaps, or balance retrieval.
- Security and dependency review for any approved integration.

Report commands actually run and results. Do not claim a test, accessibility audit, live verification, or wallet compatibility check without performing it.

## 17. Hosting, domain, and deployment

No production host or domain is asserted by this document. Select a host only after approval and verify it can serve the approved static output over HTTPS with correct caching, MIME types, fallback routes (if needed), and security headers. The current `web/server.js` is a small development/static server and is not automatically a production hosting recommendation. Consider domain ownership and DNS, TLS renewal, rollback, build reproducibility, monitoring, privacy, and content-update process in a launch proposal. Do not put credentials in the repository. Do not deploy or configure a domain without explicit approval.

## 18. Development phases and deliverables

Each phase requires its own user approval before implementation, followed by tests, review, a completion report, and a stop for approval before the next phase. Phases can be subdivided; scope does not advance by implication.

### Phase 0 — Discovery and architecture/design

**Deliverables:** repository/file inventory, approved mission and content boundaries, visual direction, navigation/wireframe, technology recommendation, risk and dependency assessment.

**Acceptance:** root and website instructions read; actual `web/` files inspected; current state distinguished from proposal; all unknown claims and links identified; user approves design and scope. No code change unless separately authorized.

### Phase 1 — Public website foundation

**Deliverables:** approved responsive homepage, navigation/footer, verified logo integration, factual introductory content, basic page metadata and disclosures.

**Acceptance:** only approved files changed; mobile and desktop layouts usable without horizontal overflow; keyboard focus/navigation and semantic structure work; logo source verified; no invented claims or dead/unverified links; existing offline tests still pass; no wallet-dependent page access.

### Phase 2 — Token information

**Deliverables:** clear token facts section using canonical recorded details and verified official-source links; safe copy interaction if approved.

**Acceptance:** mint/network/decimals/supply/authority labels match root records; supply is not mislabeled as circulating; recorded facts are not presented as a fresh live check; all external information has source/checked-time labels where applicable; no fabricated market/project claims; offline tests pass.

### Phase 3 — Connection-only multi-wallet support

**Deliverables:** wallet discovery and selection; Phantom, Solflare, Backpack support; Wallet Standard detection for other compatible wallets where supported; connect/disconnect; detected wallet identity, public address, and connection status; unsupported-wallet and connection-error handling; mobile/provider-unavailable guidance.

**Acceptance:** supported wallets are detected through reviewed maintained interfaces; selection and connect/disconnect are user initiated and work with mocked providers; public address and status are presented accessibly; rejection, missing provider, unsupported wallet, disconnect, and relevant provider changes are handled; page remains usable without a wallet; privacy behavior is documented and minimal; no signing, transaction request, token transfer, swap, payment, balance display, or transaction submission code is introduced; no real transactions are tested.

### Phase 4 — Future integrations, each separately proposed

**Deliverables:** a feature-specific product, technical, security, privacy, and testing plan before any implementation (for example, on-chain read-only display or a transaction-related proposal).

**Acceptance:** user approves a distinct scope; root `AGENT.md` permits it; factual sources and failure behavior are defined; threat/dependency review is complete; test plan uses mocks/offline fixtures and no real transactions; otherwise feature remains blocked/not implemented. This phase does not pre-approve any transaction or financial feature.

### Phase 5 — Ecosystem content and expansion

**Deliverables:** verified resource/update pages or separately approved platform capabilities with explicit ownership and maintenance plan.

**Acceptance:** every claim/integration is authorized and sourced; no implied partnerships, fabricated utilities, or unapproved data collection; privacy/security/moderation risks are resolved; tests and documentation are reviewed; root rules remain satisfied.

### Phase 6 — Optimization and launch readiness

**Deliverables:** measured performance/accessibility/security review, approved hosting/domain plan, reproducible build and rollback instructions, launch checklist.

**Acceptance:** actual test/audit results recorded; HTTPS, routing, headers, cache behavior, privacy, and operational ownership are checked; existing tests remain intact; no deployment or public launch until the user separately approves it.

## 19. Change management and maintenance

Before changing any existing file, read it fully and check its callers, routes, and tests. Keep each change within the approved phase and file scope. Avoid destructive rewrites and unrelated formatting. Review the diff for accidental modifications to deployment/token files and credentials. Do not automatically copy proposal structure into the repository.

After an approved phase, document status, completed criteria, changed files, actual tests, decisions/sources, limitations, and outstanding tasks. Keep later phases clearly marked as planned and not approved. Use GitHub as the source of truth for approved artifacts; only make commits, pushes, merges, and deployments explicitly authorized by the user. A branch commit does not imply permission to merge.

## 20. Explicit scope summary

- **Initial planned public site:** responsive, factual public project pages and navigation; no invented claims.
- **Initial wallet phase, only after approval:** multi-wallet discovery/selection, connection/disconnection, detected identity, public address/status, unsupported-wallet and error handling. Connection-only.
- **Future, separately approved:** broader pages, ecosystem expansion, and any additional data or integrations.
- **Not part of initial scope:** signing, transfers, swaps, wallet payments, balances, or transaction submission.
- **Never permitted by root rules:** creating another USOL mint, changing authorities, exposing/requesting secrets, modifying protected token/deployment tooling to enable site features, or fabricating project/market claims.

When uncertain, stop, report the question or root-rule conflict, and wait for user direction.
