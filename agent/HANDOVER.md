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
- The homepage now contains the Overview section and the wallet panel (wallet connection and read-only balances). The dedicated Project Information page at `/project-information` contains the Token, Principles, and Transparency sections. The dedicated Risks section was removed from the website at owner instruction, including its navigation entry, content and links.
- The documentation corrections in `agent/SKILL.md` and `agent/WEBSITE_ARCHITECTURE.md` were committed on `feat/usol-wallet-theme` as `3e9ae247d600d38531f5dda422fbc689ac97ac11` (`docs: align project guidance with current website structure`).
- The site has server-side RPC proxying restricted to the two read-only balance methods used by the wallet panel.
- **Implemented task:** the Project Information page and navigation reorganization described in section E are implemented on branch `feat/project-information-page`, then corrected at owner instruction to three sections with Risks removed. See section C1 for files, routing and verification status.
- The six-file documentation update is complete. Commit `73b5d14db3e33a8be60d6729e41d38b93bac1201` is committed and pushed to `davidcloud001/usol-token` on `docs/update-project-guidance`.
- The intended next development repository is `dave-clouds/usol-token`. Transfer to that repository is not complete until the cross-account PR is merged and verified. No transfer completion is claimed here.
- Website swaps, transfers, signing, payments, and other transaction features are not approved. No merge into an integration or default branch, or production deployment, has been authorized.

## C. Website implementation status

| Area | Verified implementation status | Verification status |
|---|---|---|
| Homepage and navigation | `web/index.html` keeps the Overview section and the wallet panel. The header dropdown and footer link to Overview (`/#overview`) and to Token, Principles and Transparency on `/project-information`; there is no Risks entry. Mobile navigation (`web/nav.js`) is unchanged. | The recorded 48/48 `npm run test:web` result predates this change; the updated suite has not been executed. |
| Project Information page | `web/project-information.html` serves Token (`#token`), Principles (`#principles`) and Transparency (`#transparency`) through the `ROUTES` allowlist in `web/server.js`. It loads no wallet scripts and contains no Risks section. | Preview checked on 2026-11-13: page and section deep links load, desktop navigation and section anchors resolve, mobile layout collapses to one column with no horizontal overflow. No automated test run. |
| Token information | Homepage content displays the pinned mint, metadata account, 9 decimals, recorded initial supply, and recorded revoked authority states. It explicitly distinguishes initial from circulating supply and does not present initial supply as circulating. | Website tests check the rendered facts against `config/mainnet.js`; these are local records, not a new live-chain verification. |
| Wallet discovery | `web/wallet-discovery.js` implements Solana Wallet Standard registration and connection discovery, with injected Phantom and Solflare fallbacks in `web/wallet-home.js`. Other compatible Wallet Standard Solana wallets may be listed. No Backpack-specific integration is present. | Automated discovery tests exist and passed as part of the 48 website tests. |
| Wallet connection | User-initiated connection, public-address validation, connection status, and errors are implemented. | Mocked automated tests exist and passed. Real wallet approval was not tested. |
| Wallet disconnection | User-initiated and provider-triggered disconnection are implemented. | Mocked automated tests exist and passed. Real wallet disconnection was not tested. |
| Account changes and switching | Standard account-change and injected-provider account/disconnect events are handled; the active address and balances are updated. | Mocked tests exist and passed. Switching accounts in a real wallet was not tested. |
| SOL and USOL balances | Read-only balances are shown on the homepage. SOL lamports and USOL token-account amounts are formatted by `web/wallet-core.js`; missing USOL accounts display zero. No price or USD value is shown. | Formatting and error tests exist and passed. No live balance retrieval was performed during this task. |
| Restricted RPC proxy | `web/server.js` serves `POST /api/rpc`, allowing only `getBalance` and `getTokenAccountsByOwner`; the configured upstream endpoint/Helius key remains server-side. The client calls only the local proxy. | Automated tests exercised allowed/blocked methods, malformed requests, upstream errors, and timeouts with a local mock upstream. No live upstream request was performed. |
| Automated tests | `web/tests/server.test.js`, `wallet.test.js`, `wallet-balances.test.js`, and `wallet-discovery.test.js` exist. The repository's offline verification suite also exists. | `npm run test:web`: 48 passed, 0 failed, and `npm run test:offline`: 14/14, both **before** the Project Information page change. `web/tests/server.test.js` was updated for the new structure but not run (owner instruction to conserve credits). |
| Manual browser and real-device testing | No current evidence in this task verifies cross-browser visual review, Phantom extension use, Solflare use, mobile in-app wallet use, or a physical-device test. | **Untested / not verified.** Do not report these checks as completed. |

