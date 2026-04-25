# HUSH — Silent Philanthropy. High-Yield. Total Privacy.

![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square&logo=solana)
![Anchor 0.30](https://img.shields.io/badge/Anchor-0.30-blue?style=flat-square)
![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)
![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Overview

HUSH is a confidential Donor-Advised Fund (DAF) engine built on Solana. It allows high-net-worth donors to:

1. **Deposit privately** — Funds arrive at ECDH-derived stealth addresses, breaking the on-chain link between donor identity and DAF balance.
2. **Earn yield autonomously** — An AI agent running inside a MagicBlock Private Ephemeral Rollup rebalances capital across Kamino, Jito, and Marginfi every 5 minutes.
3. **Grant confidentially** — Grant advisories live entirely inside the shielded rollup; charities receive standard USDC transfers from a settlement relay with no cryptographic link to any donor.

### Three Differentiators

| What | Why it matters |
|------|----------------|
| **Stealth address ingress** | No on-chain correlation between deposit address and DAF account |
| **Shielded agentic yield** | Idle capital earns 7–9% APY inside a TEE-protected rollup, never exposed on L1 |
| **Scoped viewing keys** | Donors generate tax receipts for any year, disclosing deposits-only, grants-only, or full history — every use is permanently logged |

---

## Architecture

HUSH is structured as five layers, each addressing a distinct privacy concern:

| # | Layer | Technology | Role |
|---|-------|------------|------|
| 1 | Stealth Ingress | Umbra SDK / ECDH | Unlink deposits from donor identity |
| 2 | Shielded Ledger | MagicBlock PER | Store account state off the public ledger |
| 3 | Agentic Treasury | node-cron / Kamino / Jito | Autonomously maximise yield |
| 4 | Decoupled Payout | Settlement Relay / Anchor | Settle grants without donor linkage |
| 5 | Compliance Interface | Viewing Key / ZK-Tax-Receipt | Auditable selective disclosure |

Full architecture documentation, Mermaid diagrams, and security considerations: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## Monorepo Structure

```
hush-v1/
├── app/                        # @hush/app — Next.js 14 donor dashboard
│   ├── src/
│   │   ├── app/                # App Router pages and layouts
│   │   ├── components/         # shadcn/ui-based React components
│   │   └── lib/                # Hooks, API client, formatters
│   └── package.json
│
├── server/                     # @hush/server — Express API + cron agents
│   ├── src/
│   │   ├── index.ts            # Entry point: server + agents startup
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle SQLite schema + Zod types
│   │   │   ├── client.ts       # DB connection, migrations, init
│   │   │   └── seed.ts         # Demo data seeding
│   │   ├── routes/
│   │   │   ├── accounts.ts     # GET /accounts, /:id, /deposits, /grants, /yield
│   │   │   ├── transactions.ts # POST /:id/deposit, /grant, /rebalance
│   │   │   ├── compliance.ts   # POST /:id/viewing-key
│   │   │   └── index.ts        # Route aggregator
│   │   ├── services/
│   │   │   ├── AccountService.ts     # Business logic: deposits, grants, yield
│   │   │   └── ViewingKeyService.ts  # Key verification, tax receipt generation
│   │   └── agents/
│   │       ├── YieldAgent.ts         # Cron: rebalance yield every 5 min
│   │       └── SettlementRelay.ts    # Poll and settle pending grants
│   └── package.json
│
├── packages/
│   ├── types/                  # @hush/types — shared TypeScript interfaces
│   └── sdk/                   # @hush/sdk — stealth address + API client
│
├── programs/
│   └── hush/                  # Anchor program (Rust)
│       └── src/lib.rs         # shield_deposit, rebalance_yield, advise_grant, settle_grant
│
├── docs/
│   ├── ARCHITECTURE.md        # System design, Mermaid diagrams, security model
│   ├── LOI.md                 # Competition Letter of Intent
│   └── USER_STORIES.md        # All 5 user stories with acceptance criteria
│
├── tests/                     # Anchor integration tests (TypeScript)
│   └── hush.ts
│
├── package.json               # Monorepo root: pnpm workspaces + concurrently
├── .env.example               # All required environment variables
├── Anchor.toml                # Anchor config: program IDs, provider
└── .gitignore
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20.x | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 9.x | `npm install -g pnpm@latest` |
| Rust | stable (1.75+) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Solana CLI | 1.18.x | [solana.com/docs/intro/installation](https://solana.com/docs/intro/installation) |
| Anchor CLI | 0.30.x | `cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked` |
| SQLite | system install | macOS: `brew install sqlite` / Linux: pre-installed |

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

This installs all workspace packages in a single pass using pnpm's hoisted node_modules.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your RPC URL and wallet path. For local development, the defaults work out of the box:

```
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=3001
DB_PATH=./data.db
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Build Anchor programs

```bash
anchor build
```

This compiles the Rust programs in `programs/` and generates TypeScript IDL bindings in `target/idl/` and `target/types/`. The IDL is consumed by `@hush/sdk` and the test suite.

### 5. Run Anchor tests

```bash
anchor test --skip-local-validator
```

This runs against a local test validator spun up by Anchor. The flag `--skip-local-validator` can be omitted if you want a fresh validator per run. See [Testing](#testing) for what each test covers.

Alternatively, to run tests against devnet:

```bash
anchor test --provider.cluster devnet
```

Requires a funded devnet wallet at `ANCHOR_WALLET`.

### 6. Start the development stack

```bash
pnpm dev
```

This uses `concurrently` to run both services in parallel:

- **Server** (`pnpm dev:server`) — `tsx watch` on `server/src/index.ts`, hot-reloads on change. Starts at `http://localhost:3001`. On first boot, runs SQLite migrations and seeds demo data (2 accounts, 4 deposits, 4 grants, 5 yield positions).
- **App** (`pnpm dev:app`) — Next.js dev server on `http://localhost:3000`.

Health check: `curl http://localhost:3001/health`

---

## Program Instructions

| Instruction | Description | Key Accounts | Auth |
|-------------|-------------|--------------|------|
| `shield_deposit` | Accept USDC into the vault, emit ShieldedDeposit event to the PER | `vault`, `depositorToken`, `stealthAddress`, `usdcMint` | Depositor signature |
| `rebalance_yield` | Update yield allocations across protocols (called by AI agent) | `vault`, `yieldAgent`, `kaminoPosition`, `jitoPosition`, `marginfiAccount` | Agent authority |
| `advise_grant` | Create a GrantRequest PDA in the shielded rollup, deduct balance | `vault`, `dafAccount`, `grantRequestPda`, `charityWallet` | DAF account owner |
| `settle_grant` | Execute USDC transfer from settlement escrow to charity wallet | `settlementEscrow`, `grantRequestPda`, `charityTokenAccount`, `usdcMint` | Permissionless relayer |
| `verify_viewing_key` | On-chain viewing key commitment verification | `dafAccount`, `viewingKeyCommitment` | Auditor / owner |

---

## Testing

### Run the full test suite

```bash
anchor test --skip-local-validator
```

### Test coverage (tests/hush.ts)

| Test | Description |
|------|-------------|
| `initializes vault` | Creates the HUSH vault program account with correct authority |
| `shield_deposit: happy path` | Deposits 1000 USDC, verifies ShieldedDeposit event emitted |
| `shield_deposit: invalid stealth key` | Rejects deposit with malformed stealth pubkey |
| `rebalance_yield: updates allocations` | AI agent rebalances 3 protocol allocations, verifies APY update |
| `rebalance_yield: unauthorized agent` | Rejects rebalance from non-agent signer |
| `advise_grant: happy path` | Creates GrantRequest PDA, verifies balance deduction |
| `advise_grant: insufficient balance` | Rejects grant exceeding available balance |
| `settle_grant: permissionless relay` | Any signer can settle a pending grant, verifies USDC transfer |
| `settle_grant: already settled` | Rejects double-settlement of the same GrantRequest PDA |
| `viewing_key: valid key` | Verifies viewing key commitment matches stored hash |

---

## Deployment

### Deploy to devnet

```bash
# Ensure your wallet is funded on devnet
solana airdrop 2 --url devnet

# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID> --url devnet
```

After deployment, update `HUSH_PROGRAM_ID` in your `.env` with the deployed program address.

### Update the IDL on-chain

```bash
anchor idl init --filepath target/idl/hush.json <PROGRAM_ID> \
  --provider.cluster devnet
```

This allows clients to fetch the IDL directly from the chain without bundling it.

---

## SDK Usage

### Stealth deposit (client-side)

```typescript
import { HushSDK } from '@hush/sdk';

const sdk = new HushSDK({
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID!,
  wallet: connectedWallet,
});

// Generate a one-time stealth address from the account's meta-address
const { stealthAddress, ephemeralPubKey } =
  sdk.stealth.generateAddress(account.stealthMetaAddress);

// Execute the shielded deposit
const { txHash, stealthPubkey } = await sdk.deposit({
  accountId: account.id,
  amountUsdc: 50_000,
  stealthAddress,
  ephemeralPubKey,
});

console.log('Deposit confirmed:', txHash);
// On-chain: only stealthAddress receives USDC — no link to your wallet
```

### Viewing key — generate a tax receipt

```typescript
// Request a tax receipt for fiscal year 2024
const receipt = await sdk.compliance.getTaxReceipt({
  accountId: account.id,
  viewingKey: 'vk_your_private_viewing_key',
  taxYear: 2024,
  scope: 'full', // 'deposits_only' | 'grants_only' | 'full'
});

console.log('Total donated:', receipt.totalGrants, 'USDC');
console.log('ZK receipt hash:', receipt.zkReceiptHash);
// Share zkReceiptHash with your accountant for IRS verification
```

---

## Track Alignment

### Umbra Privacy Side Track

HUSH integrates the Umbra stealth address protocol for all deposit ingress:

- Each DAF account publishes a `stealthMetaAddress` derived from the owner's spend key and view key
- Deposits use `generateStealthAddress(stealthMetaAddress, ephemeralKey)` — one-time addresses, no address reuse
- The `verify_viewing_key` instruction implements Umbra's viewing key disclosure model with scope control

### MagicBlock Privacy Track

All confidential state lives inside a MagicBlock Private Ephemeral Rollup:

- DAF account balances, yield positions, and grant advisories are never written to the Solana L1 public ledger
- The AI Yield Agent runs as a TEE-attested process inside the MagicBlock execution environment
- Grant settlements commit from the PER to L1 as standard USDC transfers, preserving payout unlinkability

---

## License

MIT — see [LICENSE](./LICENSE)

---

*HUSH is a PoC submission. Cryptographic guarantees described in this README are production design targets. The PoC simulates stealth addresses, MagicBlock PER state, and ZK receipts; production integration with Umbra SDK, MagicBlock SDK, and a Groth16 circuit is on the roadmap.*
