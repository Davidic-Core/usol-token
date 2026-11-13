Website Implementation Instructions — UnitedSOLANA

This file is retained for useful implementation, safety, and scope guidance from the earlier v0 workflow. It does not require the use of v0. Base44 is currently used for website implementation; these rules apply to Base44, other owner-approved tools, and human developers.

1. Purpose

You are an implementation agent working on the UnitedSOLANA (USOL) website.

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

- Verified working repository: "davidcloud001/usol-token", a fork of canonical upstream "Snr-Dave/usol-token".
- Verify the actual repository, remotes, and current branch before every task; old branch names are not authoritative.
- Website implementation must use a separate feature branch based on the approved updated development baseline, not a documentation branch.
- GitHub is the source of truth. Changes must be reviewed before merging or deployment.
- Do not commit, push, merge, publish, or deploy without explicit owner approval.

4. Preserve the existing project

- Inspect existing files before editing.
- Preserve the existing website design, functionality, and architecture unless a change is requested.
- Keep website source and assets inside "web/".
- Follow the existing dependency-free HTML, CSS and JavaScript architecture.
- Do not introduce frameworks, dependencies, services, or major architectural changes without approval.
- Do not rebuild existing features unnecessarily.

The approved next website task is documented in "agent/WEBSITE_ARCHITECTURE.md" and "agent/HANDOVER.md": keep Overview on the homepage and move detailed Token, Principles, Transparency, and Risks content to a dedicated Project Information page. The task is approved but not yet implemented.

5. USOL security and accuracy

The USOL token already exists on Solana Mainnet.

Never:

- Create another token or mint.
- Change token authorities, metadata, supply, or deployment records.
- Request or handle seed phrases, private keys, or keypair files.
- Implement custodial wallet functionality or server-side signing.
- Invent token prices, market capitalization, liquidity, trading volume, listings, partnerships, audits, or utilities.

Wallet connections must remain non-custodial. The existing site supports Solana Wallet Standard discovery, Phantom and Solflare injected fallbacks, connection and disconnection, account-change handling, and read-only SOL/USOL balances through a restricted RPC proxy. See the handover for test and manual-verification status.

Existing wallet support does not authorize signing, transfers, swaps, purchases, sales, or payments. Any new transaction or wallet functionality requires separate owner approval.

6. Focused implementation

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

Whenever you complete a significant task or hand work to another agent, update "agent/HANDOVER.md" with verified changes, current status, outstanding work, relevant branch information, and next steps. Keep the handover concise and factual, preserve its prior history, and never claim unverified work as complete.

8. Approval requirements

The owner controls all implementation and release decisions.

Do not commit, push, merge, publish, or deploy without the required explicit approval.

Do not make token, wallet-security, payment, or production configuration changes without separate approval.

Default rule: implement only what was requested, preserve what already works, avoid unnecessary tool or service usage, and stop when the approved task is complete.
