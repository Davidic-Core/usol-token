# UnitedSOLANA Project Handover

This is the living, factual handover for any developer, agent, or assistant taking over the project. Read it with the root [AGENT.md](../AGENT.md), [SKILL.md](SKILL.md), [WEBSITE_ARCHITECTURE.md](WEBSITE_ARCHITECTURE.md), and [V0_INSTRUCTIONS.md](V0_INSTRUCTIONS.md). The root instructions govern where applicable. Record new verified work at the top of the relevant history; do not erase or rewrite prior handover history to imply that unverified work was completed.

## A. Project identity

- **Project:** UnitedSOLANA (USOL), an existing Classic SPL Token on Solana Mainnet and its public information website.
- **Verified repository:** `davidcloud001/usol-token` (`https://github.com/davidcloud001/usol-token`), a fork of `Snr-Dave/usol-token`.
- **Canonical upstream:** `Snr-Dave/usol-token` (`https://github.com/Snr-Dave/usol-token`), verified from the configured `upstream` remote and GitHub repository metadata.
- **Current working branch at this update:** `docs/update-project-guidance`.
- **GitHub default branch observed for both the working fork and upstream:** `feat/usol-wallet-theme`. No separate canonical integration branch is established by the current repository evidence.
- **Token identity:** Solana Mainnet (`mainnet-beta`); mint `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`; 9 decimals; recorded initial supply 1,000,000,000 USOL. This is not a circulating-supply figure. Recorded mint and freeze authorities are revoked. Preserve the pinned configuration, metadata, deployment records, and transaction history.

## B. Current project status

- The static, dependency-free website and read-only wallet experience described below are implemented in `web/`.
- The existing homepage currently contains Overview, Token, Principles, Transparency, and Risk sections, plus wallet connection and read-only balance UI. A separate Project Information page and the requested navigation reorganization are **not implemented**.
- The site has server-side RPC proxying restricted to the two read-only balance methods used by the wallet panel.
- **Approved next implementation task:** create the Project Information page and reorganize navigation as specified in section E. The owner approved this task in the instruction that established this handover update. Implementation has not started.
- The six-file documentation update is complete. Commit `73b5d14db3e33a8be60d6729e41d38b93bac1201` is committed and pushed to `davidcloud001/usol-token` on `docs/update-project-guidance`.
- The next approved task is implementing the Project Information page. The page has not yet been implemented.
- Website swaps, transfers, signing, payments, and other transaction features are not approved. No merge into an integration or default branch, or production deployment, has been authorized.

## C. Website implementation status

| Area | Verified implementation status | Verification status |
|---|---|---|
| Homepage and navigation | The current homepage is `web/index.html`; it contains the overview and detailed sections, same-page header/footer anchors, and responsive mobile navigation. A separate Project Information page is not implemented. | `npm run test:web` passed during this documentation task (48/48). No visual browser review was performed. |
| Token information | Homepage content displays the pinned mint, metadata account, 9 decimals, recorded initial supply, and recorded revoked authority states. It explicitly distinguishes initial from circulating supply and does not present initial supply as circulating. | Website tests check the rendered facts against `config/mainnet.js`; these are local records, not a new live-chain verification. |
| Wallet discovery | `web/wallet-discovery.js` implements Solana Wallet Standard registration and connection discovery, with injected Phantom and Solflare fallbacks in `web/wallet-home.js`. Other compatible Wallet Standard Solana wallets may be listed. No Backpack-specific integration is present. | Automated discovery tests exist and passed as part of the 48 website tests. |
| Wallet connection | User-initiated connection, public-address validation, connection status, and errors are implemented. | Mocked automated tests exist and passed. Real wallet approval was not tested. |
| Wallet disconnection | User-initiated and provider-triggered disconnection are implemented. | Mocked automated tests exist and passed. Real wallet disconnection was not tested. |
| Account changes and switching | Standard account-change and injected-provider account/disconnect events are handled; the active address and balances are updated. | Mocked tests exist and passed. Switching accounts in a real wallet was not tested. |
| SOL and USOL balances | Read-only balances are shown on the homepage. SOL lamports and USOL token-account amounts are formatted by `web/wallet-core.js`; missing USOL accounts display zero. No price or USD value is shown. | Formatting and error tests exist and passed. No live balance retrieval was performed during this task. |
| Restricted RPC proxy | `web/server.js` serves `POST /api/rpc`, allowing only `getBalance` and `getTokenAccountsByOwner`; the configured upstream endpoint/Helius key remains server-side. The client calls only the local proxy. | Automated tests exercised allowed/blocked methods, malformed requests, upstream errors, and timeouts with a local mock upstream. No live upstream request was performed. |
| Automated tests | `web/tests/server.test.js`, `wallet.test.js`, `wallet-balances.test.js`, and `wallet-discovery.test.js` exist. The repository's offline verification suite also exists. | `npm run test:web`: 48 passed, 0 failed. `npm run test:offline`: 14/14 passed; it reports no Mainnet RPC or external gateway contacted. Both were run during this documentation task. |
| Manual browser and real-device testing | No current evidence in this task verifies cross-browser visual review, Phantom extension use, Solflare use, mobile in-app wallet use, or a physical-device test. | **Untested / not verified.** Do not report these checks as completed. |

These automated results concern the existing application code only; this task did not modify or validate application code changes.

## D. Previous agent's work

The following activity is supported by the checked-out Git history; it is not a claim about a particular person's identity.

