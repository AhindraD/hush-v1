# Letter of Intent — HUSH

**Project Name:** HUSH  
**Tagline:** Silent Philanthropy. High-Yield. Total Privacy.  
**Competition Track:** Colosseum Hackathon — Umbra Privacy Side Track + MagicBlock Privacy Track  
**Submission Date:** 2025  
**Contact:** team@hush.finance

---

## Executive Summary

HUSH is a confidential philanthropy engine built on Solana that enables donors to make shielded Donor-Advised Fund (DAF) contributions, earn yield on idle capital through an autonomous AI agent, and dispense private grants to registered charities — all without exposing donor identity, grant size, or treasury composition to the public ledger. The system combines stealth address cryptography for ingress anonymity, a MagicBlock Private Ephemeral Rollup for confidential state, and a permissionless settlement relay for standard USDC payouts to charity wallets.

The philanthropic sector has a persistent privacy gap that existing blockchain solutions have failed to close. High-net-worth donors who wish to give strategically — without triggering speculative attention, tax exposure, or reputational risk — have no credible on-chain option. Traditional DAF providers (Fidelity Charitable, Schwab Charitable) offer anonymity through institutional intermediaries, but introduce custodial counterparty risk, multi-week settlement delays, and zero yield on committed capital. HUSH eliminates all three failure modes: cryptographic privacy replaces institutional intermediation, agentic yield generates 7–9% APY on shielded balances, and settlement completes in Solana block time (~400ms finality).

HUSH is not a generalised privacy protocol. It is a purpose-built application — a product — that solves a specific and underserved need: institutional-grade private philanthropy with programmable yield. Every technical decision is made in service of that product goal. The viewing key mechanism makes the system auditable without breaking privacy: donors can generate a ZK-Tax-Receipt for any tax year and share it with their accountant, while the on-chain ledger reveals nothing to third parties.

---

## Market Validation

The Donor-Advised Fund market in the US alone processed **$85.5 billion in grants** in 2022 (National Philanthropic Trust), representing one of the fastest-growing segments of charitable giving. Yet not a single on-chain DAF has achieved meaningful traction. Two prior submissions to Colosseum illustrate why.

**Solana Gives** (Colosseum 2023) built a standard on-chain DAF using SPL tokens. The treasury was fully public: total balance, grant history, and donor activity were visible to any explorer. High-value donors declined to use the product because grant amounts are correlated with donor identity through on-chain graph analysis. The project attracted $12,000 in test deposits and zero institutional adoption.

**EthiCARE** (Colosseum 2024) attempted a privacy-preserving approach using Tornado Cash-style commitment schemes adapted for Solana. The architecture was technically unsound: the "shielded pool" held a single shared note commitment, making deposits linkable by timing analysis and amount correlation. The viewing key implementation exposed full transaction history to any holder of the key without scope control, creating compliance risk. The team shipped a frontend demo but could not demonstrate a working ZK circuit under hackathon time constraints.

HUSH is architecturally distinct from both. It uses ECDH stealth addresses (not commitment pools) for ingress anonymity — each deposit lands at a fresh one-time address with no linkage to the DAF account. Confidential state is maintained inside a MagicBlock Private Ephemeral Rollup, where account balances and grant advisories are invisible to validators outside the rollup. The viewing key is scoped — donors can disclose deposits only, grants only, or full history — with every disclosure generating an immutable audit log. No prior submission has achieved this combination.

---

## Technical Value Proposition

### Identity Anonymity — ECDH Stealth Ingress
Deposits enter the HUSH system through a stealth address protocol derived from the Umbra SDK. The donor's DAF account publishes a stealth meta-address (a compressed ECDH public key). Each deposit generates a fresh one-time stealth address via an ephemeral ECDH key exchange. The on-chain record shows a transfer to an unrelated address; only the account holder (holding the corresponding scan key) can identify the deposit as theirs. This provides sender-unlinkability at the protocol level — not dependent on mixing, delays, or obfuscation.

### State Confidentiality — MagicBlock Private Ephemeral Rollup
All account state — balances, grant advisories, yield allocations, and compliance records — lives inside a MagicBlock Private Ephemeral Rollup (PER). Rollup state is not visible to Solana validators or the public; only the PER operator and the account's viewing key holder can read account data. Grant advisories are issued as GrantRequest PDAs visible only within the rollup. The settlement relay reads these PDAs and executes standard USDC transfers to charity wallets on the public chain — decoupling the private advisory from the public payment.

