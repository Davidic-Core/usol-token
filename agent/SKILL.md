# UnitedSOLANA (USOL) Website Development Operating Manual

## 1. Authority, purpose, and scope

This manual guides any AI agent assigned to plan or develop the UnitedSOLANA (USOL) website, including Base44 Agent. It is written to be usable without prior conversation history.

The website's purpose is to be the official, clear, accessible source of information about the existing UnitedSOLANA project and, over time, a carefully governed entry point to approved ecosystem experiences. Its long-term vision is a trustworthy, mobile-first website that can grow in independently reviewed phases. Growth is not automatic authorization to add functionality.

The root [`AGENT.md`](../AGENT.md) is the highest-authority project instruction. Read it first and follow it at all times. This manual and [`WEBSITE_ARCHITECTURE.md`](WEBSITE_ARCHITECTURE.md) are subordinate. If an instruction, feature, or implementation conflicts with the root rules, stop, describe the conflict, and request direction; do not weaken or silently override the root rules. Do not edit the root `AGENT.md` to make a feature possible.

This repository is also the home of token verification/deployment records and CLI tooling. The website must remain isolated under `web/`; never change token configuration, deployment history, verification tooling, or retired token utilities to accommodate a website feature.

## 2. Roles and responsibilities

### Website development agent

The agent (including Base44 Agent when assigned implementation) is responsible for the phase explicitly authorized by the user: inspect the actual project, explain its understanding and plan, implement only the approved scope, test it, and report results and remaining work. It must preserve existing work, follow project documentation, and stop at every approval gate.

### Base44 Agent

Base44 Agent is the primary agent for website planning, design, and implementation when the user assigns it those tasks. It must follow the same repository instructions and phase approvals as any other developer. It must not assume it can access GitHub files. Before claiming to have read a file, it must either obtain the file contents from the user or use a verified GitHub integration to retrieve the exact repository and branch contents. If neither is available, request the needed documents or access and state what remains unread. Do not present an assumption as repository inspection.

### GitHub Copilot

GitHub Copilot is the documentation and repository-assistance agent. It can inspect repository files, explain architecture, help refine plans, and make user-authorized documentation or repository changes. It is not the independent primary website builder and must not independently build or rebuild the website. It must not infer authorization to code, install dependencies, or change website files from a request to document or plan. It must respect the user's authorized file scope and publishing instructions.

### User and GitHub

The user owns scope decisions and phase approvals. GitHub is the source-control record for approved documentation and code. A commit, push, merge, or deployment is not implied by approval to implement; obtain explicit authorization for the relevant publishing action. Do not merge to a protected/default branch or deploy unless explicitly approved.

## 3. Mandatory cold-start workflow

At the beginning of every new assignment, with no reliance on prior conversation context:

1. Read the root `AGENT.md` first.
2. Read `agent/SKILL.md`.
3. Read `agent/WEBSITE_ARCHITECTURE.md`, then `agent/HANDOVER.md`. The handover is the authoritative record of the current phase status, verified commit and branch, actual test results, known limitations, and the exact point where work resumes. Read it before proposing any work; if it conflicts with the root rules or `SKILL.md`, those documents win.
4. Inspect the repository structure and existing website files under `web/`; read existing files before proposing replacements or moves.
5. Identify the current phase, its written objectives, accepted deliverables, and any explicit authorization from the user. If the phase or scope is unclear, ask before implementation.
6. Report your understanding of the instructions, current state, proposed actions, affected files, tests, and risks. State any documents you could not verify access to.
7. Work only on the phase and files explicitly authorized by the user. A roadmap is not approval for all roadmap items.
8. Implement and test only that phase, preserving unrelated files and existing tests.
9. Report completed work, exact changed files, actual test commands and results, outstanding items, and security considerations.
10. Stop. Wait for explicit user approval before planning or starting the next phase.

At the start of a phase, the user-facing plan must identify objective, in-scope/out-of-scope features, deliverables, files likely to change, test plan, dependencies, risks, and any root-instruction conflict. Do not begin implementation until the user approves that phase. Approval to implement does not authorize commit, push, merge, publication, or deployment unless those actions are explicitly included.

