UnitedSOLANA (USOL) — AGENT.md

Project Objective

Convert the existing UnitedSOLANA project from Devnet to Solana Mainnet.

Remove the existing Devnet configuration and make Mainnet the only supported network in the active project.

Focus on token configuration and Mainnet deployment preparation.

Do not implement or redesign wallet connection or balance features. Preserve the existing Phantom connection functionality.

1. Token Configuration

Use these exact details:

- Token name: "UnitedSOLANA"
- Symbol: "USOL"
- Network: Solana Mainnet
- Token standard: Classic SPL Token
- Decimals: 9
- Initial supply: 1,000,000,000 USOL

Description:

UnitedSOLANA (USOL) is a high-speed community and utility token built on the Solana blockchain. Designed to facilitate seamless decentralized trading, liquidity pairing, and ecosystem transaction fees across Solana dApps

2. Confirmed Wallet Assignments

Fee payer

"FRPPdHqxShm3sGAW4cXvdWRdQa5NHfRUmSUuhaC4e5TU"

Initial token holder / recipient

"HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT"

Mint authority

"HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT"

Freeze authority

"HxDWxdDWoMUErQ3Y3JdiVd9xi23UU9V8fjvbqwkEaurT"

Do not change these assignments.

The fee payer and token holder are separate wallets and must be handled separately.

3. Remove Devnet Configuration

Remove Devnet from the active project.

Inspect the repository and remove or replace:

- Devnet RPC endpoints.
- "clusterApiUrl("devnet")" references.
- Devnet deployment scripts.
- Devnet keypair configuration and references.
- Devnet mint address configuration.
- Devnet-specific deployment settings.
- Devnet-specific metadata configuration.
- Devnet network labels and active UI references.

Do not leave scripts that could accidentally deploy USOL to Devnet.

Do not retain Devnet as a selectable network.

Keep the existing Phantom connection functionality intact.

Do not delete unrelated project files.

The project owner has authorized removal of Devnet configuration. Historical Devnet records do not need to remain in the active deployment code.

4. Mainnet Configuration

Use the official Solana Mainnet RPC endpoint:

"https://api.mainnet-beta.solana.com"

Ensure all active deployment scripts use Mainnet.

Do not simply replace the RPC URL while continuing to use the Devnet keypair.

Prepare secure Mainnet keypair handling.

The fee-payer wallet must be the confirmed FRPP wallet.

The mint authority, freeze authority, and initial holder must use the confirmed HxDW wallet.

5. USOL Mint Address

The USOL Mainnet mint address does not exist yet.

It must be created separately during Mainnet token creation.

The HxDW wallet address is NOT the USOL mint address.

Do not:

- Use HxDW as the mint address.
- Use the old Devnet mint address.
- Invent a mint address.
- Reuse a Devnet mint account.

Prepare a configuration field to store the actual Mainnet mint address after successful creation.

6. Mainnet Token Deployment Preparation

Prepare the code and configuration for:

1. Creating a Classic SPL Token mint on Mainnet.
2. Setting decimals to 9.
3. Assigning the confirmed mint authority.
4. Assigning the confirmed freeze authority.
5. Creating the associated token account for the initial holder.
6. Minting 1 billion USOL to the initial holder.
7. Registering Metaplex metadata with the supplied token details and existing logo.
8. Recording the actual mint address and transaction signatures.

Ensure transaction signing is correctly handled.

The fee payer must authorize fee payments.

The mint account keypair must sign account creation when required.

The authority wallet must sign instructions that require its authorization.

Do not assume that Phantom connection alone authorizes transactions.

7. Token Metadata and Logo

Use the existing project logo.

Use the exact token name, symbol, and description supplied in this document.

Prepare the Mainnet metadata registration.

Do not reuse Devnet metadata account addresses or Devnet metadata transaction signatures.

8. Security

- Never request seed phrases.
- Never request private keys through the website.
- Never expose private key contents.
- Never commit keypair files or secrets.
- Do not hardcode private keys.
- Do not revoke mint authority.
- Do not revoke freeze authority.
- Do not change the confirmed wallet assignments.
- Do not execute unauthorized transactions.

9. Scope and Approval

This task is for Mainnet conversion and deployment preparation.

You may modify the necessary source files, configuration files, and deployment scripts.

However, DO NOT execute:

- Mainnet mint creation.
- Initial supply minting.
- Associated token account creation transactions.
- Metadata registration transactions.
- SOL or token transfers.
- Authority changes.
- Liquidity pool creation.

Do not spend SOL or submit any Mainnet transaction.

Wait for explicit approval from the project owner before executing the launch.

10. Completion Report

After implementation, report:

1. Files inspected.
2. Files modified.
3. Devnet configuration and scripts removed.
4. Mainnet configuration prepared.
5. Confirmed wallet assignments.
6. Deployment scripts prepared.
7. Security measures applied.
8. Tests performed and actual results.
9. Any remaining requirements.

Do not claim that USOL has been created.

The Mainnet mint address will only exist after successful mint creation.

FINAL INSTRUCTION

Remove the existing Devnet configuration from the active project.

Make Solana Mainnet the only supported network.

Prepare UnitedSOLANA using the exact token details and wallet assignments supplied above.

Skip wallet connection implementation and preserve the existing Phantom connection functionality.

Do not execute any Mainnet transactions without explicit approval from the project owner.
