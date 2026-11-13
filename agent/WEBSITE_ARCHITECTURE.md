UnitedSOLANA Website Architecture and Design Proposal

1. Document purpose and authority

This document records the existing website architecture, design direction, technical constraints, and proposed development phases for the official UnitedSOLANA (USOL) website.

It is a proposal and architecture reference, not authorization to implement every feature.

The root ""AGENT.md"" (../AGENT.md) is the highest-authority project instruction. Read it first. The operating workflow is in ""SKILL.md"" (SKILL.md). The current project status and verified handover are recorded in ""HANDOVER.md"" (HANDOVER.md).

If this document conflicts with root instructions, root instructions win. Stop and report the conflict rather than weakening or bypassing a restriction.

2. Project mission and long-term vision

The initial mission is to provide an official, trustworthy, mobile-first public presence for the existing UnitedSOLANA project.

The website should:

- Explain verified project information clearly.
- Identify the canonical USOL token.
- Provide safe navigation to confirmed official resources.
- Offer accessible and reliable wallet experiences as separately approved phases.
- Grow through independently reviewed improvements.

The long-term vision is a useful project website that can expand into approved wallet and ecosystem experiences without coupling website functionality to token deployment tooling.

A future possibility is not a current feature or implementation commitment.

3. Repository ownership and architecture constraints

Verified working repository: "davidcloud001/usol-token", a fork of canonical upstream "Snr-Dave/usol-token". The current GitHub default branch observed on 2026-11-13 is "feat/usol-wallet-theme". Verify remotes and the current branch for each task; do not assume an integration branch. GitHub is the source of truth for approved repository changes.

Existing architecture

The current website is a static, dependency-free vanilla HTML/CSS/JavaScript application under "web/".

The existing project includes:

- "web/index.html" — public homepage.
- "web/styles.css" — homepage styles.
- "web/server.js" — dependency-free static server.
- "web/nav.js" — mobile navigation enhancement.
- "web/token.js" — token mint copy functionality.
- "web/wallet-core.js" — wallet-related helper logic and balance formatting.
- "web/wallet-discovery.js" — Solana Wallet Standard discovery.
- "web/wallet-home.js" — homepage wallet panel (connect, disconnect, account switching, read-only balances).
- "web/assets/brand/usol-logo.png" — website logo asset.
- "web/tests/" — website-specific tests.

Inspect the actual branch before relying on this list as a complete inventory.

The homepage (`/`) contains the Overview section and the existing wallet panel: Wallet Standard discovery, Phantom/Solflare injected fallbacks, connect/disconnect, account switching, and read-only SOL/USOL balances. The separate Project Information page (`/project-information`) contains Token, Principles, and Transparency. The dedicated Risks section has been removed from the website.

The homepage must not be assumed to contain swap functionality.

Balance reads go through the site's own server-side proxy, `POST /api/rpc`, which accepts only `getBalance` and `getTokenAccountsByOwner`. The upstream Mainnet endpoint is set with the server-side `SOLANA_RPC_URL` or `HELIUS_API_KEY` environment variable; the key is never served to the browser.

Repository constraints

- All website source and website-specific assets belong under "web/".
- Do not modify token deployment scripts, protected configuration, historical deployment records, or verification tooling for website features.
- Root "package.json" remains associated with existing token tooling and the website start command.
- Do not replace the existing architecture with React, TypeScript, or another framework without a separately approved migration proposal.
- Do not add dependencies without justification, approval, and security review.

4. Development tools and workflow

- GitHub is the source of truth for repository files, branches, reviews, and approved changes.
- GitHub Copilot is used for project documentation and agent-instruction maintenance.
- Base44 is currently used for approved website implementation. Implementation takes place on a separate feature branch based on the approved updated development baseline.
- Review changes before merging or deployment; obtain owner approval before either action.
- Older references to v0, Vercel, or Acode are historical unless independently verified as current. Do not assume hosting or preview deployment is configured.

5. Recommended technology

Continue with the existing static HTML/CSS/JavaScript architecture for the current website.

