# HUSH — User Stories

**Version:** 0.1.0  
**Last Updated:** 2025  
**Status:** Approved for PoC sprint

---

## Overview

Five primary personas interact with the HUSH system. Each story is written from the persona's perspective and includes full acceptance criteria and technical implementation notes.

| ID | Persona | Priority |
|----|---------|----------|
| HUSH-001 | The Whale — stealth deposit | P0 |
| HUSH-002 | The AI Agent — yield rebalance | P0 |
| HUSH-003 | The Philanthropist — private state transition | P0 |
| HUSH-004 | The Auditor — viewing key / ZK-Tax-Receipt | P1 |
| HUSH-005 | The Charity — receive standard USDC grant | P1 |

---

## HUSH-001: The Whale — Stealth Deposit

**ID:** HUSH-001  
**Persona:** The Whale  
**Priority:** P0  
**Epic:** Shielded Ingress

### User Story

> As a high-net-worth donor, I want to deposit USDC into my Donor-Advised Fund using a stealth address so that no on-chain observer can link the deposit to my identity or infer the size of my philanthropic reserves.

### Acceptance Criteria

- [ ] The donor's DAF account has a published `stealth_meta_address` (compressed ECDH public key) that is independent of their wallet identity
- [ ] Each deposit generates a unique, one-time stealth address using an ephemeral ECDH key exchange with the donor's stealth meta-address
- [ ] The Solana transaction record shows a USDC transfer to the stealth address with no reference to the DAF account or donor wallet
- [ ] The deposited amount is credited to the donor's shielded balance within one Solana confirmation (~400ms) and is not visible on the public ledger
- [ ] The donor receives a `stealthPubkey` and `txHash` for personal records; no other party can associate these with the donor
- [ ] Subsequent deposits generate entirely different stealth addresses, preventing deposit correlation by amount, time, or address reuse
- [ ] The API endpoint `POST /api/v1/accounts/:id/deposit` validates `amountUsdc` (positive number) and returns 400 with field-level errors on validation failure
- [ ] If the account does not exist, the API returns 404 with a descriptive error message
- [ ] Deposit records are persisted in the `deposits` table with status `confirmed`; account `balanceUsdc` and `totalDeposited` are atomically updated

### Technical Notes

- Stealth address generation: `stealthPubkey = ECDH(ephemeralPrivKey, stealthMetaAddress)` — in PoC, simulated with `crypto.randomBytes(16).toString('hex')` prefixed with `'stealth'`
- In production: integrate Umbra SDK `generateStealthAddress()` which implements ERC-5564 adapted for Solana's ed25519 curve
- The `maskedWallet` field stores the first 4 and last 3 characters of the owner pubkey for display purposes only
- The deposit record's `stealthPubkey` is the donor's proof of ownership for claiming the deposit in the shielded ledger

---

## HUSH-002: The AI Agent — Yield Rebalance

**ID:** HUSH-002  
**Persona:** The AI Yield Agent  
**Priority:** P0  
**Epic:** Agentic Treasury

### User Story

> As an autonomous AI yield agent running inside a MagicBlock Private Ephemeral Rollup, I want to continuously monitor yield protocol APYs and rebalance capital allocations across Kamino, Jito, and Marginfi so that donor capital earns optimal risk-adjusted returns without manual intervention.

### Acceptance Criteria

- [ ] The `YieldAgent` cron job executes on a `*/5 * * * *` schedule (every 5 minutes) and logs `[YieldAgent] Rebalancing ${n} active account(s)`
- [ ] For each active account, all `isActive = true` yield positions are updated with a new APY value incorporating a realistic variance (±0.25%)
- [ ] Yield is accrued on each position based on elapsed time since `lastRebalancedAt`, using the formula: `yieldDelta = allocatedUsdc × (apy/100) × (hoursSinceRebalance/8760)`
- [ ] After rebalancing, `totalYieldAccrued` on the account is incremented by the sum of all yield deltas for that cycle
- [ ] If a previous rebalance cycle is still in progress, the new cycle is skipped and a warning is logged — no duplicate processing
- [ ] The `POST /api/v1/accounts/:id/rebalance` endpoint triggers an on-demand rebalance and returns updated positions with a summary (totalAllocated, weightedApy, totalAccruedYield, rebalancedAt)
- [ ] APY values never drop below 1.0% regardless of variance (floor enforcement)
- [ ] On clean shutdown (`SIGTERM`/`SIGINT`), the YieldAgent's cron job is stopped before process exit
- [ ] All agent activity is logged with ISO timestamp, account ID, protocol list, and average APY

