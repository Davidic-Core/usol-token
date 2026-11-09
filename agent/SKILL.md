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
- Canonical integration branch: "fix-website"
- Owner's working fork: "Davidic-core/usol-token"
- Working integration branch: "fix-website"
- Documentation update branch: "docs/v0-vercel-handover"

GitHub is the source of truth for repository files, branches, commits, and approved changes.

Never assume changes in the working fork have automatically reached the canonical repository.

Development tools and responsibilities

GitHub

- Source control, documentation, branch management, code review, and version history.
- Approved changes are reviewed before merging or publishing.

GitHub Copilot

- Repository inspection, documentation updates, code assistance, and specifically authorized repository tasks.
- Must follow the user's exact file, branch, and publishing authorization.
- Must not infer permission to modify website code from a documentation-only request.

v0

- Planned primary website development and integration agent.
- May be used for approved website design, implementation, and integration tasks after repository access is configured.
- Must follow root instructions, architecture documentation, and phase approval gates.
- Must not independently expand scope, change protected token tooling, or publish unapproved work.

Vercel

- Planned website preview and hosting platform.
- Preview deployments are for review and testing.
- Production deployment requires separate explicit approval.

Acode

- Local development, terminal commands, Git operations, code inspection, and manual testing.
- May be used to clone the working fork and perform local development when needed.

Do not describe Base44 or Bolt.new as the current primary website development workflow. Historical references may remain where necessary to explain earlier project decisions.

Do not assume v0 has imported the repository, Vercel is configured, or production hosting is active until verified.

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

v0

v0 is the planned primary website development and integration agent.

When assigned a task, it must:

- Inspect the actual repository and relevant files before proposing changes.
- Follow "AGENT.md", this manual, "WEBSITE_ARCHITECTURE.md", and "HANDOVER.md".
- Confirm the correct repository and branch.
- Use a dedicated development branch for substantial feature work.
- Preserve the existing static website architecture unless a migration is separately approved.
- Avoid modifying token deployment and verification tooling.
- Implement only the approved scope.
- Report changed files, tests, limitations, and security considerations.

v0 must not assume that permission to build a preview includes permission to merge or deploy to production.

GitHub Copilot

Copilot is used for documentation, repository assistance, code review, and explicitly authorized code tasks.

It must not independently rebuild the website or expand a documentation-only task into code changes.

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

6. Current project phases and status

The phase status below reflects the project handover dated 2026-11-09. The latest verified branch history and owner-confirmed status take precedence over older descriptions.

Phase One — Website foundation

Status: Completed.

Responsive public homepage and existing Phantom wallet page foundation.

Phase Two — Token information and branding

Status: Completed.

Token information section, navigation improvements, branding, mint-address copy functionality, and Solscan links.

Phase Three — Phantom wallet connection

Status: Implemented and merged into the working "fix-website" branch.

The GitHub branch history contains a merge commit titled:

"Implement Phantom-only wallet connection phase."

This phase is limited to Phantom wallet connection and disconnection, validated public-address display, connection states, and error handling.

Verification distinction:

- Automated and mocked verification was previously reported.
- A successful real-device Phantom connection and disconnection test has not been confirmed.
- Do not claim new tests were run unless actually executed.

Phase Three does not implement balances, signing, transfers, swaps, payments, or transaction submission.

Phase Four — Wallet balances

Status: Proposed, not implemented.

Potential scope:

- Prominent homepage wallet entry point.
- Phantom connection, with any additional wallet providers separately assessed and approved.
- Read-only SOL balance display.
- Read-only USOL token balance display.
- Loading, disconnected, unavailable, and error states.

This phase requires separate owner approval before implementation.

Phase Five — USOL swaps

Status: Proposed, not implemented.

Potential scope:

- SOL-to-USOL swaps.
- USOL-to-SOL swaps.
- Investigation of Jupiter integration and verified swap routes.
- Transaction previews, wallet approval, slippage handling, and error states.

Requires a separate technical and security review and explicit owner approval.

Do not claim USOL swaps are currently functional or available.

Phase Six — Ecosystem and launch readiness

Status: Proposed, not implemented.

Potential scope:

- Verified ecosystem content.
- Official social links and project information.
- Documentation and user guidance.
- Domain configuration.
- Hosting and launch readiness.
- Further integrations after approval.

Do not invent completed features, domain ownership, hosting status, or live integrations.

A phase may be divided into smaller approved increments. No phase automatically authorizes the next one.

7. Website architecture and repository safety

All website source code and website-specific assets must remain under "web/".

The existing website is a static, dependency-free vanilla HTML/CSS/JavaScript application.

Preserve this architecture unless the user separately approves a migration proposal.

The existing public homepage and "/wallet" route must be inspected before modification. Do not assume the homepage already contains wallet balances or swap functionality.

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

Phase Three is Phantom-only and connection-only.

Its scope includes:

- Phantom provider detection.
- User-initiated connection and disconnection.
- Validated public wallet address display.
- Connection status and understandable error states.
- Mobile and embedded-browser guidance.

Other wallet providers, including Solflare and Backpack, require a separately reviewed and approved increment.

Balance display is not part of Phase Three. It is proposed for Phase Four.

Transaction signing, message signing, transfers, swaps, payments, and transaction submission are not part of Phase Three or Phase Four.

Any later transaction feature requires a separate proposal, security review, and explicit approval consistent with root "AGENT.md".

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

For future balance functionality, use read-only data retrieval and test unavailable RPC responses, missing token accounts, stale values, and errors.

For future swap functionality, use mock or quote-only tests where possible. Never submit real transactions during automated tests.

Do not claim a test passed unless it was executed. Do not claim live Mainnet verification based only on fixtures.

11. GitHub, v0, and Vercel workflow

The intended workflow is:

1. Start from the "Davidic-core/usol-token" working fork.
2. Confirm the correct branch before editing.
3. Use dedicated development branches for substantial changes.
4. Use v0 for approved website implementation and integration.
5. Use Vercel preview deployments when configured.
6. Review the preview on mobile and desktop.
7. Run appropriate tests and inspect the complete diff.
8. Merge approved work into "Davidic-core/fix-website".
9. Transfer approved changes to "Snr-Dave/fix-website" only after explicit owner authorization.
10. Deploy to production only after separate explicit approval.

Do not assume v0 repository access, Vercel configuration, environment variables, domain ownership, or production deployment exists until verified.

A preview deployment is not production approval.

Never allow experimental changes to overwrite the canonical production branch.

12. Documentation and handover

Keep documentation useful to a new agent without prior conversation history.

After an approved phase, update only documentation files authorized by the user.

Record:

- Phase name and status.
- Objective and acceptance criteria.
- Actual files changed.
- Actual test commands and results.
- Decisions and verified sources.
- Security/privacy review.
- Known limitations and unresolved questions.
- Next proposed phase, clearly marked as not authorized.

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