- `9682524` (2026-11-09), “Add wallet balances and theme toggle”: changed `web/index.html`, `web/server.js`, `web/styles.css`, `web/tests/server.test.js`, `web/theme.css`, `web/theme.js`, and `web/wallet-home.js`. Added homepage balance UI and theme support. This commit is present under merge commit `1c7414d`, “Merge pull request #7 from Davidic-Core/feat/home-wallet-balances”.
- `a30b64e` (2026-11-10), “Refactor wallet connection and balance handling to support Wallet Standard”: changed `package.json`, `web/index.html`, `web/server.js`, `web/styles.css`, `web/tests/server.test.js`, `web/tests/wallet-balances.test.js`, `web/tests/wallet-discovery.test.js`, `web/wallet-core.js`, `web/wallet-discovery.js`, and `web/wallet-home.js`. Added Wallet Standard discovery and updated wallet integration/tests.
- `57f34fa` (2026-11-11), “Refactor wallet and server core functionality”: changed `.env.example`, `README.md`, `agent/HANDOVER.md`, `agent/SKILL.md`, `agent/WEBSITE_ARCHITECTURE.md`, `web/index.html`, `web/server.js`, `web/tests/server.test.js`, `web/tests/wallet-balances.test.js`, `web/wallet-core.js`, and `web/wallet-home.js`; removed `web/app.js`, `web/wallet.css`, and `web/wallet.html`. Refactored the server/wallet integration, removed the old standalone wallet page, and updated documentation.
- `e88fcdd` (2026-11-11), “Implement secure server-side Solana RPC proxy and remove client-side API key exposure”: the recorded file summary shows a change to `web/tests/server.test.js`; do not infer implementation files from the commit title. The current `web/server.js` and automated tests independently confirm the restricted proxy is present.
- `af571c6` (2026-11-11), “Update .env.example to include active Helius API key placeholder”: changed `.env.example`.

The listed work is committed and present in the current branch history. At inspection, `docs/update-project-guidance` tracked `origin/docs/update-project-guidance` and was up to date, so these commits are present on that tracking remote. The history confirms the wallet-balance merge noted above; it does not establish that the newer changes were merged into the canonical upstream's default branch or deployed. No current live deployment was verified. Earlier documentation recorded manual Phantom testing as outstanding; the current absence of device/browser verification is reaffirmed in section C.

**Prior handover record retained (2026-11-09; historical, not current test evidence):** the prior status listed the public website foundation and token information as complete, Phantom-only connection as implemented, and balances, swaps, and launch-readiness as proposed. That status predates the Wallet Standard, balance, and proxy work summarized above and is superseded by current code inspection. It recorded `node --test web/tests/server.test.js web/tests/wallet.test.js` as 19/19 and `npm run test:offline` as 14/14 at that time; these are historical results, distinct from section C's rerun. It also recorded automated preview checks for homepage and embedded wallet-page behavior without enough detail to reproduce them here. The prior manual checklist named desktop Phantom extension connect/disconnect, account-change behavior, Phantom mobile in-app browser, clipboard copying, and keyboard/assistive-technology accessibility. None is claimed complete by this update.

## E. Current task and next agent instructions

The next implementation task, approved by the owner, is to create a dedicated **Project Information** page and reorganize the existing homepage navigation. The approved content and destinations are:

**Homepage**

- Keep Overview on the homepage.
- Relocate the detailed Token, Principles, Transparency, and Risks content to the Project Information page.
- Preserve the existing wallet panel and its functionality.

**Project Information page**

1. Token
2. Principles
3. Transparency
4. Risks

**Navigation**

- Overview → homepage (`/#overview`).
- Token → Project Information at `#token`.
- Principles → Project Information at `#principles`.
- Transparency → Project Information at `#transparency`.
- Risks → Project Information at `#risks`.

The stable page URL documented for implementation is `/project-information`; therefore, the section links are `/project-information#token`, `/project-information#principles`, `/project-information#transparency`, and `/project-information#risks`.

Preserve existing copy and factual meaning, design, responsiveness, accessibility, and wallet functionality. Direct section links, browser refresh, and back/forward navigation must work. Review the current route allowlist and tests before implementation; add and test the required route behavior without weakening the server's restrictions.

Use the approved updated development baseline, then create/use a **separate feature branch** for website implementation. Do not implement on this documentation branch. GitHub is the source of truth. GitHub Copilot is used for documentation and instruction maintenance; Base44 is currently used for website implementation. Review all changes and test results before any merge or deployment. Obtain owner approval before merging or deploying.

## F. Safety and approval requirements

- Do not modify token configuration, deployment records, metadata references, authority records, transaction signatures, or blockchain scripts.
- Do not introduce signing, transactions, swaps, transfers, or payment functionality without separate owner approval and review.
- Do not remove or regress existing wallet functionality.
- Do not merge or deploy without owner approval. Do not commit or push without explicit authorization.
- Do not claim tests passed unless the exact tests were executed. Separate automated results from manual, device, and live-chain testing.
- Do not claim initial supply is circulating supply or add unsupported utility, trading, liquidity, listing, partnership, audit, price, or market claims.
- Preserve existing work and handover history.

## CURRENT HANDOVER STATUS

- **Previous work:** The verified recent history implements the current Wallet Standard wallet experience, read-only balances, restricted RPC proxy, and related server/test updates; the history and its limitations are summarized in section D.
- **Current project state:** The six-file documentation update is complete and committed/pushed as `73b5d14db3e33a8be60d6729e41d38b93bac1201` to `davidcloud001/usol-token` on `docs/update-project-guidance`. The Project Information page remains unimplemented.
- **Next responsible workflow:** Implement only section E on a separate feature branch based on the approved updated development baseline.
- **Outstanding decisions:** No merge into an integration/default branch or production deployment is authorized. No additional transaction feature is approved. No current live deployment or manual real-wallet/device test has been verified.
- **Latest verified update:** 2026-11-13.