### Technical Notes

- `YieldAgent` uses `node-cron` with `cron.schedule('*/5 * * * *', callback)`
- The `isRunning` guard flag prevents concurrent execution using a simple boolean mutex
- In production: agent submits `rebalance_yield` instruction to the HUSH Vault Program, which executes inside the MagicBlock PER; protocol APY feeds are read from on-chain oracle accounts
- APY variance of ±0.25% per cycle represents realistic protocol rate fluctuation; in production this comes from live Kamino/Jito/Marginfi program state
- The yield accrual formula assumes continuous compounding approximated by hourly snapshots

---

## HUSH-003: The Philanthropist — Private State Transition

**ID:** HUSH-003  
**Persona:** The Philanthropist  
**Priority:** P0  
**Epic:** Confidential Grant Advisory

### User Story

> As a philanthropist with a funded HUSH DAF account, I want to privately advise a grant to a registered charity so that the grant amount and recipient are not visible on the public ledger, while the charity receives standard USDC in their wallet without needing to understand the privacy mechanism.

### Acceptance Criteria

- [ ] The `POST /api/v1/accounts/:id/grant` endpoint accepts `charityWallet`, `charityName`, `amountUsdc`, `taxYear`, and optional `encryptedMemo`
- [ ] Zod validation enforces: `charityWallet` must be ≥32 characters (valid Solana address), `charityName` is required, `amountUsdc` is positive, `taxYear` is between 2020 and current year + 1
- [ ] If account balance is insufficient, the API returns HTTP 422 with message `Insufficient balance. Available: ${x} USDC, requested: ${y} USDC`
- [ ] If the account is not in `active` status, the API returns 400 with an appropriate error
- [ ] On successful advisory creation: account `balanceUsdc` is immediately debited (funds reserved), `totalGranted` is incremented, and a GrantRequest PDA is generated
- [ ] The grant record is created with `status: 'pending'` and transitions to `'settled'` after the `SettlementRelay` processes it (within ~1–2 seconds in PoC)
- [ ] The grant advisory itself (donor identity, amount) does not appear on the Solana public ledger — only the final USDC transfer from the settlement account to the charity wallet is visible
- [ ] A 422 is returned (not 400 or 500) for all balance insufficiency errors; error message includes available and requested amounts

### Technical Notes

- `grantRequestPda` is derived as `SHA-256(grant:${accountId}:${charityWallet}:${Date.now()}).slice(0,44)`
- In production: `grantRequestPda` is a real Solana PDA derived from `[b"grant_request", account_pubkey, sequence_number]` via `Pubkey::find_program_address`
- The `SettlementRelay` processes pending grants on a 10-second polling interval; in PoC the `setTimeout(1000ms)` in `AccountService.createGrant` also triggers settlement for fast demo feedback
- The `encryptedMemo` field holds an encrypted note visible only to the viewing key holder — in production this is ECDH-encrypted with the donor's scan key
- Grant status lifecycle: `pending` → `processing` → `settled` (or `failed`)

---

## HUSH-004: The Auditor — Viewing Key / ZK-Tax-Receipt