## 4. Phase planning, implementation, testing, and review

Every phase follows this controlled cycle:

- **Plan:** State the phase objective and measurable acceptance criteria. Inspect relevant files and current behavior. Identify scope boundaries, security/privacy implications, dependencies, migration or compatibility concerns, and tests. Ask for approval.
- **Implement:** After approval, make the smallest coherent changes within authorized paths. Do not silently add features, dependencies, analytics, backend services, or external integrations. Do not overwrite or delete existing files without inspection and explicit scope. Prefer additive changes and preserve existing behavior unless replacement is approved.
- **Test:** Run suitable checks actually available in the repository. Keep the existing offline test suite intact and independent of live blockchain services. Never use real transactions as tests. Do not claim checks passed unless they were run; distinguish unavailable tests from failures and from manual review.
- **Review:** Compare results against phase acceptance criteria, inspect the final diff for scope creep, secrets, accidental token/tool changes, accessibility, and regressions. Report files, behavior, test results, limitations, and outstanding tasks.
- **Approval gate:** Stop and wait for the user to accept the phase and authorize the next one. Do not treat silence, a roadmap entry, or a request for a status report as approval.

## 5. Phases and scope gates

Use `agent/WEBSITE_ARCHITECTURE.md` §18 as the detailed proposal and acceptance checklist. Phase numbers below match that section; do not renumber them in new documents.

Status of this sequence: Phase 0, Phase 1, and Phase 2 are complete. Phase 3 is approved as a **Phantom-only, connection-only** increment and is implemented in the working tree, pending owner review; it is not committed. Solflare, Backpack, and other wallet integrations are deferred to a future, separately approved increment. See `agent/HANDOVER.md` for the verified state.

- **Phase 0 — Discovery and architecture/design:** Inspect current implementation; agree on mission, branding, page structure, technology and design. Deliver plans or mockups only unless implementation is separately authorized.
- **Phase 1 — Public website foundation:** Build or refine approved responsive public pages and navigation, using verified project information and approved assets. No wallet-dependent feature is implied by this phase.
- **Phase 2 — Verified token information:** Present only canonical or verifiably sourced facts with clear distinctions between fixed deployment facts and live/external market data. No fabricated prices, liquidity, volume, listings, partnerships, or utility.
- **Phase 3 — Connection-only Phantom support (approved):** Provide Phantom detection, user-initiated connect/disconnect, a validated public address and connection status, and understandable missing-provider, embedded-frame, rejection, and provider-error states, with mobile/in-app-browser guidance. Solflare, Backpack, and other Wallet Standard wallets are **deferred** to a future, separately approved increment; do not describe this phase as multi-wallet. This phase is strictly connection-only: no signing, transfers, swaps, payments, balance display, or transaction submission unless a later user-approved phase is consistent with the root `AGENT.md`. Connecting is not transaction authorization.
- **Phase 4 — Future integrations, each separately proposed:** A distinct proposal and approval are required for any feature outside the connection-only scope. Root `AGENT.md` controls what is allowed. A user request cannot authorize violating its prohibitions. Never request or expose a private key or seed phrase, use project-owned signing keys, or change token authorities.
- **Phase 5 — Ecosystem content and expansion:** Verify and source every resource or update; no implied partnerships, fabricated utilities, or unapproved data collection.
- **Phase 6 — Optimization and launch readiness:** Each feature, external service, and launch/deployment action needs its own defined scope and approval. No payments, staking, rewards, smart contracts, analytics, or production deployment is implied by this phase label.

A phase may be split into smaller user-approved increments. Do not combine phases to avoid review gates.

## 6. Website organization and repository safety

