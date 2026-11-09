Website Handover — UnitedSOLANA

Recorded: 2026-11-09

This document records the current website project status and where development should resume. It does not override "AGENT.md", "agent/SKILL.md", "agent/WEBSITE_ARCHITECTURE.md", or "agent/V0_INSTRUCTIONS.md". The root "AGENT.md" remains the highest authority.

1. Current status

Phase| Status
Phase 0 — Discovery and architecture| Complete
Phase 1 — Public website foundation| Complete
Phase 2 — Token information and design refinements| Complete
Phase 3 — Phantom-only wallet connection| Implemented and merged/synchronised into the working fork's "fix-website" branch, according to the owner
Phase 4 — Read-only wallet balances| Proposed; not implemented or approved
Phase 5 — Token swaps| Proposed; not implemented or approved
Phase 6 — Ecosystem and launch readiness| Future proposal

Multi-wallet support (Solflare, Backpack and Wallet Standard) remains deferred.

Phase Three supports Phantom connection and disconnection only. It does not authorize message signing, transaction signing, transfers, payments, purchases, sales or swaps.

2. Repository and branch workflow

- Canonical upstream: "Snr-Dave/usol-token".
- Owner's working fork: "Davidic-core/usol-token".
- Working integration branch: "fix-website" in the owner's fork.
- Current documentation branch: "docs/v0-vercel-handover" in the owner's fork.
- v0 is the planned website implementation agent.
- GitHub is the source of truth.
- Vercel is intended for preview builds and hosting.
- Acode is available for local Git operations and testing.
- Copilot may assist with repository and documentation work.

The documentation updates and v0 instructions are being prepared on "docs/v0-vercel-handover".

Do not assume a branch has been merged or deployed unless its actual GitHub history or deployment status has been checked. No production deployment is authorized by this handover.

3. Existing website implementation

The website uses a dependency-free HTML, CSS and JavaScript architecture.

Public homepage

- "web/index.html" — project homepage and token information.
- "web/styles.css" — responsive visual styling.
- "web/server.js" — static development server and explicit routes.
- "web/nav.js" — mobile navigation.
- "web/token.js" — mint-address copy functionality.
- "web/assets/brand/usol-logo.png" — approved logo.

Phantom connection page

- "web/wallet.html" — Phantom connection page at "/wallet", unlinked and "noindex".
- "web/wallet.css" — wallet page styling.
- "web/wallet-core.js" — address validation, deep-link and error helpers.
- "web/app.js" — Phantom provider detection, connection and disconnection.
- "web/tests/server.test.js" — website route, security and markup tests.
- "web/tests/wallet.test.js" — wallet helper tests.

Phase Three included provider detection, trusted-session restoration, address validation, connection and disconnection feedback, provider event handling, accessibility improvements and mobile/embedded-browser guidance.

4. Token protection

The existing UnitedSOLANA token is already deployed on Solana Mainnet.

- Name: UnitedSOLANA
- Symbol: USOL
- Mint: "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG"
- Decimals: 9
- Initial supply: 1,000,000,000 USOL
- Mint authority: revoked
- Freeze authority: revoked

Token configuration, deployment records, metadata and verification tooling are protected. Website agents must not modify them.

Do not invent prices, liquidity, trading volume, market capitalization, exchange listings, partnerships, audits or utilities.

5. Recorded verification

The previous Phase Three handover recorded these results:

Test| Recorded result
"node --test web/tests/server.test.js web/tests/wallet.test.js"| 19/19 passed
"npm run test:offline"| 14/14 passed

These are historical recorded results, not a claim that the tests were rerun during this documentation update.

Automated preview checks recorded successful homepage and embedded wallet-page checks. A real Phantom connection on a physical device was not verified.

Manual Phantom testing remains outstanding:

- Desktop Phantom extension connection and disconnection.
- Account-change behaviour.
- Phantom in-app browser testing on a phone.
- Manual clipboard copy check.
- Accessibility testing with keyboard and assistive technology.

6. v0 implementation workflow

Before starting implementation, v0 must read:

1. "AGENT.md"
2. "agent/SKILL.md"
3. "agent/WEBSITE_ARCHITECTURE.md"
4. "agent/HANDOVER.md"
5. "agent/V0_INSTRUCTIONS.md"

The v0 guide defines implementation responsibilities, scope restrictions and credit-conscious working rules.

The documentation branch is not the website implementation branch.

Before website implementation:

1. Confirm the current repository and branch.
2. Obtain owner approval for the specific implementation task.
3. Use a separate development branch.
4. Make only the requested changes.
5. Test and review the changes.
6. Use Vercel preview for review when configured.
7. Obtain approval before merging into "Davidic-core/fix-website".
8. Obtain separate approval before transferring changes to "Snr-Dave/usol-token".
9. Obtain explicit approval before production deployment.

7. Rules that always apply

- Keep website source and assets inside "web/".
- Preserve working functionality unless an approved change requires otherwise.
- Never request, store or transmit seed phrases or private keys.
- Never introduce custodial wallet functionality or server-side signing.
- Do not implement balances, signing, swaps, transfers or payments without separate approval.
- Do not modify token deployment, authority, metadata or verification records.
- Do not commit, push, merge, publish or deploy without explicit approval.
- Report test results honestly and identify anything not verified.
- Keep implementation small and avoid unnecessary credit usage.

8. Next starting point

The immediate task is to finish reviewing the documentation updates on "docs/v0-vercel-handover".

After the documentation is reviewed and approved, merge it into the owner's "fix-website" branch only with explicit approval.

Then prepare the v0 project using the approved working branch and a separate development branch.

No new website implementation, token transaction capability or production deployment is authorized merely by this handover.
