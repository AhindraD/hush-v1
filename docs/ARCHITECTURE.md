# HUSH — System Architecture (v2)

## Overview
HUSH is a confidential Donor-Advised Fund (DAF) engine on Solana. Version 2 moves to a fully MagicBlock-native state management system, utilizing the Umbra SDK for stealth interactions and a high-performance Next.js 16 frontend for immersive data visualization and interactive philanthropy.

## 1. System Overview

```mermaid
flowchart TB
    subgraph "Frontend (Next.js 16 + Framer Motion)"
        UI[Immersive Dashboard]
        UMBRA[Umbra SDK Client]
        SDK[HUSH SDK / Anchor]
    end

    subgraph "Execution Layer (MagicBlock PER)"
        PER_STATE[Confidential DAF State]
        AUTO[On-Chain Automation Engine]
        RPC[MagicBlock RPC Gateway]
    end

    subgraph "Solana L1 (Mainnet-Beta / Devnet)"
        VAULT[HUSH Vault Program (Anchor 1.0.2)]
        SA[Stealth Address / PDA]
    end

    UI --> UMBRA
    UMBRA --> SA
    UI --> SDK
    SDK --> RPC
    RPC --> PER_STATE
    AUTO -->|Triggers| VAULT
    SA --> VAULT
    VAULT --> PER_STATE
```

## 2. Technical Stack Detail

### Core Program (Rust/Anchor 1.0.2)
- **Edition 2021**: Uses stable Rust features compatible with the current workspace toolchain.
- **Anchor 1.0.2**: Utilizes modern IDL building and account resolution patterns.
- **MagicBlock Integration**: Native support for ephemeral state transitions and private rollups.

### Immersive Frontend (Next.js 16)
- **High-Fidelity UI**: Powers the landing page with fluid, liquid backgrounds and smooth transitions.
- **HUSH SDK**: Primary interface for transaction building and account observation.
- **Umbra SDK**: Handles ECDH key exchange for generating stealth addresses.

### Testing Strategy
- **Anchor Tests**: Integration tests using the Anchor TypeScript environment.
- **Protocol Verification**: Ensuring stealth address derivation and yield rebalancing logic are sound.

## 3. Monorepo Structure

```text
hush-v1/
├── app/                        # Next.js 16, Framer Motion, Tailwind 4
├── programs/
│   └── hush/                   # Anchor 1.0.2 (Edition 2021)
│       ├── src/
│       │   ├── states/         # daf_account.rs, vault.rs, grant_request.rs
│       │   ├── instructions/   # shield_deposit.rs, advise_grant.rs, rebalance_yield.rs
│       │   └── lib.rs
├── packages/
│   ├── sdk/                    # Umbra SDK & MagicBlock client wrappers
│   └── types/                  # Shared TypeScript interfaces
└── docs/                       # Comprehensive System Documentation
```

## 4. Key Upgrades from v1
- **State Storage:** All account data resides in MagicBlock PER.
- **Yield Agent:** Fully on-chain automation within the PER environment.
- **Frontend:** Immersive UI replaces static layouts.
- **Math Safety:** Mandatory use of `checked_*` arithmetic in all instructions.
- **Account Sizing:** `#[derive(InitSpace)]` used across all state structs.