This approach:

- Preserves the existing implementation.
- Avoids unnecessary dependencies.
- Keeps the website separate from token tooling.
- Supports straightforward static hosting.
- Minimizes deployment and maintenance complexity.

A future React/TypeScript migration may be considered only through a separate proposal that explains:

- Why the existing architecture is insufficient.
- Required dependencies and security implications.
- How the migration coexists with "web/server.js".
- How root scripts and existing tests remain protected.
- How preview and production hosting will work.
- How rollback will be performed.

Do not create empty scaffolding or migrate files simply to match a proposed architecture diagram.

6. Illustrative future directory structure

The following is an optional future structure, not an instruction to restructure the existing application.

web/
├── index.html
├── app.js
├── styles.css
├── server.js
├── assets/
│   ├── brand/
│   └── icons/
├── pages/
├── components/
├── data/
├── styles/
├── wallet/
└── tests/

Adopt additional folders only when justified by an approved implementation phase.

Keep the current entry points and server behavior intact unless an approved change requires otherwise.

7. Current website content and homepage structure

Current mobile-first website structure:

1. Shared header: official logo, UnitedSOLANA identity, and accessible navigation.
2. Homepage (`/`): Overview section and existing wallet panel.
3. Project Information page (`/project-information`): Token, Principles, and Transparency sections.
4. Shared footer: approved project information and verified links.

The dedicated Risks section has been removed from the website. Do not reintroduce it as a page section or navigation destination.

Do not invent missing information or use placeholders that could be mistaken for factual claims.

Public pages should remain accessible without connecting a wallet.

8. Project Information page and navigation (implemented)

The owner-approved page and navigation reorganization are implemented on feature branch `feat/project-information-page`. A later owner correction removed the dedicated Risks section from the website entirely: it is not on the homepage and not on the Project Information page.

**Homepage** (`/`)

- Overview section only, at `/#overview`.
- Wallet panel and all wallet functionality unchanged.

**Project Information page** (`/project-information`)

1. Token — `#token`
2. Principles — `#principles`
3. Transparency — `#transparency`

Navigation destinations, in both the header dropdown and the footer: Overview → `/#overview`; Token → `/project-information#token`; Principles → `/project-information#principles`; Transparency → `/project-information#transparency`. There is no Risks navigation entry.

Routing: `web/server.js` serves `/project-information` from its explicit `ROUTES` allowlist with the `no-store` cache header. Section anchors are resolved by the browser and never reach the server, so direct access, refresh, and back/forward navigation need no client-side router. Unknown paths keep returning HTTP 404, and the RPC proxy allowlist is unchanged.

The page reuses the existing `styles.css` / `theme.css`, header and footer markup, and the `nav.js` mobile disclosure. It loads `/nav.js`, `/theme.js` and `/token.js` (mint copy) only; it does not load the wallet scripts and carries no wallet panel.

Open item for the owner: root `AGENT.md` section 7 asks for appropriate risk disclosures, while the dedicated risk section is now removed. Current risk wording is limited to the footer note ("not investment advice") and the transparency copy. Confirm whether further risk wording is required.

Preserve existing copy and meaning, visual design, responsive behavior, accessibility, and functionality. Direct section links, browser refresh, and back/forward navigation must work.

Do not create functional Buy, Trade, Swap, Staking, or Earn routes without separate approval and verified supporting functionality. Avoid dead links, unverified social accounts, and unsupported partnership claims.

9. Mobile-first and desktop design

Design for narrow phone screens first, then progressively enhance for tablets and desktop.

Requirements:

- Responsive layouts without horizontal overflow.
- Readable text and appropriate line lengths.
- Touch-friendly controls, aiming for at least 44 CSS pixels where practical.
- Visible keyboard focus.
- No hover-only functionality.
- Support for reduced-motion preferences.
- Accessible status messages.
- Graceful behavior when JavaScript or wallet providers are unavailable.

On wider screens, use constrained content widths, intentional whitespace, and responsive grids.

Test representative small-phone and desktop viewports.

