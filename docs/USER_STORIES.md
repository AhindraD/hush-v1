# HUSH — User Stories (v2)

## HUSH-001: The Whale — Stealth Deposit & Immersive Entry
**As a high-net-worth donor,** I want to deposit USDC into my DAF using a stealth address while being guided by a fluid, high-fidelity interface so that no on-chain observer can link the deposit to my identity and I feel confident in the protocol's premium quality.
**Acceptance Criteria:**
- Integration with Umbra SDK for ECDH ephemeral key exchange.
- Next.js client uses Gill SDK to construct declarative transactions.
- Deposit is routed through the HUSH Vault program and state is recorded in MagicBlock PER.
- The landing page features a WebGL-powered "liquid" hero section that reacts to wallet connection.

## HUSH-002: The Autonomous Agent — On-Chain Yield Rebalance
**As an on-chain autonomous yield agent,** I want to continuously monitor yield protocol APYs and rebalance allocations so that donor capital earns optimal returns without human intervention.
**Acceptance Criteria:**
- MagicBlock native automation triggers the `rebalance_yield` instruction.
- Rust implementation strictly uses `checked_add`, `checked_mul`, etc., for all math.
- The instruction is isolated in `programs/hush/src/instructions/rebalance_yield.rs`.
- Rebalance events are visualised in the WebGL dashboard as "energy flows".

## HUSH-003: The Philanthropist — Private State Transition
**As a philanthropist,** I want to privately advise a grant so that the amount and recipient are not visible on the public ledger.
**Acceptance Criteria:**
- Next.js frontend interacts directly with the MagicBlock RPC via Gill SDK to submit the grant advisory.
- The `GrantRequest` state uses `INIT_SPACE` for accurate memory allocation.
- Grant status is privately queryable via the MagicBlock RPC using the donor's session key.

## HUSH-004: The Auditor — MagicBlock Native Viewing Key & Declarative Verification
**As a tax professional,** I want to verify a donor's charitable contributions using a viewing key and ensure the verification logic is robust.
**Acceptance Criteria:**
- The backend queries the MagicBlock PER directly using the viewing key hash (no local SQLite cache).
- Generates a structured JSON tax receipt with a cryptographic proof of inclusion.
- Verification logic is covered by a Gill SDK test suite that simulates the MagicBlock state environment.
- The UI displays the tax receipt in a "glassmorphic" panel with smooth framer-motion entrances.