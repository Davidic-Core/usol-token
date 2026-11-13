UnitedSOLANA (USOL) — Agent Operating Rules

1. Project identity and repository workflow

UnitedSOLANA (USOL) is an existing Solana Mainnet token project with an associated website.

Repository ownership and current checkout

- Verified repository: "davidcloud001/usol-token", a fork of "Snr-Dave/usol-token".
- Canonical upstream: "Snr-Dave/usol-token".
- The GitHub default branch observed during the 2026-11-13 documentation update is "feat/usol-wallet-theme".
- Branch names and configured remotes can change. Verify the current repository, remotes, and branch at the start of each task; do not treat an old branch name as authoritative.
- Never assume that changes in the working fork have reached the canonical upstream.

Development tools and responsibilities

- GitHub is the source of truth for repository files, history, branches, reviews, and approved changes.
- GitHub Copilot is used for project documentation and agent-instruction maintenance.
- Base44 is currently used for website implementation. Website implementation must take place on a separate feature branch based on the approved updated development baseline.
- Changes must be reviewed before merging or deployment. Owner approval is required before merge or deployment.
- References to v0, Vercel, or Acode in older project documents are historical unless their current use is independently verified and specifically approved. Do not assume hosting, preview deployment, or a production deployment is configured.

2. Project mode and existing token protection

UnitedSOLANA (USOL) is already deployed on Solana Mainnet. Preserve the existing token and its history.

Never create another USOL mint, mint additional tokens, change mint or freeze authorities, upload or register replacement token metadata, modify historical deployment records or transaction signatures, or execute token deployment or authority-management transactions.

The repository's deployment and verification tooling must remain read-only and safe. Website features do not change these restrictions or authorize changes to token configuration, deployment records, or deployment tooling.

Pinned deployment:

- Name/symbol: "UnitedSOLANA" / "USOL"
- Network: "mainnet-beta"
- Mint: "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG"
- Decimals/supply: 9 / 1,000,000,000 USOL
- Metadata account: "4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc"
- Metadata URI: "https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY"
- Logo URI: "https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo"
- Mint and freeze authorities: revoked ("null")

Treat "config/mainnet.js" as pinned expected values and "deployments/mainnet.json" as a historical deployment record. Validate canonical fields explicitly; allow unrelated additional record fields. Missing or inconsistent state is an error, never a reason to deploy, upload, or register. Preserve recorded deployment transaction signatures and useful history.

3. Executable tooling

- "deploy-mainnet.js" may make read-only RPC and metadata HTTP reads only. It must not sign, submit, or automatically modify deployment files.
- "revoke-mint-authority.js", "revoke-freeze-authority.js", "upload-metadata-mainnet.js", and "register-metadata-mainnet.js" are inert notices. Do not add imports, key loaders, networking, uploaders, transaction builders, signers, or submit calls.
- Normal tests are offline, fixture-based, and mock external reads. Optional live verification is a separate read-only command.
- Keep website functionality and source separate from deployment and verification tooling. Website transaction features must not change the read-only and safe behavior of those tools.

4. Website architecture and isolation

All website source code and assets must remain inside "web/".

The existing website is a static, dependency-free vanilla HTML/CSS/JavaScript application. Preserve this architecture unless the owner separately approves a migration proposal.

Preserve existing routes, branding, wallet functionality, responsive behavior, tests and security controls.

Do not modify protected token configuration, historical records, deployment scripts, or verification tooling to accommodate website features.

The website may provide:

- Official USOL project information.
- Verified token details.
- Wallet connection and disconnection.
- SOL and USOL balance display.
- Transaction or swap functionality only after separate explicit approval and technical/security review.
- Project documentation and transparency information.
- Appropriate risk disclosures.

Support Phantom, Solflare and Backpack where technically appropriate, using established Solana wallet standards.

Use reputable integrations such as Jupiter where technically supported. Never claim that a trading pair, liquidity pool, or swap route exists without verifying it.

Avoid unnecessary changes to existing dependencies and project configuration.

5. Non-custodial wallet security

The website must be non-custodial; users must retain control of their wallets.

- Never request, collect, store, or transmit seed phrases or private keys.
- Never sign transactions using project-owned private keys.
- Do not add wallet key files, keypair loading, or server-side signing.
- Clearly present transaction details before approval.
- Transactions must require explicit user action and approval inside the user's connected wallet.
- Never initiate or submit a transaction without that interaction and approval.
- Connecting a wallet does not authorize a transaction.
- Never bypass the connected wallet's review and approval flow.

Wallet connection, balance retrieval and swap execution are separate capabilities. Approval for one does not authorize the others.

6. Current implementation and approved work