10. Branding, palette, and official logo

The existing styles have used a dark visual system with:

- Background: "#060b14"
- Surfaces around: "#0d1524"
- Primary text: "#e8effc"
- Muted text: "#93a4c2"
- Blue-to-purple gradient accents.

These are existing implementation colors, not necessarily confirmed official brand standards.

Review contrast and accessibility before changing the design.

The project has a canonical logo URI recorded in root "AGENT.md". Preserve the existing local logo asset and verify its source before replacing or modifying it.

Do not distort, recolor, or overwrite the logo without approval.

Use meaningful alt text when the logo conveys information. Use empty alt text for a decorative duplicate beside a text wordmark.

11. Canonical token information

Root "AGENT.md" records the following project details:

- Name: UnitedSOLANA.
- Symbol: USOL.
- Network: Solana Mainnet ("mainnet-beta").
- Mint: "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG".
- Decimals: 9.
- Recorded total/initial supply: 1,000,000,000 USOL.
- Metadata account: "4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc".
- Metadata URI: "https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY".
- Logo URI: "https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo".
- Mint authority: revoked ("null").
- Freeze authority: revoked ("null").

These are pinned project records, not proof of a new live blockchain verification.

Do not describe total supply as circulating supply.

If live on-chain or third-party information is introduced in an approved phase, identify its source, retrieval time, stale-data behavior, and whether it is an estimate.

Never invent prices, market capitalization, volume, liquidity, listings, partnerships, audits, or utilities.

12. Current wallet functionality and security boundaries

The current homepage wallet panel is implemented, not merely proposed. The website code provides Wallet Standard discovery for Solana wallets, injected Phantom and Solflare fallbacks, user-initiated connection and disconnection, validated public address display, and account-change/external-disconnect handling. Other compatible Wallet Standard wallets may be detected. No Backpack-specific integration is present.

The panel displays read-only SOL and USOL balances. Balance requests go through the local `POST /api/rpc` proxy, which accepts only `getBalance` and `getTokenAccountsByOwner`; the upstream RPC URL and optional Helius key are server-side. The wallet flow does not sign messages or transactions, send transfers, or execute swaps.

Automated tests cover discovery, connection/disconnection helpers, account-change events, balance formatting, and proxy behavior using local mocks. The handover records the exact tests run for this documentation update. Real extension, in-app browser, physical-device, and live Mainnet balance testing remain unverified unless separately recorded as performed.

Connection and balance display do not authorize any signing, transfers, swaps, purchases, sales, payments, or transaction submission. Any transaction feature requires a separate proposal, technical/security review, and explicit owner approval.

13. USOL swap integration

Status: Not implemented and not approved.

Potential functionality:

- SOL-to-USOL swaps.
- USOL-to-SOL swaps.
- Investigation of Jupiter and other reputable supported integrations.
- Verified quote and route retrieval.
- Transaction previews.
- Wallet approval and understandable transaction states.
- Slippage and fee information.
- Error handling for unavailable routes and rejected transactions.

Before implementation, verify that a genuine route and liquidity exist.

Identify the provider and quote age. Disclose fees, price impact, and slippage where available.

All transactions must be reviewed and approved by the user's connected wallet.

Never claim a pair, route, pool, or exchange listing exists without verification.

Any future swap proposal requires a separate technical and security review and explicit owner approval.

No real transaction may be submitted as part of automated testing.

14. Phase Six — Ecosystem and launch readiness

Status: Proposed, not implemented.

Potential work:

- Verified ecosystem information.
- Confirmed official social links.
- Project documentation and user guidance.
- Custom domain configuration.
- Hosting and production readiness.
- Additional approved integrations.

Do not imply a partnership or endorsement without confirmation.

Domain ownership, DNS configuration, Vercel setup, and production deployment must be independently verified.

Each external service and launch action requires approval.

15. Security and privacy requirements

