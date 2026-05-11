# HUSH — Silent Philanthropy. High-Yield. Total Privacy. (v2)


![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square&logo=solana)
![Anchor 1.0.2](https://img.shields.io/badge/Anchor-1.0.2-blue?style=flat-square)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Solana Kit](https://img.shields.io/badge/%40solana%2Fweb3.js-1.98-9945FF?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---
<img width="1904" height="829" alt="image" src="https://github.com/user-attachments/assets/e0d7cfde-9bbb-44cb-b10f-ab440e48fd59" />

## Overview

HUSH is a confidential Donor-Advised Fund (DAF) engine built on Solana. It allows high-net-worth donors to:

1. **Deposit privately** — Funds arrive at ECDH-derived stealth addresses, breaking the on-chain link between donor identity and DAF balance.
2. **Earn yield autonomously** — An on-chain agent running inside a MagicBlock Private Ephemeral Rollup rebalances capital across Kamino, Jito, and Marginfi.
3. **Grant confidentially** — Grant advisories live entirely inside the shielded rollup; charities receive standard USDC transfers from a settlement relay with no cryptographic link to any donor.

### Three Differentiators

| What | Why it matters |
|------|----------------|
| **Stealth address ingress** | No on-chain correlation between deposit address and DAF account |
| **Shielded agentic yield** | Idle capital earns 7–9% APY inside a TEE-protected rollup, never exposed on L1 |
| **MagicBlock Native State** | Accounts, balances, and advisories are fully confidential, residing off the public L1 ledger |

---

## Architecture

HUSH is structured as five layers, each addressing a distinct privacy concern:

| # | Layer | Technology | Role |
|---|-------|------------|------|
| 1 | Stealth Ingress | Umbra SDK / ECDH | Unlink deposits from donor identity |
| 2 | Shielded Ledger | MagicBlock PER | Store account state off the public ledger |
| 3 | Agentic Treasury | Yield Agent / PER | Autonomously maximise yield |
| 4 | Decoupled Payout | Settlement Relay / Anchor | Settle grants without donor linkage |
| 5 | Compliance Interface | Viewing Key / ZK-Tax-Receipt | Auditable selective disclosure |

Full architecture documentation, Mermaid diagrams, and security considerations: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## Monorepo Structure

```
hush-v1/
├── app/                        # @hush/app — Next.js 16 donor dashboard
│   ├── src/
│   │   ├── app/                # App Router pages and layouts
│   │   ├── components/         # shadcn/ui-based React components
│   │   └── lib/                # Hooks, API client, formatters
│   └── package.json
│
├── server/                     # @hush/server — Express API + Settlement Relay
│   ├── src/
│   │   ├── index.ts            # Entry point: server + agents startup
│   │   ├── agents/
│   │       ├── YieldAgent.ts         # Logic for rebalancing yield
│   │       └── SettlementRelay.ts    # Poll and settle pending grants
│   └── package.json
│
├── packages/
│   ├── types/                  # @hush/types — shared TypeScript interfaces
│   └── sdk/                   # @hush/sdk — stealth address + API client
│
├── programs/
│   └── hush/                  # Anchor program (Rust)
│       └── src/lib.rs         # initialize_vault, create_daf_account, shield_deposit, rebalance_yield, advise_grant, settle_grant
│
├── docs/
│   ├── ARCHITECTURE.md        # System design, Mermaid diagrams, security model
│   ├── LOI.md                 # Competition Letter of Intent
│   └── USER_STORIES.md        # All user stories with acceptance criteria
│
├── tests/                     # Anchor integration tests (TypeScript)
│   └── hush.ts
│
├── package.json               # Monorepo root: pnpm workspaces
├── Anchor.toml                # Anchor config: program IDs, provider
└── .gitignore
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20.x | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 10.x | `npm install -g pnpm@latest` |
| Rust | stable (1.75+) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Solana CLI | 1.18.x | [solana.com/docs/intro/installation](https://solana.com/docs/intro/installation) |
| Anchor CLI | 1.0.2 | `cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked` |

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/your-org/hush-v1.git
cd hush-v1
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

### 4. Build Anchor programs

```bash
anchor build
```

### 5. Run Anchor tests

```bash
anchor test
```

---

## Program Instructions

| Instruction | Description | Key Accounts | Auth |
|-------------|-------------|--------------|------|
| `initialize_vault` | Setup the global HUSH vault and authorities | `vault`, `yieldAgent`, `settlementEscrow` | Payer |
| `create_daf_account`| Create a new confidential DAF account | `dafAccount`, `payer` | Payer |
| `shield_deposit` | Accept USDC into the vault, emit ShieldedDeposit event | `vault`, `depositorToken`, `stealthAddress` | Depositor |
| `advise_grant` | Advise a grant to a charity, deducted from shielded balance | `vault`, `dafAccount`, `charityWallet` | DAF Owner |
| `settle_grant` | Settle a pending grant by transferring USDC to charity | `settlementEscrow`, `charityTokenAccount` | Relay |
| `rebalance_yield` | Update yield allocations across protocols | `vault`, `yieldAgent` | Agent |

---

## Track Alignment

### Umbra Privacy Side Track

HUSH integrates the Umbra stealth address protocol for all deposit ingress, ensuring no on-chain correlation between deposit address and DAF account.

### MagicBlock Privacy Track

All confidential state lives inside a MagicBlock Private Ephemeral Rollup (PER). DAF balances and grant advisories are never written to the Solana L1 public ledger.

---

## License

MIT — see [LICENSE](./LICENSE)
