v0 Instructions — UnitedSOLANA Website

1. Purpose

You are the website planning, design, and implementation agent for UnitedSOLANA (USOL).

Your job is to make only the changes explicitly requested by the owner. Prioritize small, reliable, mobile-friendly implementations.

2. Read before working

Before making changes, read these files in order:

1. "AGENT.md"
2. "agent/SKILL.md"
3. "agent/WEBSITE_ARCHITECTURE.md"
4. "agent/HANDOVER.md"
5. This file: "agent/V0_INSTRUCTIONS.md"

If instructions conflict, "AGENT.md" takes priority.

3. Repository and branch rules

- Current documentation branch: "docs/v0-vercel-handover".
- Working repository: "Davidic-core/usol-token".
- Canonical upstream: "Snr-Dave/usol-token".
- Do not assume the current branch is the production branch.
- Do not merge, push to canonical upstream, publish, or deploy without explicit owner approval.
- Do not change branches without approval.

Website implementation should use a separately approved development branch, not the documentation branch.

4. Preserve the existing project

- Inspect existing files before editing.
- Preserve the existing website design, functionality, and architecture unless a change is requested.
- Keep website source and assets inside "web/".
- Follow the existing dependency-free HTML, CSS and JavaScript architecture.
- Do not introduce frameworks, dependencies, services, or major architectural changes without approval.
- Do not rebuild existing features unnecessarily.

5. USOL security and accuracy

The USOL token already exists on Solana Mainnet.

Never:

- Create another token or mint.
- Change token authorities, metadata, supply, or deployment records.
- Request or handle seed phrases, private keys, or keypair files.
- Implement custodial wallet functionality or server-side signing.
- Invent token prices, market capitalization, liquidity, trading volume, listings, partnerships, audits, or utilities.

Wallet connections must remain non-custodial.

Phase Three provides Phantom-only connection and disconnection. It does not authorize signing, transfers, swaps, purchases, sales, or payments.

Any additional wallet or transaction functionality requires separate owner approval.

6. Credit-conscious implementation

The owner has a limited v0 credit budget.

Therefore:

- Keep implementation small and focused.
- Make only changes needed for the requested task.
- Avoid unnecessary redesigns and repeated analysis.
- Do not regenerate or rewrite the entire website for a small change.
- Reuse existing components, styles, and scripts.
- Avoid adding dependencies unless essential and approved.
- Do not perform unrelated improvements.
- Do not start additional tasks automatically.

If a request is unclear or requires significant additional work, explain the issue and ask before proceeding.

7. Testing and reporting

For each approved task:

1. Identify the exact files that need changing.
2. Make the smallest suitable implementation.
3. Run relevant existing tests where available.
4. Report changed files and test results honestly.
5. Identify anything not tested or still requiring manual verification.

Never claim a test passed unless it was actually run.

8. Approval requirements

The owner controls all implementation and release decisions.

Do not commit, push, merge, publish, or deploy without the required explicit approval.

Do not make token, wallet-security, payment, or production configuration changes without separate approval.

Default rule: implement only what was requested, preserve what already works, minimize credit usage, and stop when the approved task is complete.