All website implementation source and website-specific assets belong under `web/`, consistent with root `AGENT.md`. The current `web/` is a small, dependency-free static application: a public homepage (`index.html`, `styles.css`, `server.js`) with the Phase Two token information section and two progressive-enhancement scripts (`nav.js` for the mobile disclosure menu, `token.js` for the mint copy control), plus the Phantom connect page served at `/wallet` (`wallet.html`, `wallet.css`, `wallet-core.js`, `app.js`, and `web/tests/wallet.test.js`). See `agent/HANDOVER.md` for the current phase status, verified commit, test results, and next starting point. Inspect these files before proposing changes. The homepage carries no wallet functionality, and the `/wallet` page remains unlinked and `noindex`; do not assume either is safe to replace, and do not treat the Phantom-only page as satisfying the deferred multi-wallet increment.

Use the architecture document's proposed structure as a target only, not a directive to restructure immediately. Preserve the current entry points and local server behavior until an approved migration plan exists. Keep website code and configuration separate from root token scripts, `config/`, `deployments/`, and verification tests. Avoid unrelated root `package.json` changes; do not add dependencies without an approved justification and security review. Do not move or duplicate the official logo without checking its source and serving path.

Before editing, inspect the target file and nearby references. Use narrow, reviewable edits; check the diff for overwrites and unrelated changes. Never edit files outside the user's authorized file list. Never put secrets, private keys, seed phrases, access tokens, or credentials in source, documentation, examples, browser storage, logs, or commits. Do not install dependencies unless explicitly approved for that phase.

## 7. Initial wallet scope and security boundaries

The approved Phase 3 wallet functionality is **Phantom-only and connection-only**. It includes:

- Detecting Phantom through its documented provider (`window.phantom.solana`, with legacy `window.solana` as documented), including late provider injection in mobile in-app browsers.
- Connecting and disconnecting at the user's explicit direction.
- Showing the connected wallet's validated public address and connection status.
- Handling missing providers, embedded frames, user rejection, timeouts, account changes, and documented Phantom provider errors, with mobile/in-app-browser guidance.
- Directing a mobile visitor without an injected provider to Phantom's documented Browse deep link (`https://phantom.com/ul/browse/<url>?ref=<ref>`).

Solflare, Backpack, Wallet Standard discovery, and any other wallet integration are **deferred** to a future, separately approved increment and are not part of Phase 3.

It excludes transaction signing, message signing, token transfers, swaps, wallet-based payments, balance display, and other transaction submission. Do not add these capabilities under the description of connection support. Do not request, collect, store, or transmit private keys or seed phrases. Do not equate connection or public-address access with permission to transact. The approved Phantom-only increment needs no wallet library because Phantom injects its provider; any library or adapter for the deferred multi-wallet increment requires separate approval and a trust-boundary review.

All security, factual accuracy, testing, and read-only tooling restrictions in root `AGENT.md` apply. Keep tests offline where possible; mock wallet providers and never execute a real blockchain transaction in automated tests.

## 8. Documentation and handoff requirements

Keep project documentation useful to a new agent. When a phase is completed, update only documentation files authorized by the user and record:

- Phase name and status (planned, approved, in progress, complete, blocked).
- Objective and acceptance criteria, including which were met or not met.
- Actual files changed and a concise change summary.
- Commands run and exact outcomes; note tests not run and why.
- Decisions, assumptions, verified sources, and unresolved questions.
- Security/privacy review and any external integrations.
- Outstanding work, known limitations, and the next proposed phase, clearly marked as not authorized.

Do not claim project approval, external verification, wallet compatibility, or deployment success without evidence. Keep token facts aligned with root `AGENT.md`; if canonical data seems inconsistent, stop and request clarification rather than correcting token records from the website task.

## 9. Publishing and completion report

After approved implementation, provide a concise but complete report of objective, scope, files changed, behavior delivered, tests actually run and results, outstanding issues, root-rule conflicts, and whether any live blockchain access or transaction occurred. State clearly that no transaction occurred when applicable. Ask before committing/pushing/merging/deploying unless explicitly authorized. When a documentation-only or code commit is authorized, limit it to the exact approved files and branch; do not merge unless separately approved.

This manual does not override or relax root `AGENT.md`. If requirements conflict, root `AGENT.md` wins and the agent must stop and report the conflict.
