# HUSH — System Architecture (v2)

## Overview
HUSH is a confidential Donor-Advised Fund (DAF) engine on Solana. Version 2 moves to a fully MagicBlock-native state management system, eliminating off-chain databases, and utilizes the Gill SDK and Umbra SDK for stealth interactions. The frontend features a high-performance WebGL layer for immersive data visualization and interactive philanthropy.

## 1. System Overview

```mermaid
flowchart TB
    subgraph "Frontend (Next.js 15 + Three.js + Gill SDK)"
        UI[Immersive WebGL Dashboard]
        UMBRA[Umbra SDK Client]
        GILL[Gill SDK Declarative Layer]
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
    UI --> GILL
    GILL --> RPC
    RPC --> PER_STATE
    AUTO -->|Triggers| VAULT
    SA --> VAULT
    VAULT --> PER_STATE
```

## 2. Technical Stack Detail

### Core Program (Rust/Anchor 1.0.2)
- **Edition 2024**: Leverages the latest Rust features for safety and clarity.
- **Anchor 1.0.2**: Utilizes modern IDL building and account resolution patterns.
- **MagicBlock Integration**: Native support for ephemeral state transitions and private rollups.

### Immersive Frontend (Next.js 16 + WebGL)
- **Three.js / React Three Fiber**: Powers the "Unicorn.studio" style landing page with fluid, liquid 3D backgrounds.
- **Gill SDK**: Primary interface for declarative transaction building and account observation.
- **Umbra SDK**: Handles ECDH key exchange for generating stealth addresses.

### Testing Strategy (Gill & Kit)
- **Gill-First**: Unit and integration tests primarily use the Gill SDK's high-level abstractions for readable, intent-based testing.
- **@solana/kit**: Reserved for low-level byte-manipulation, raw transaction inspection, and edge cases where Gill abstractions are insufficient.

## 3. Monorepo Structure

```text
hush-v2/
├── app/                        # Next.js 16, Three.js, Gill SDK
├── programs/
│   └── hush/                   # Anchor 1.0.2 (Edition 2024)
│       ├── src/
│       │   ├── states/         # daf_account.rs, vault.rs
│       │   ├── instructions/   # shield_deposit.rs, advise_grant.rs, rebalance_yield.rs
│       │   └── lib.rs
├── packages/
│   ├── sdk/                    # Umbra SDK & MagicBlock client wrappers
│   └── types/                  # Shared TypeScript interfaces
└── docs/                       # Comprehensive System Documentation
```

## 4. Key Upgrades from v1
- **State Storage:** All account data is read directly from MagicBlock PER.
- **Yield Agent:** Fully on-chain automation within the PER environment.
- **Frontend:** Immersive WebGL landing page replaces static HTML/CSS.
- **Math Safety:** Mandatory use of `checked_*` arithmetic in all instructions.
- **Account Sizing:** `#[derive(InitSpace)]` used across all state structs.