These automated results concern the existing application code only; this task did not modify or validate application code changes.

## C1. Project Information page — implementation record (2026-11-13)

- **Branch:** `feat/project-information-page` (Base44 working branch `project-information-page`), based on the approved baseline `feat/usol-wallet-theme` at commit `b1fb8e8a983118f2f3f1b86df028aaaa67627666`, verified against `origin/feat/usol-wallet-theme`.
- **Created:** `web/project-information.html`.
- **Modified:** `web/index.html` (Overview kept; Token, Principles, Transparency and Risks sections removed; navigation and footer relinked), `web/server.js` (`/project-information` added to the explicit `ROUTES` allowlist), `web/styles.css` (unused `.risk-panel` / `.risk-list` rules removed), `web/tests/server.test.js` (updated for the new page and routing), `AGENT.md`, `README.md`, `agent/SKILL.md`, `agent/WEBSITE_ARCHITECTURE.md`, and this handover.
- **Structure:** `/project-information` holds Token (`#token`), Principles (`#principles`) and Transparency (`#transparency`), in that order, with the original copy and links preserved. `/` keeps Overview (`#overview`) and the wallet panel. Header dropdown and footer: `/#overview`, `/project-information#token`, `/project-information#principles`, `/project-information#transparency`. An owner correction removed the dedicated Risks section, its navigation entry and all related links; `#risks` no longer exists.
- **Routing:** the page is a separate document served from the `ROUTES` allowlist; section hashes never reach the server, so direct links, refresh and browser history rely on normal document navigation with no client-side router. Unknown paths still return 404 and the `/api/rpc` proxy allowlist is unchanged.
- **Wallet:** unchanged. The information page loads only `/nav.js`, `/theme.js` and `/token.js`; no wallet scripts, no wallet panel, no new wallet permissions or transaction code.
- **Verification performed (preview, 2026-11-13):** `/` and `/project-information` return 200; `/project-information#token|#principles|#transparency` load and a deep link to `#principles` lands on that section; an unknown path returns 404; both pages expose the four navigation links with no Risks entry; the information page contains the three section IDs and no `risks` ID; it loads only the three scripts above; the mobile render (400 px) uses the dropdown toggle, one column, and no horizontal overflow.
- **Not run:** `npm run test:web`, `npm run test:offline`, and any build command (owner instruction to conserve credits). The updated `web/tests/server.test.js` has not been executed, so its results are unknown.
- **Not verified:** browser back/forward was exercised only as ordinary link navigation, not asserted automatically; real-wallet connect/disconnect and balances (require a browser extension); keyboard/assistive-technology and real-device review.

## C2. Support page — implementation record (2026-11-13)

- **Branch:** Base44 working branch `support-page`, based on `fix-website` at commit `d11996cf17`. Not committed or pushed.
- **Created:** `web/support.html`.
- **Modified:** `web/server.js` (`/support` added to the explicit `ROUTES` allowlist), `web/index.html` and `web/project-information.html` (Support added to the header navigation and footer navigation; Overview and Token destinations unchanged), `web/styles.css` (Support page rules appended; no existing selector changed), and this handover.
- **Structure:** `/support` opens with the heading "Be Part of UnitedSOLANA" and the supporting message, plus an "On this page" panel of jump links. Four numbered chapters follow, each a `section` with its own id, kicker, `h2`, lede and a `.support-grid` of `.support-card` elements: Join the community (`#join`), Build with us (`#build`), Support ecosystem development (`#develop`), Explore the ecosystem (`#explore`). A closing "How this page grows" band (`#growing`) documents the expansion pattern and repeats the page's limits. Future initiatives, programmes, partnerships and participation opportunities extend the relevant chapter with another card, or add a new chapter using the same pattern; the grid reflows automatically.
- **Content limits:** no donation address, payment route, social link, partnership, product availability or return claim. No external links, no wallet scripts, no wallet panel, no transaction or payment code. The Risks section is not reintroduced.
- **Routing:** separate document served from the `ROUTES` allowlist; section hashes are resolved by the browser. Unknown paths still return 404 and the `/api/rpc` proxy allowlist is unchanged.
- **Verification performed (preview, 2026-11-13):** `/support` returns 200 and renders the specified heading, supporting message, four chapter headings and 12 cards; `/`, `/project-information` and `/support` all expose Overview, Token and Support in the header and footer; the homepage wallet panel is intact; no Risks wording on `/` or `/project-information`; unknown path still 404. Desktop and mobile viewports show no horizontal overflow (measured). The "Join the community" button and the panel jump links move to their sections (`#join`, `#explore`). The mobile menu disclosure opens and lists Support. Dark mode switches the page and cards to the dark tokens. No console errors.
- **Not verified:** automated tests were not run (owner instruction), so `npm run test:web` results for the new route are unknown; no real-wallet, real-device or assistive-technology review.

