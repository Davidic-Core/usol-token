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

Repository ownership

- Canonical upstream: "Snr-Dave/usol-token"
- Canonical integration branch: "fix-website"
- Owner's working fork: "Davidic-core/usol-token"
- Working integration branch: "fix-website"
- Documentation update branch: "docs/v0-vercel-handover"

GitHub is the source of truth for approved repository changes.

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

The homepage includes the Phase Two token information section and the Phase Three wallet panel: Wallet Standard discovery, connect/disconnect, account switching and read-only SOL/USOL balances.

The homepage must not be assumed to contain swap functionality.

Balance reads go through the site's own server-side proxy, `POST /api/rpc`, which accepts only `getBalance` and `getTokenAccountsByOwner`. The upstream Mainnet endpoint is set with the server-side `SOLANA_RPC_URL` or `HELIUS_API_KEY` environment variable; the key is never served to the browser.

Repository constraints

- All website source and website-specific assets belong under "web/".
- Do not modify token deployment scripts, protected configuration, historical deployment records, or verification tooling for website features.
- Root "package.json" remains associated with existing token tooling and the website start command.
- Do not replace the existing architecture with React, TypeScript, or another framework without a separately approved migration proposal.
- Do not add dependencies without justification, approval, and security review.

4. Development tools and workflow

The project uses the following tools:

GitHub

- Source control, repository history, documentation, and code review.
- Canonical repository: "Snr-Dave/usol-token".
- Working fork: "Davidic-core/usol-token".

GitHub Copilot

- Documentation, repository inspection, code assistance, and approved repository tasks.

v0

- Planned primary website development and integration agent.
- Must follow the project's root instructions, architecture, and phase approvals.

Vercel

- Planned preview deployment and hosting platform.
- Preview deployments are used for review and testing.
- Production deployment requires explicit owner approval.

Acode

- Local development, repository cloning, terminal commands, Git operations, and manual testing.

Do not assume that v0 has imported the repository or that Vercel has been configured.

Do not describe Base44 or Bolt.new as the current primary development workflow. Historical references may remain where needed.

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

Recommended mobile-first homepage sections:

1. Header: official logo, UnitedSOLANA identity, accessible navigation.
2. Hero: concise and factual project introduction.
3. Project overview: verified project purpose and status.
4. Token information: network, name, symbol, canonical mint, decimals, and recorded supply.
5. Verification resources: confirmed explorer and official links.
6. Wallet entry point: approved wallet connection functionality when the relevant phase permits it.
7. Risk and transparency: appropriate cryptocurrency risk disclosure.
8. Footer: approved project information and verified links.

Do not invent missing information or use placeholders that could be mistaken for factual claims.

Public pages should remain accessible without connecting a wallet.

8. Navigation and proposed pages

A lightweight single-page navigation is sufficient for the current informational website.

Possible future sections include:

- Home.
- About / Project.
- Token information.
- Ecosystem, when verified content exists.
- Resources, when destinations are confirmed.
- Wallet, subject to approved wallet functionality.

Do not create functional Buy, Trade, Swap, Staking, or Earn routes without separate approval and verified supporting functionality.

Avoid dead links, unverified social accounts, and unsupported partnership claims.

If additional routes are approved, define appropriate not-found behavior and test the server's route allowlist.

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

12. Wallet functionality

Phase Three — Phantom-only connection

Status: Implemented and merged into the working "fix-website" branch.

The branch history includes the merge commit:

"Implement Phantom-only wallet connection phase."

The implementation provides a Phantom-only connection experience, including:

- Provider detection.
- User-initiated connection and disconnection.
- Validated public address display.
- Connection status and error handling.
- Mobile and embedded-browser guidance.

Automated and mock verification was previously reported. Successful real-device Phantom connection and disconnection testing has not been confirmed.

Do not claim additional testing unless performed.

Phase Three does not include:

- SOL or USOL balance display.
- Transaction signing.
- Message signing.
- Token transfers.
- Swaps.
- Payments.
- Transaction submission.

Additional wallet providers

Solflare, Backpack, and other Wallet Standard providers may be considered in a separate approved increment.

Do not describe the existing Phase Three implementation as multi-wallet support.

Future wallet experience

A prominent homepage wallet entry point and a dedicated wallet dashboard may be proposed for a later phase.

Any such work must preserve non-custodial behavior, privacy, and user-controlled wallet approval.

13. Phase Four — Read-only wallet balances

