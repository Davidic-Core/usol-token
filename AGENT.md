UnitedSOLANA (USOL) — Agent Operating Rules

1. Project identity and repository workflow

UnitedSOLANA (USOL) is an existing Solana Mainnet token project with an associated website.

Repository ownership

- Canonical upstream: "Snr-Dave/usol-token"
- Canonical integration branch: "fix-website"
- Owner's working fork: "Davidic-core/usol-token"
- Working integration branch: "fix-website"
- Documentation update branch: "docs/v0-vercel-handover" (temporary documentation branch)

The canonical "Snr-Dave/usol-token" repository is the authoritative upstream source. The "Davidic-core" fork is the owner's working environment for approved development and testing.

Never assume that changes in the working fork have automatically reached the canonical repository.

Development tools and responsibilities

The project uses the following tools:

- GitHub: Source control, repository history, documentation and code review.
- GitHub Copilot: Repository documentation, code assistance and approved development tasks.
- v0: Planned website development and integration agent.
- Vercel: Planned website preview deployments and hosting.
- Acode: Local development, terminal commands, Git operations and manual testing.

Do not describe Base44 or Bolt.new as the current primary website development workflow. Historical references may remain where necessary to explain previous project decisions.

Do not assume that v0 has imported the repository, Vercel has been configured, or production hosting is active until independently verified.

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
- Buying and selling USOL through supported swap integrations.
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

6. Project development phases and status

Maintain accurate implementation status. Do not describe proposed or planned functionality as completed.

Phase One — Website foundation

Status: Completed.

Established the responsive static homepage and existing Phantom wallet page foundation.

Phase Two — Token information and branding

Status: Completed.

Implemented the token information section, navigation improvements, branding, mint-address copy functionality and Solscan links.

Phase Three — Phantom wallet connection

Status: Implemented and merged into the working "fix-website" branch.

The GitHub branch history contains a merge commit titled:

"Implement Phantom-only wallet connection phase."

The implementation covers Phantom-only wallet connection and disconnection, public wallet address validation, connection states and error handling.

Important verification distinction:

- Automated and mock verification was previously reported.
- A successful real-device Phantom connection and disconnection test has not been confirmed.
- Do not claim a new test was run unless it was actually executed.

Phase Three does not authorize wallet balance display, transaction signing, swaps, transfers or payment functionality.

Phase Four — Wallet balances

Status: Proposed, not implemented.

Potential scope:

- Prominent homepage wallet entry point.
- Phantom wallet connection.
- SOL balance display.
- USOL token balance display.
- Loading, disconnected and error states.

Requires separate owner approval before implementation.

Phase Five — USOL swaps

Status: Proposed, not implemented.

Potential scope:

- SOL-to-USOL swaps.
- USOL-to-SOL swaps.
- Investigation of Jupiter integration and verified swap routes.
- Transaction previews and wallet approval.
- Slippage controls and transaction error handling.

Requires a separate technical and security review and explicit owner approval before implementation.

Do not claim USOL swaps are functional or available until independently tested.

Phase Six — Ecosystem and launch readiness

Status: Proposed, not implemented.

Potential scope:

- Website launch readiness.
- Custom domain configuration.
- Official social links and project information.
- Documentation and user guidance.
- Further ecosystem integrations after approval.

Do not invent completed features, deployment status, domain ownership or live integrations.

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

Test website changes in a Vercel preview before production approval where Vercel is configured.

Preview testing should include, where relevant:

- Mobile and desktop responsiveness.
- Navigation and website links.
- Existing wallet connection and disconnection.
- Error and unsupported-browser states.
- Newly implemented functionality.
- Browser console errors.
- Regression testing of existing website behavior.

A preview deployment is not a production deployment.

9. GitHub, v0 and Vercel workflow

Use the following controlled workflow for website development:

1. Confirm the correct repository and working branch before making changes.
2. Keep "Snr-Dave/usol-token" as the canonical upstream repository.
3. Use "Davidic-core/usol-token" for approved website development and integration.
4. Use dedicated development branches for substantial feature work.
5. Use "fix-website" as the working integration branch.
6. Use GitHub Copilot for approved repository tasks and documentation.
7. Use v0 for approved website development and integration when repository access is configured.
8. Use Vercel preview deployments for review and testing when configured.
9. Review all diffs and test results before merging.
10. Merge approved work into "Davidic-core/fix-website".
11. Transfer approved changes to "Snr-Dave/fix-website" only after explicit owner authorization.
12. Production deployment requires separate explicit owner approval.

Never allow experimental development to overwrite the canonical production branch.

Do not assume that v0 or Vercel permissions, deployment settings, environment variables, custom domains or production configurations exist until verified.

Never place credentials, API secrets, private keys or wallet keypair files in source code or committed documentation.

Use appropriate platform environment-variable settings for any approved server-side secrets. Public browser variables must never contain private credentials.

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

If a required file cannot be read completely, stop and report the limitation rather than claiming a complete review.

If tools cannot safely perform an authorized operation without exceeding the approved scope, explain the limitation and request an appropriate workflow.

Preserve project history and never misrepresent implementation, testing, verification, commits, merges or deployment status.