## C3. Dependency and package audit (2026-11-13)

- **Scope:** the only package manifests in the repository are `package.json` and `package-lock.json` (`lockfileVersion` 3, 93 package entries, **0 devDependencies**). No `node_modules` is committed or installed in the checkout, so the lockfile is the authoritative record of resolved versions. `web/` (the website) imports no npm package and uses only Node core modules; all five direct dependencies serve the read-only verification/deployment tooling only (`config/mainnet.js`, `deploy-mainnet.js`, `lib/preflight.js`, `lib/verify.js`, `lib/launch-transaction.js`, `lib/wallets.js`, `test/mainnet-deployed.test.js`).
- **Result: no dependency changes were applied.** `npm update --package-lock-only --dry-run` reported "up to date", and every declared range already resolves to the newest published version inside that range. `package.json` and `package-lock.json` are byte-identical to the audit baseline.
- **Direct dependencies (locked → newest available):** `@metaplex-foundation/mpl-token-metadata` 3.4.0 → 4.0.0 (major); `@metaplex-foundation/umi` 1.6.0 → 1.6.0 (current); `@metaplex-foundation/umi-bundle-defaults` 1.6.0 → 1.6.0 (current); `@solana/spl-token` 0.4.15 → 0.4.15 (current); `@solana/web3.js` 1.99.0 → 3.2.1 (major; 1.99.0 is the final 1.x release).
- **Advisories:** `npm audit --package-lock-only` reported 14 affected nodes / 3 high / 11 moderate / 0 critical, from five unique advisories, every one inherited through `@solana/web3.js` 1.x: `bigint-buffer` 1.1.5 (GHSA-3gc7-fjrx-p6mg, high, **no patched version exists**), `stream-json` 1.9.1 (GHSA-528h-pc64-c93x, GHSA-hqr4-qq8f-hg3x, GHSA-mjw6-4jj6-33hc), and `uuid` 8.3.2 (GHSA-w5hq-g745-h8pq, patched only in >=11.1.1). npm's suggested remediation is a semver-major *downgrade* of `@solana/spl-token` to 0.1.8, which removes the `getMint`/`getAccount`/`TOKEN_PROGRAM_ID` APIs used by the tooling — rejected. No override was added: forcing `uuid`/`stream-json` majors into `jayson` would not clear the unfixable high advisory and cannot be validated here.
- **Deferred majors:** (1) `@solana/web3.js` 3.2.1 is a `@solana/kit`-based rewrite, and `@solana/spl-token@0.4.15` (peer `^1.95.5`) plus `@metaplex-foundation/umi-web3js-adapters@1.6.0` and `umi-rpc-web3js@1.6.0` (peer `^1.99.0`) only accept 1.x, so this is a whole-stack migration, not a bump. (2) `@metaplex-foundation/mpl-token-metadata` 4.0.0 (published 2026-11-10) keeps `mplTokenMetadata`/`fetchMetadataFromSeeds` and its `umi <= 1` peer is satisfied, but it carries no security advisory, and the tooling must not be changed without approval and test results.
- **Not performed:** no `npm install`, no test run, no build, no commit, push or deployment (owner instruction). Re-check later with `npm audit --package-lock-only`, `npm outdated --long`, and `npm update --package-lock-only --dry-run`.

## D. Previous agent's work

The following activity is supported by the checked-out Git history; it is not a claim about a particular person's identity.