Status: Proposed, not implemented.

Potential functionality:

- Display the connected wallet's SOL balance.
- Display its USOL token balance.
- Provide loading, disconnected, unavailable, and error states.
- Refresh balances safely.
- Clearly identify the connected wallet.

Balance retrieval must be read-only.

The implementation must account for missing token accounts, RPC failures, stale data, and incorrect wallet/network contexts.

No transaction signing, transfers, swaps, or payments are authorized by this phase.

A separate owner approval is required before implementation.

14. Phase Five — USOL swap integration

Status: Proposed, not implemented.

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

This phase requires a separate technical and security review and explicit owner approval.

No real transaction may be submitted as part of automated testing.

15. Phase Six — Ecosystem and launch readiness

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

16. Security and privacy requirements

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
- Do not turn the existing static server into a backend implicitly.
- Keep credentials out of source code, examples, bundles, and commits.
- Do not place secrets in browser environment variables or public build output.

Any future backend or data collection requires a separate architecture, privacy, and security review.

17. Performance, accessibility, and testing

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

For future balance functionality, test missing accounts, stale data, RPC failures, and incorrect wallet contexts.

For future swaps, use mocked or quote-only tests wherever possible. Never submit a real transaction in automated tests.

Report commands actually run and their exact outcomes.

Do not claim a test, audit, live verification, or wallet compatibility check without performing it.

18. Hosting, domain, and deployment

Vercel is the planned preview and hosting platform. Its actual project configuration, repository permissions, environment variables, custom domain, and production deployment status must be verified before being described as active.

The intended workflow is:

1. Work in the "Davidic-core/usol-token" fork.
2. Use a dedicated development branch for substantial website work.
3. Use v0 for approved implementation and integration.
4. Use Vercel preview deployments when configured.
5. Test the preview on mobile and desktop.
6. Review the complete diff and test results.
7. Merge approved work into "Davidic-core/fix-website".
8. Transfer approved changes to "Snr-Dave/fix-website" only with explicit owner authorization.
9. Deploy to production only after separate explicit owner approval.

A preview deployment is not a production deployment.

Before launch, verify HTTPS, routing, MIME types, caching, security headers, rollback procedures, domain DNS, TLS, privacy, and maintenance ownership.

Do not commit hosting credentials or secrets to the repository.

19. Development phases and acceptance criteria

Each phase requires separate approval before implementation.

Phase One — Public website foundation

Status: Completed.

Responsive homepage and wallet-page foundation.

Phase Two — Token information

Status: Completed.

Token information, branding, navigation improvements, copy functionality, and Solscan links.

Phase Three — Phantom-only connection

Status: Implemented and merged into the working "fix-website" branch.

The phase is connection-only. Real-device testing remains unconfirmed.

Phase Four — Read-only balances

Status: Proposed, not implemented.

Acceptance criteria must include accurate wallet identification, SOL and USOL balance retrieval, unavailable/error states, read-only behavior, and regression tests.

Phase Five — Swaps

Status: Proposed, not implemented.

Acceptance criteria must include verified routes, quote handling, clear fees and slippage, transaction previews, explicit wallet approval, error handling, and security review.

Phase Six — Ecosystem and launch readiness

Status: Proposed, not implemented.

Acceptance criteria must include verified resources, approved content, operational ownership, hosting/domain verification, accessibility and security review, and explicit production approval.

A phase may be subdivided into smaller increments. Approval for one increment does not authorize the remaining phase or the next phase.

20. Change management and maintenance

Before editing an existing file, read it completely and inspect its references, callers, routes, and tests.

Keep each change within the approved phase and file scope.

Avoid destructive rewrites, unrelated formatting, and unapproved dependencies.

Review the complete diff for accidental changes to:

- Token configuration.
- Deployment records.
- Deployment and verification tooling.
- Existing website behavior.
- Credentials and secrets.

After each approved phase, update documentation with the actual status, completed criteria, changed files, tests, decisions, limitations, and next proposed work.

Keep documentation consistent across:

- "AGENT.md"
- "agent/SKILL.md"
- "agent/WEBSITE_ARCHITECTURE.md"
- "agent/HANDOVER.md"
- "README.md"

Use GitHub as the source of truth.

Only commit, push, merge, publish, or deploy when explicitly authorized. Authorization to commit to a development branch does not authorize merging or production deployment.

When uncertain, stop, report the issue, and request direction.
