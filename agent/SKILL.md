UnitedSOLANA (USOL) Website Development Operating Manual

1. Authority, purpose, and scope

This manual guides AI agents assigned to plan, review, document, or develop the UnitedSOLANA (USOL) website. It is written to be usable without prior conversation history.

The website's purpose is to provide an official, clear, accessible source of information about the existing UnitedSOLANA project and, over time, a carefully governed entry point to approved ecosystem experiences.

Growth is not automatic authorization to add functionality.

The root ""AGENT.md"" (../AGENT.md) is the highest-authority project instruction. Read it first and follow it at all times. This manual and ""WEBSITE_ARCHITECTURE.md"" (WEBSITE_ARCHITECTURE.md) are subordinate. If an instruction, feature, or implementation conflicts with the root rules, stop, describe the conflict, and request direction.

This repository also contains token verification/deployment records and CLI tooling. The website must remain isolated under "web/". Never change token configuration, deployment history, verification tooling, or retired token utilities to accommodate a website feature.

2. Repository ownership and development tools

Repository ownership

- Canonical upstream: "Snr-Dave/usol-token"
- Verified working repository: "davidcloud001/usol-token", a fork of "Snr-Dave/usol-token".
- The GitHub default branch observed on 2026-11-13 is "feat/usol-wallet-theme".
- Verify current remotes and branch for each task; do not rely on outdated names or assume an integration branch.

GitHub is the source of truth for repository files, branches, commits, reviews, and approved changes. Never assume that changes in a working fork have reached the canonical upstream.

Development tools and responsibilities

- GitHub Copilot is used for project documentation and agent-instruction maintenance.
- Base44 is currently used for website implementation. Implementation must use a separate feature branch based on the approved updated development baseline.
- Review changes before merging or deployment; obtain owner approval before either action.
- Older references to v0, Vercel, or Acode are historical unless independently verified as current. Do not assume hosting or preview deployment is configured.

3. Mandatory cold-start workflow

At the beginning of every new assignment, without relying on prior conversation history:

1. Read the root "AGENT.md" completely.
2. Read "agent/SKILL.md" completely.
3. Read "agent/WEBSITE_ARCHITECTURE.md" completely.
4. Read "agent/HANDOVER.md" completely.
5. Inspect the repository structure and relevant website files under "web/".
6. Identify the current branch, repository, project phase, and verified implementation status.
7. Identify the exact scope and authorization provided by the user.
8. Report your understanding, proposed actions, affected files, tests, and risks.
9. Work only within the approved scope.
10. Review the final changes and report actual results.
11. Stop at the approval gate and wait for further authorization.

The handover records current project status, known limitations, verified commits and branches, test results, and the next recommended starting point. It must not contradict root instructions.

If a required file cannot be retrieved completely, report the limitation. Do not claim to have read or reviewed a complete file when only partial or elided content was available.

Before implementation, the user-facing plan must identify the objective, in-scope and out-of-scope features, deliverables, likely affected files, test plan, dependencies, risks, and any root-instruction conflict.

A roadmap is not authorization to implement every roadmap item.

4. Roles and responsibilities

Website development agent

The assigned website development agent is responsible for inspecting the actual repository, understanding the approved scope, proposing a plan, implementing only authorized work, testing it, reviewing the diff, and reporting results.

The agent must preserve existing work and stop at approval gates.

Website implementation agent

Base44 is currently used for approved website implementation. Any implementation agent or developer must inspect the actual repository and relevant files, follow "AGENT.md", this manual, "WEBSITE_ARCHITECTURE.md", and "HANDOVER.md", confirm the current repository and branch, work on a separate feature branch based on the approved updated development baseline, preserve the static architecture unless migration is separately approved, protect token tooling, and implement only the approved scope.

"agent/V0_INSTRUCTIONS.md" retains useful implementation and security rules from the earlier v0 workflow. It is not a requirement to use v0; read it as general website implementation guidance, including when using Base44 or another owner-approved workflow.

GitHub Copilot

Copilot is used for project documentation and agent-instruction maintenance. It must not independently implement website changes or expand a documentation-only task into code changes.

User

The user owns project decisions, feature scope, phase approvals, and publishing authorization.

No agent may infer approval from a roadmap, previous phase, or silence.

5. Phase planning and approval cycle

Every phase follows this cycle:

Plan

- Inspect existing implementation and current behavior.
- Define objective and measurable acceptance criteria.
- Identify affected files, dependencies, security/privacy implications, and tests.
- Request approval.

Implement

- Start only after approval.
- Make the smallest coherent changes within authorized paths.
- Do not silently add features, dependencies, analytics, backend services, or external integrations.
- Preserve existing functionality.

Test

- Run suitable checks actually available in the repository.
- Keep offline tests independent of live blockchain services.
- Never use real transactions as tests.
- Distinguish test failures, tests not run, and manual review.

Review

- Inspect the complete diff.
- Check for scope creep, secrets, accidental protected-file changes, accessibility issues, and regressions.
- Compare results with acceptance criteria.

Approval gate

- Report the work and wait for the user's decision.
- Do not begin the next phase without explicit authorization.

6. Current project status

The homepage (`/`) contains the Overview section and the existing wallet panel, which supports Wallet Standard-based discovery, Phantom and Solflare injected fallbacks, connection and disconnection, account-change handling, read-only SOL/USOL balances, and a restricted server-side RPC proxy. The Project Information page (`/project-information`) contains Token, Principles, and Transparency. The dedicated Risks section has been removed from the website. See "agent/HANDOVER.md" for code references, exact test results, and manual/live checks that remain unverified.