- `9682524` (2026-11-09), “Add wallet balances and theme toggle”: changed `web/index.html`, `web/server.js`, `web/styles.css`, `web/tests/server.test.js`, `web/theme.css`, `web/theme.js`, and `web/wallet-home.js`. Added homepage balance UI and theme support. This commit is present under merge commit `1c7414d`, “Merge pull request #7 from Davidic-Core/feat/home-wallet-balances”.
- `a30b64e` (2026-11-10), “Refactor wallet connection and balance handling to support Wallet Standard”: changed `package.json`, `web/index.html`, `web/server.js`, `web/styles.css`, `web/tests/server.test.js`, `web/tests/wallet-balances.test.js`, `web/tests/wallet-discovery.test.js`, `web/wallet-core.js`, `web/wallet-discovery.js`, and `web/wallet-home.js`. Added Wallet Standard discovery and updated wallet integration/tests.
- `57f34fa` (2026-11-11), “Refactor wallet and server core functionality”: changed `.env.example`, `README.md`, `agent/HANDOVER.md`, `agent/SKILL.md`, `agent/WEBSITE_ARCHITECTURE.md`, `web/index.html`, `web/server.js`, `web/tests/server.test.js`, `web/tests/wallet-balances.test.js`, `web/wallet-core.js`, and `web/wallet-home.js`; removed `web/app.js`, `web/wallet.css`, and `web/wallet.html`. Refactored the server/wallet integration, removed the old standalone wallet page, and updated documentation.
- `e88fcdd` (2026-11-11), “Implement secure server-side Solana RPC proxy and remove client-side API key exposure”: the recorded file summary shows a change to `web/tests/server.test.js`; do not infer implementation files from the commit title. The current `web/server.js` and automated tests independently confirm the restricted proxy is present.
- `af571c6` (2026-11-11), “Update .env.example to include active Helius API key placeholder”: changed `.env.example`.

The listed work is committed and present in the current branch history. At inspection, `docs/update-project-guidance` tracked `origin/docs/update-project-guidance` and was up to date, so these commits are present on that tracking remote. The history confirms the wallet-balance merge noted above; it does not establish that the newer changes were merged into the canonical upstream's default branch or deployed. No current live deployment was verified. Earlier documentation recorded manual Phantom testing as outstanding; the current absence of device/browser verification is reaffirmed in section C.

**Prior handover record retained (2026-11-09; historical, not current test evidence):** the prior status listed the public website foundation and token information as complete, Phantom-only connection as implemented, and balances, swaps, and launch-readiness as proposed. That status predates the Wallet Standard, balance, and proxy work summarized above and is superseded by current code inspection. It recorded `node --test web/tests/server.test.js web/tests/wallet.test.js` as 19/19 and `npm run test:offline` as 14/14 at that time; these are historical results, distinct from section C's rerun. It also recorded automated preview checks for homepage and embedded wallet-page behavior without enough detail to reproduce them here. The prior manual checklist named desktop Phantom extension connect/disconnect, account-change behavior, Phantom mobile in-app browser, clipboard copying, and keyboard/assistive-technology accessibility. None is claimed complete by this update.

## E. Historical task scope and implementation instructions

The page/navigation task below has been completed as recorded in sections B and C1. The current structure is Overview and the existing wallet panel on `/`, with Token, Principles and Transparency on `/project-information`; the Risks section has been removed. This section preserves the original approved scope and implementation instructions as historical context.

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
- **Current project state:** The Project Information page and navigation reorganization are implemented on `feat/project-information-page` (three sections; Risks removed). Documentation is updated in the same branch. Automated tests and builds were not run after the change, per owner instruction.
- **Documentation update:** Corrections to `agent/SKILL.md` and `agent/WEBSITE_ARCHITECTURE.md` were committed on `feat/usol-wallet-theme` as `3e9ae247d600d38531f5dda422fbc689ac97ac11`.
- **Next responsible workflow:** The intended next development repository is `dave-clouds/usol-token`. The cross-account transfer is not complete until its PR is merged and verified; confirm that status before treating the transfer as complete.
- **Outstanding decisions:** No further merge or production deployment is authorized. No additional transaction feature is approved. No current live deployment or manual real-wallet/device test has been verified.
- **Dependency audit:** completed on 2026-11-13 with no package changes (see section C3). The manifest and lockfile remain at their audited baseline; the unfixable advisories are all inherited from the final `@solana/web3.js` 1.x release.
- **Latest verified update:** 2026-11-13.