The current homepage and wallet functionality are implemented in "web/". The homepage contains the Overview section and the wallet panel. A dedicated Project Information page at "/project-information" holds the Token, Principles, and Transparency sections. The dedicated Risks section was removed from the website at owner instruction, including its navigation entry and links.

Verified wallet capabilities include Solana Wallet Standard discovery, injected Phantom and Solflare fallbacks, user-initiated connection/disconnection, account-change handling, read-only SOL/USOL balances, and the restricted server-side RPC proxy. See "agent/HANDOVER.md" for evidence, exact test results, and what remains untested. Do not describe real-wallet/device testing or live RPC verification as completed without performing it.

Owner-approved and implemented on feature branch "feat/project-information-page": a dedicated Project Information page at "/project-information" holding the Token, Principles, and Transparency content, with Overview kept on the homepage and the wallet panel unchanged. A later owner correction removed the dedicated Risks section from the website (content, navigation entry, and links). The section anchors and navigation destinations are recorded in "agent/HANDOVER.md" and "agent/WEBSITE_ARCHITECTURE.md". Note the open question in "agent/HANDOVER.md": section 7 of this file still calls for appropriate risk disclosures, which now exist only as general wording in the footer and section copy. Confirm with the owner before adding a risk section back.

Wallet transactions, signing, swaps, transfers, payments, and further ecosystem features remain unapproved unless the owner explicitly approves them separately. Do not infer approval from this navigation task.

7. Accuracy and transparency

Never invent token prices, market capitalization, trading volume, liquidity, exchange listings, partnerships, audits or project utilities.

Clearly distinguish verified on-chain information from third-party market information and estimates. Identify external sources and when information was checked where appropriate.

Include appropriate cryptocurrency risk disclosures.

Do not promise returns or present estimates as guaranteed outcomes.

8. Development, testing and verification

Preserve existing repository tests and project configuration. Do not break existing offline tests.

Keep offline tests independent of live blockchain services. Add website-specific tests where appropriate.

Never perform real transactions as part of automated tests.

Avoid unnecessary dependencies and deprecated syntax. Review security implications before adding wallet or transaction functionality.

Do not claim tests passed unless actually executed. Do not claim live Mainnet verification based only on fixtures.

Test website changes in an approved preview environment if one is configured; do not assume any preview or hosting provider is active.

Preview testing should include, where relevant:

- Mobile and desktop responsiveness.
- Navigation and website links.
- Existing wallet connection and disconnection.
- Error and unsupported-browser states.
- Newly implemented functionality.
- Browser console errors.
- Regression testing of existing website behavior.

A preview deployment is not a production deployment.

9. GitHub, Copilot, and Base44 workflow

1. Verify the repository, configured remotes, current branch, and worktree before editing. GitHub is the source of truth.
2. Use GitHub Copilot for documentation maintenance and agent-instruction updates.
3. Use Base44 for approved website implementation. Website implementation belongs on a separate feature branch based on the approved updated development baseline, not on a documentation branch.
4. Keep website implementation isolated under "web/" and protect token/deployment files.
5. Review the complete diff and actual test results before any merge or deployment.
6. Obtain explicit owner approval before merging or deploying. Do not infer authorization to commit, push, merge, publish, or deploy from a request to implement.

Do not assume a particular integration branch, hosting provider, preview environment, or production deployment is configured. Verify current facts before documenting or using them.

Never place credentials, API secrets, private keys, or wallet keypair files in source code or committed documentation. Use approved server-side environment-variable settings for server secrets; public browser variables must not contain private credentials.

10. Approval, completion reports and publishing

Do not commit, push, merge, publish or deploy without explicit user approval.

An explicit authorization to commit to a named development or documentation branch permits that commit only. It does not authorize merging, pushing to another repository, publishing or production deployment.

Before performing a task, identify its scope and required approval.

After development tasks, report:

- Files created or modified.
- Functionality implemented.
- Actual test commands and results.
- Remaining issues and security considerations.
- Whether live verification was performed.
- Whether any blockchain transaction occurred.
- Commit and branch details, if applicable.
- Whether a preview or production deployment occurred.

Whenever an agent completes a significant task or hands work to another agent, it must update "agent/HANDOVER.md" with verified changes, current status, outstanding work, relevant branch information, and next steps. Keep the handover concise and factual, preserve prior handover history, and never report unverified work as complete.

If a required file cannot be read completely, stop and report the limitation rather than claiming a complete review.

If tools cannot safely perform an authorized operation without exceeding the approved scope, explain the limitation and request an appropriate workflow.

Preserve project history and never misrepresent implementation, testing, verification, commits, merges or deployment status.