The owner-approved Project Information page is implemented on the feature branch `feat/project-information-page` (Base44 working branch `project-information-page`, based on `feat/usol-wallet-theme` commit `b1fb8e8`). The page at `/project-information` contains three sections — Token (`#token`), Principles (`#principles`) and Transparency (`#transparency`) — while Overview stays on the homepage. The dedicated Risks section was removed from the website at owner instruction, along with its navigation entry and links. Navigation destinations, section anchors, and browser-history behavior are documented in "agent/WEBSITE_ARCHITECTURE.md" section 8 and "agent/HANDOVER.md".

Signing, transactions, swaps, transfers, payments, and other features remain unapproved unless separately authorized. Do not treat the page/navigation task as approval for them.

7. Website architecture and repository safety

All website source code and website-specific assets must remain under "web/".

The existing website is a static, dependency-free vanilla HTML/CSS/JavaScript application.

Preserve this architecture unless the user separately approves a migration proposal.

The existing public homepage contains the wallet connection panel and read-only SOL/USOL balances, served through the local `POST /api/rpc` proxy. Inspect it before modification. Do not assume the homepage contains swap functionality.

Keep website code and configuration separate from:

- Root token scripts.
- "config/".
- "deployments/".
- Token verification tooling.
- Retired token utilities.

Do not replace the root "package.json" purpose or introduce a second frontend toolchain without approval.

Before editing, inspect the target file and its references. Use narrow, reviewable changes. Never edit files outside the authorized scope.

Never commit credentials, seed phrases, private keys, access tokens, or other secrets.

8. Wallet functionality and security boundaries

The current website supports Solana Wallet Standard discovery, injected Phantom and Solflare fallbacks, user-initiated connection and disconnection, validated public address display, account-change handling, and read-only SOL/USOL balances through a restricted server-side RPC proxy. See "agent/HANDOVER.md" for code references, exact automated test results, and manual/live testing that remains unverified.

Other compatible Wallet Standard Solana wallets may be discovered. Do not claim a provider's real-world compatibility without testing. No Backpack-specific integration is present in the inspected code.

The current wallet flow does not sign messages or transactions, transfer tokens, execute swaps, or process payments. Any such capability requires a separate proposal, technical/security review, and explicit approval consistent with root "AGENT.md".

Never request, collect, store, or transmit seed phrases or private keys. Never sign using project-owned private keys or add server-side signing.

Connecting a wallet does not authorize a transaction.

9. Accuracy, transparency, and privacy

Never invent token prices, market capitalization, trading volume, liquidity, exchange listings, partnerships, audits, or project utilities.

Clearly distinguish pinned project facts, live on-chain information, third-party market information, and estimates.

When displaying external or live data, identify its source and last-checked time where appropriate.

Do not promise returns or present estimates as guaranteed outcomes.

Minimize collection of personal data. Do not transmit wallet addresses to analytics or unrelated services without a separately approved privacy design.

10. Testing and verification

Preserve existing repository tests and configuration.

Keep offline tests independent of live blockchain services. Add website-specific tests where appropriate.

Never perform real transactions in automated tests.

For website changes, testing may include:

- Existing offline regression tests.
- Website server and route tests.
- Responsive mobile and desktop checks.
- Keyboard navigation and visible focus.
- Link and navigation checks.
- Browser console review.
- Wallet-provider tests using mocks.
- Security and dependency review.

For changes to balance functionality, use read-only data retrieval and test unavailable RPC responses, missing token accounts, stale values, and errors.

For any separately approved swap functionality, use mock or quote-only tests where possible. Never submit real transactions during automated tests.

Do not claim a test passed unless it was executed. Do not claim live Mainnet verification based only on fixtures.

11. GitHub, Copilot, and Base44 workflow

1. Verify the current repository, remotes, branch, and worktree before editing.
2. Use GitHub as the source of truth and GitHub Copilot for documentation and agent-instruction maintenance.
3. Use Base44 for approved website implementation on a separate feature branch based on the approved updated development baseline.
4. Review the complete diff and actual test results before merging or deployment.
5. Obtain explicit owner approval before merge or deployment. Do not commit or push without explicit authorization.

Do not assume an integration branch, preview environment, hosting provider, credentials, domain, or production deployment is configured. Verify current facts before use. A preview, if later configured and approved, is not production approval.

12. Documentation and handover

Keep documentation useful to a new agent without prior conversation history.

Whenever an agent completes a significant task or hands work to another agent, it must update "agent/HANDOVER.md" with verified changes, current status, outstanding work, relevant branch information, and next steps. Keep the handover concise and useful, preserve earlier history, and do not claim unverified work as complete.

Record actual files changed, test commands/results, decisions and verified sources, security/privacy review, limitations, unresolved questions, and next steps. Clearly distinguish approved work from proposals.

Keep phase status consistent across "AGENT.md", "SKILL.md", "WEBSITE_ARCHITECTURE.md", "HANDOVER.md", and "README.md".

Never invent commit hashes, test results, approvals, deployments, or external verification.

13. Publishing and completion reports

Do not commit, push, merge, publish, or deploy without explicit user approval.

An explicit authorization to commit to a named branch permits that commit only. It does not authorize merging, pushing to another repository, or production deployment.

After a development task, report:

- Objective and approved scope.
- Files created or modified.
- Functionality implemented.
- Actual test commands and results.
- Remaining issues and security considerations.
- Whether live verification was performed.
- Whether any blockchain transaction occurred.
- Commit, branch, and deployment details where applicable.

If a required file cannot be read completely, stop and report the limitation.

This manual does not override root "AGENT.md". If requirements conflict, root instructions win.