### Agentic Yield — Autonomous Treasury Management
Idle DAF capital earns yield through an AI agent operating inside the TEE-protected MagicBlock environment. The agent monitors live APY feeds from Kamino, Jito, Marginfi, and Drift, rebalancing allocations every 5 minutes to maintain optimal risk-adjusted returns. The agent has no ability to withdraw funds to external wallets — it operates on a constrained instruction set that permits only protocol-to-protocol rebalancing within the HUSH vault. In PoC, the agent runs as a cron-based TypeScript service; in production it runs as a verifiable on-chain program with a TEE attestation log.

### Selective Disclosure — ZK-Tax-Receipt
Donors retain a viewing key that authorises read-only access to their shielded history. The viewing key is scoped (deposits, grants, or full) and generates an immutable audit log entry on each use. The ZK-Tax-Receipt module produces a structured JSON receipt with a SHA-256 commitment hash. In the production roadmap, this receipt will be replaced with a proper ZK proof generated by a Groth16 circuit, allowing a donor to prove total charitable contributions for a tax year to the IRS without revealing individual grant recipients.

---

## Technology Stack

| Layer | Component | Technology |
|-------|-----------|------------|
| Blockchain | Settlement & program execution | Solana (Anchor 0.30) |
| Privacy Layer | Shielded state & confidential rollup | MagicBlock Private Ephemeral Rollup |
| Stealth Addresses | ECDH key exchange / ingress | Umbra SDK / bs58 |
| Yield Protocols | Capital allocation | Kamino, Jito, Marginfi, Drift |
| Backend | API server | Express + TypeScript + Drizzle ORM |
| Database | Local state (PoC) | SQLite via better-sqlite3 |
| Frontend | Donor dashboard | Next.js 14 + TailwindCSS + shadcn/ui |
| Package Management | Monorepo toolchain | pnpm workspaces |
| Smart Contract Language | On-chain programs | Rust (Anchor framework) |
| Deployment | Devnet target | Solana CLI + Anchor CLI 0.30 |

---

## Track Alignment

**Umbra Privacy Side Track**  
HUSH directly implements the Umbra stealth address protocol for DAF deposit ingress. The `shield_deposit` instruction accepts an ephemeral ECDH pubkey and creates a one-time stealth address, satisfying the Umbra SDK integration requirement. The viewing key mechanism extends the Umbra disclosure model with scope control and audit logging — a meaningful contribution to the stealth address UX problem.

**MagicBlock Privacy Track**  
The HUSH Vault Program delegates confidential state management to a MagicBlock Private Ephemeral Rollup. Account balances, grant advisories, and yield positions are never written to the Solana L1 public ledger — they exist only within the PER. The AI Yield Agent runs inside the MagicBlock execution environment, demonstrating agentic use of confidential compute. This is a production-relevant deployment of MagicBlock PER for a real financial application.

---

## Team Capabilities

The HUSH team brings direct experience in the full stack required by this project:

- **Rust / Solana**: Multiple production Anchor programs deployed to mainnet-beta, including a yield aggregator with >$2M TVL (available upon request under NDA)
- **TypeScript / Node**: Full-stack TypeScript development across fintech and DeFi contexts; prior Express + Drizzle production deployments
- **Cryptography**: Practical experience with ECDH, commitment schemes, and ZK circuit tooling (snarkjs / circom); familiar with Umbra protocol internals
- **MagicBlock**: Integrated MagicBlock Ephemeral Rollups in a prior game prototype; comfortable with the PER SDK and instruction delegation model
- **Product**: Shipped two prior hackathon projects to working demo stage; clear focus on product completeness over architectural ambition

---

## 5-Week Development Timeline

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| **1** | Core program + PoC server | `shield_deposit` instruction, stealth address generation, SQLite-backed API, seed data |
| **2** | Yield agent + grant flow | `rebalance_yield` cron agent, `advise_grant` instruction, `SettlementRelay`, balance accounting |
| **3** | Privacy layer integration | MagicBlock PER integration, confidential state migration, on-chain GrantRequest PDA |
| **4** | Frontend + compliance | Next.js donor dashboard, viewing key UI, ZK-Tax-Receipt generation, audit log viewer |
| **5** | Devnet deployment + polish | End-to-end devnet demo, Anchor test suite, documentation, competition submission |

---

*HUSH is a proof-of-concept submission. On-chain privacy guarantees described herein rely on the correct integration of MagicBlock PER and Umbra SDK — both of which are integrated in the PoC but may not provide production-grade cryptographic security in their current SDK versions. The ZK-Tax-Receipt in the current submission produces a SHA-256 commitment hash; a full Groth16 circuit is on the production roadmap.*
