# UnitedSOLANA (USOL) Website and Platform Development Skill

## 1. Mission

Build the official UnitedSOLANA (USOL) website and progressively develop it into a useful, trustworthy Solana ecosystem platform.

The platform must be professional, responsive, secure, transparent, and easy to use, particularly on mobile devices. It must operate independently of the existing token deployment and verification tools.

Follow the root `AGENT.md` at all times. It takes precedence over this roadmap. If a proposed feature conflicts with the root rules—for example, rules limiting website functionality or prohibiting wallet transactions—do not implement it or weaken those rules. First present the conflict and request explicit approval to revise the governing instructions. A feature appearing in this roadmap is not, by itself, authorization to implement it.

## 2. Development Philosophy

Build the platform in clearly separated phases. Each phase must:

- Have a defined objective and clearly identified deliverables.
- Be implemented independently where practical.
- Include appropriate testing.
- Be reviewed by the user before the next phase begins.

Do not attempt to implement every feature in one operation. Do not assume future features are approved simply because they appear in this roadmap.

## 3. Phase One — Foundation and Website Design

Inspect the existing repository and recommend the most suitable website architecture. Design and plan:

- Official USOL homepage.
- Responsive navigation.
- Official USOL logo and branding.
- Project introduction.
- Token information section.
- Buy USOL entry point, only if allowed by root instructions and supported by verified information.
- Community and documentation links, only when their official destinations are known.
- Footer containing relevant disclosures.

Design requirements:

- Modern, professional appearance.
- Mobile-first responsiveness.
- Fast loading.
- Accessible typography and controls.
- Consistent visual identity.
- Clear navigation.
- Good desktop and mobile experiences.

Do not invent project partnerships, achievements, links, or utilities. Deliver a proposed architecture, page structure, and design plan before implementation. Do not begin implementation until the user approves the phase plan.

## 4. Phase Two — Official Token Information

Integrate verified USOL information, subject to root `AGENT.md` and user approval. The known canonical information is:

- Name and symbol: UnitedSOLANA (USOL).
- Network: Solana Mainnet (`mainnet-beta`).
- Canonical mint: `FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG`.
- Decimals: 9.
- Initial supply: 1,000,000,000 USOL.
- Mint and freeze authorities: revoked (`null`).
- Metadata account: `4VsgjLd3QisSUmEJwn2gmdrijeSbfHbkiGx3T3wXX9zc`.
- Metadata URI: `https://gateway.irys.xyz/Z5nnTKSPFq2eOUsTUwOM57zh0Bav97Cm-Bl4jEVcDWY`.
- Logo URI: `https://gateway.irys.xyz/7l-PU0ePGIx-bqZYzXbGLCX1F4-Q8EmPInDnbBAzDjo`.

Where permitted, retrieve public on-chain information through read-only RPC requests. Link to relevant Solscan pages using verified addresses. Distinguish initial supply from circulating supply and actual wallet holdings. Never invent market prices, market capitalization, liquidity, or trading volume. Do not modify protected token configuration or historical records to accommodate the website.

## 5. Phase Three — Solana Wallet Integration

Wallet features are a potential future phase only; implement them only if permitted by root `AGENT.md` and separately approved by the user. If approved, plan and implement non-custodial support, prioritizing:

- Phantom.
- Solflare.
- Backpack.

Use established Solana wallet standards and maintained libraries. Potential features include connecting and disconnecting a wallet, displaying its public address, displaying USOL and SOL balances, and handling rejected connections, RPC/network errors, and clear wallet status.

Never request, collect, or store seed phrases or private keys. Users must retain complete control of their wallets. Never sign transactions using project-owned private keys or add server-side signing. Wallet connections do not authorize transactions.

## 6. Phase Four — USOL Buy and Sell Integration

Swap features are a potential future phase only; implement them only if permitted by root `AGENT.md` and separately approved by the user. If approved, evaluate an established Solana swap provider such as Jupiter, subject to current compatibility and availability. Potential routes include:

- SOL to USOL and USOL to SOL.
- USDC to USOL and USOL to USDC, only where a genuine route exists.

Requirements for any approved implementation:

- Verify a route exists before presenting it.
- Display available quotes and disclose price impact, fees, and slippage where available.
- Present transaction details before wallet approval.
- Require explicit user action and approval inside the user's connected wallet.
- Handle failed, rejected, and unavailable transactions gracefully.
- Never fabricate prices, guaranteed execution, trading pairs, or liquidity pools.
- Never perform real transactions in automated tests.

## 7. Phase Five — USOL Platform and Ecosystem

Potential future areas include community information and announcements, USOL project resources, ecosystem applications and integrations, community participation features, verified project updates, and future USOL utility integrations. These are development possibilities, not claims that such features already exist.

Before implementing any feature involving payments, token transfers, staking, rewards, or smart contracts, prepare a separate technical and security proposal and obtain user approval. Do not create additional token contracts or alter the existing USOL deployment. All proposals and implementations remain subject to root `AGENT.md`.

## 8. Phase Six — Security, Testing, and Optimization

For approved work, test relevant behavior, including:

- Mobile and desktop layouts.
- Navigation and page loading.
- Wallet connection and disconnection, if approved and permitted.
- Public balance retrieval and RPC failure handling, if approved and permitted.
- Swap quote retrieval, transaction review, and wallet approval, if approved and permitted.
- Error messages, accessibility, performance, and security of external integrations.

Preserve existing offline repository tests. Keep offline tests independent of live blockchain services. Never use live transactions in automated tests. Review third-party dependencies before introducing them and avoid unnecessary dependencies. Do not claim tests passed unless they were actually run.

## 9. Phase Seven — Launch and Deployment

For a user-approved launch plan, prepare production-build, domain, hosting, HTTPS, website metadata and search-engine information, social-sharing previews, final mobile and desktop checks, and production-deployment instructions. Do not publish or deploy without explicit user approval. Deployment preparation does not authorize deployment.

## 10. Working Method and Approval Gates

Work with the user one phase at a time. At the beginning of each phase:

1. Explain the objective.
2. Inspect relevant existing code and repository instructions.
3. Propose the implementation.
4. Identify affected files.
5. Identify dependencies and risks, including conflicts with root `AGENT.md`.
6. Wait for user approval before implementation.

After each phase:

1. Summarize files created or modified.
2. Explain functionality implemented.
3. Report tests actually performed and their results.
4. Identify incomplete work.
5. Report security considerations.
6. Wait for user approval before proceeding to another phase.

Do not silently expand the scope of a phase. Do not modify protected token deployment files. Do not commit, push, merge, publish, or deploy without explicit user approval.

## 11. Immediate Task

The current task is to create this development instruction document only. Do not begin Phase One implementation. After creating `agent/SKILL.md`, show the complete document, summarize its sections, confirm which file was created or modified, confirm that no blockchain transaction was performed, and stop for user review.

---

This skill is subordinate to the repository's root `AGENT.md`; it does not override or relax any token-protection, read-only-tooling, security, testing, or approval requirements.