**ID:** HUSH-004  
**Persona:** The Auditor (donor's tax professional or IRS agent)  
**Priority:** P1  
**Epic:** Selective Disclosure

### User Story

> As a tax professional acting on behalf of a HUSH donor, I want to verify the donor's charitable contributions for a given tax year using a viewing key so that I can produce a compliant IRS Form 8283 / Schedule A without requiring the donor to expose their full transaction history.

### Acceptance Criteria

- [ ] The `POST /api/v1/accounts/:id/viewing-key` endpoint accepts `viewingKey`, `taxYear`, and optional `scope` (`'deposits_only'`, `'grants_only'`, `'full'`)
- [ ] If the viewing key does not match the account's `viewingKeyHash`, the API returns HTTP 401 with a generic error message (`"Invalid viewing key. Access denied."`) — it does not confirm or deny account existence
- [ ] In `development` mode, any viewing key beginning with `vk_` is accepted for seeded accounts (facilitates frontend development without key management)
- [ ] On successful verification: an `audit_logs` record is created capturing `viewingKeyHash`, `requestedBy`, `taxYear`, `scope`, `totalDeposits`, `totalGrants`, `zkReceiptHash`, and `ipAddress`
- [ ] The response includes a structured `taxReceipt` with: per-deposit records (date, amount, maskedWallet, txHash), per-grant records (date, charityName, charityWallet, amount, settlementTxHash), totals, and a `zkReceiptHash` (SHA-256 commitment)
- [ ] The `zkReceiptHash` is deterministic for a given set of inputs — the auditor can recompute it to verify receipt integrity
- [ ] The response includes a `disclaimer` field noting that a ZK proof is on the production roadmap
- [ ] Audit log entries are append-only and cannot be deleted via the API — every viewing key use is permanently recorded
- [ ] The `GET /api/v1/accounts/:id/audit-logs` endpoint returns the full audit trail ordered by `createdAt` descending

### Technical Notes

- In production, viewing key verification uses a ZK proof: the donor proves knowledge of the viewing key without revealing it, and the proof is verified against an on-chain commitment
- In PoC: SHA-256 of the provided viewing key is compared to the stored `viewingKeyHash`; the `vk_` prefix bypass enables frontend development without cryptographic setup
- The `zkReceiptHash` in PoC is `SHA-256(${accountId}:${taxYear}:${totalDeposited}:${totalGranted}:${timestamp})` — not a genuine ZK proof; production receipt will use Groth16 circuit over the deposit and grant commitment Merkle trees
- The IP address is captured from `X-Forwarded-For` header or `req.socket.remoteAddress` for compliance audit trail completeness
- The `scope` parameter (deposits_only, grants_only, full) controls which data is returned in the receipt without affecting the underlying audit log entry (scope is recorded but full data is always stored)

---

## HUSH-005: The Charity — Receive Standard USDC Grant

**ID:** HUSH-005  
**Persona:** The Charity (registered 501(c)(3) recipient)  
**Priority:** P1  
**Epic:** Decoupled Payout

### User Story

> As a registered charity with a standard Solana USDC wallet, I want to receive grant payments from HUSH donors without needing to understand or integrate any privacy protocol so that I can accept donations from privacy-conscious donors without technical overhead or compliance concerns.

### Acceptance Criteria

- [ ] A charity wallet address (any valid base58 Solana public key) can receive USDC via the HUSH settlement mechanism without installing any custom software or holding any HUSH-specific tokens
- [ ] The USDC transfer visible on-chain comes from a HUSH settlement account — not directly from the donor's wallet — preserving donor anonymity at the payout layer
- [ ] The charity receives exactly the `amountUsdc` specified in the grant advisory, with no fees deducted in the PoC (production may include a configurable protocol fee)
- [ ] A `settlementTxHash` is recorded in the grant record upon settlement, allowing the charity to verify receipt on any Solana block explorer
- [ ] The charity does not need to hold or manage HUSH tokens, viewing keys, or any privacy-related infrastructure — standard USDC-aware wallets (Phantom, Backpack, Squads) are sufficient
- [ ] Grant settlement completes within the PoC's simulated delay (1–2 seconds); in production it completes within Solana's block time after the relayer submits the `settle_grant` instruction
- [ ] If settlement fails (network error, invalid charity wallet), the grant status is marked `failed` and the donor's balance is not restored automatically — a manual reconciliation process is required (documented in admin runbook)
- [ ] The settlement transaction is decoupled from the grant advisory: an observer watching the charity wallet sees standard USDC transfers with no cryptographic link to any donor or DAF account

### Technical Notes

- In PoC: settlement is simulated by `SettlementRelay.simulateOnChainSettlement()` which assigns a random tx hash and transitions status `pending → processing → settled`
- In production: the `settle_grant` Anchor instruction accepts the `GrantRequest` PDA, verifies it is approved, and executes an SPL Token transfer from the HUSH settlement escrow account to `charityWallet`
- The settlement escrow is funded from the HUSH vault pool — not from donor-linked accounts — providing payout unlinkability
- Charity wallet validation in the API uses a minimum length check (≥32 chars) as a proxy for valid base58 encoding; production validates via `Pubkey::from_str()` in the Anchor program
- The decoupled payout design follows the same pattern as Aztec's Noir-based payment relayers, but operates on Solana without ZK overhead at the settlement layer