- Follow root "AGENT.md".
- Keep website code under "web/".
- Do not expose or handle wallet secrets.
- Never add project-owned wallet signing or server-side private-key handling.
- Minimize external scripts, fonts, analytics, and dependencies.
- Review package provenance, maintenance, permissions, and supply-chain risk.
- Use HTTPS in production.
- Do not collect personal data by default.
- Do not transmit wallet addresses to analytics or unrelated services without approved privacy requirements.
- Render untrusted text using safe DOM APIs.
- Validate external URLs and use safe link attributes.
- Preserve the existing read-only RPC proxy's method restrictions. Do not expand the static server or proxy into additional backend functionality implicitly.
- Keep credentials out of source code, examples, bundles, and commits.
- Do not place secrets in browser environment variables or public build output.

Any future backend or data collection requires a separate architecture, privacy, and security review.

16. Performance, accessibility, and testing

Prefer optimized local assets and minimal JavaScript.

Use semantic HTML, accessible names, correct heading order, keyboard-operable controls, visible focus, sufficient contrast, and reduced-motion support.

Testing should include relevant checks from the following list:

- Existing "npm run test:offline" regression tests.
- Website server and route tests.
- Responsive mobile and desktop checks.
- Horizontal overflow checks.
- Navigation and link validation.
- Keyboard accessibility.
- Browser console review.
- Wallet connection tests using mocked providers.
- Error and unavailable-provider handling.
- Security and dependency review.

For changes to balance functionality, test missing accounts, stale data, RPC failures, and incorrect wallet contexts.

For future swaps, use mocked or quote-only tests wherever possible. Never submit a real transaction in automated tests.

Report commands actually run and their exact outcomes.

Do not claim a test, audit, live verification, or wallet compatibility check without performing it.

17. Hosting, domain, and deployment

No hosting platform, preview environment, custom domain, or current production deployment was verified during this handover update. Verify these facts before describing or using them.

GitHub is the source of truth. GitHub Copilot is used for documentation and agent-instruction maintenance. Base44 is currently used for approved website implementation on a separate feature branch based on the approved updated development baseline. Review changes and test results before merging or deployment; owner approval is required before either action.

Before any future launch, verify HTTPS, routing, MIME types, caching, security headers, rollback procedures, domain DNS, TLS, privacy, and maintenance ownership. Do not commit hosting credentials or secrets to the repository.

18. Current status and approved next work

The homepage, wallet capabilities and the Project Information page are implemented as described in sections 7, 8 and 12. The dedicated Risks section was removed at owner instruction. Automated website and offline tests passed during the 2026-11-13 documentation update; the page/navigation change has not been covered by an executed test run — refer to "agent/HANDOVER.md" for exact commands, results, and unverified manual checks.

The page/navigation work was implemented on feature branch `feat/project-information-page`, based on `feat/usol-wallet-theme` commit `b1fb8e8`. Owner review, merge approval, and any deployment remain outstanding.

Swaps, transactions, signing, transfers, payments, and further ecosystem features are not approved by the page/navigation task. Any such feature requires separate approval and appropriate technical/security review.

19. Change management and maintenance

Before editing an existing file, read it completely and inspect its references, callers, routes, and tests.

Keep each change within the approved phase and file scope.

Avoid destructive rewrites, unrelated formatting, and unapproved dependencies.

Review the complete diff for accidental changes to:

- Token configuration.
- Deployment records.
- Deployment and verification tooling.
- Existing website behavior.
- Credentials and secrets.

Whenever an agent completes a significant task or hands work to another agent, update "agent/HANDOVER.md" with verified changes, current status, outstanding work, relevant branch information, and next steps. Keep it concise and factual; preserve prior history and do not claim unverified work as complete.

Keep documentation consistent across:

- "AGENT.md"
- "agent/SKILL.md"
- "agent/WEBSITE_ARCHITECTURE.md"
- "agent/HANDOVER.md"
- "README.md"

Use GitHub as the source of truth.

Only commit, push, merge, publish, or deploy when explicitly authorized. Authorization to commit to a development branch does not authorize merging or production deployment.

When uncertain, stop, report the issue, and request direction.
