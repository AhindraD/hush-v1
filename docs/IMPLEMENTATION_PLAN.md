# Implementation Plan: Hush Protocol (v2)

## Objective
Rebuild the Hush Protocol (a confidential Donor-Advised Fund) from scratch, utilizing the latest Solana ecosystem tools: Next.js 15, Solana Gill SDK, Anchor ~0.30, Umbra SDK, and MagicBlock Ephemeral Rollups. The project will use a strict monorepo structure, prioritize MagicBlock native state storage (no local database), and use on-chain automation for the AI Yield Agent.

## Scope & Impact
- **Monorepo Setup:** `pnpm` workspaces for `app/` (Next.js), `programs/hush` (Anchor), and `packages/`.
- **On-chain Program:** Highly modular. Account states in `programs/hush/src/states/` (one file per state). Instructions in `programs/hush/src/instructions/`. Use `INIT_SPACE` for account sizing. Strict adherence to safe Rust practices (e.g., `checked_add`, `checked_sub`).
- **Backend Flow:** Completely stateless backend. We will drop the v1 Express+SQLite setup and instead use Next.js API Routes (Server Actions) acting as a gateway to query the MagicBlock Private Ephemeral Rollup (PER).
- **Yield Agent:** Fully on-chain automation. Instead of a Node.js cron job, the yield agent will utilize an on-chain trigger (e.g., Clockwork or MagicBlock native automation) to rebalance funds.
- **UI Design Process:** We will adopt a "Premium Fintech" aesthetic (dark mode, stark minimal layout, clean typography). We will walk through the design using wireframing, color palette selection (Brand Design), and component assembly using `shadcn/ui`.

## Phase 1: Workspace & Architecture Setup
1. Initialize a `pnpm` monorepo.
2. Scaffold `app` with Next.js 15.
3. Scaffold `programs/hush` using `anchor init` (v0.30).
4. Configure `@gillsdk/react` and `@solana/kit` in the frontend.

## Phase 2: Modular On-Chain Program
1. **States:** Create `states/daf_account.rs`, `states/vault.rs`, `states/grant_request.rs`. Implement the `InitSpace` macro for all.
2. **Instructions:** Create `instructions/shield_deposit.rs`, `instructions/advise_grant.rs`, `instructions/settle_grant.rs`, `instructions/rebalance_yield.rs`.
3. **Logic:** Implement safe math (`checked_add`, etc.).
4. **Automation:** Integrate on-chain cron logic for `rebalance_yield`.
5. **Testing:** Write comprehensive Anchor integration tests covering the new modular structure and safe math verifications.

## Phase 3: Backend Flow (MagicBlock Native)
1. Setup Next.js API Routes to interact directly with MagicBlock PER RPC endpoints.
2. Implement Umbra SDK inside the API/Client for stealth address derivation and viewing key validation.
3. Remove all SQLite dependencies; state is queried on-demand.

## Phase 4: UI Design Process & Implementation
1. **Brand Design:** Generate a high-contrast, premium dark mode color palette.
2. **Components:** Implement standard fintech charts (yield performance), masked balances, and stealth deposit modals.
3. **Integration:** Connect the Gill SDK hooks for wallet connection and transaction signing.

## Verification & Testing
- **Tests:** Run Anchor tests via local validator (`anchor test`).
- **End-to-End:** Simulate a full user journey: deposit via stealth address, trigger on-chain yield rebalance, advise a grant, and verify settlement.