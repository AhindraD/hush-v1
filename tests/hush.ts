/**
 * HUSH — Confidential Philanthropy Engine
 * Anchor PoC test suite
 *
 * Coverage:
 *  1.  initialize_vault  — happy path
 *  2.  shield_deposit    — happy path
 *  3.  shield_deposit    — sad path: amount = 0 → AmountZero
 *  4.  advise_grant      — happy path
 *  5.  advise_grant      — sad path: amount > balance → InsufficientShieldedBalance
 *  6.  settle_grant      — happy path
 *  7.  settle_grant      — sad path: already settled → GrantAlreadySettled
 *  8.  settle_grant      — sad path: wrong authority → UnauthorizedSettler
 *  9.  rebalance_yield   — happy path
 *  10. rebalance_yield   — sad path: non-authority caller → UnauthorizedSettler
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN, AnchorError } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { Hush } from "../target/types/hush";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the global vault PDA. */
function findVaultPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("hush_vault")], programId);
}

/** Derive the ShieldedAccount PDA for a given stealth pubkey. */
function findShieldedAccountPda(
  stealthPubkey: Uint8Array,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("shielded"), Buffer.from(stealthPubkey)],
    programId
  );
}

/** Derive the GrantRequest PDA for a donor + grant nonce. */
function findGrantRequestPda(
  donor: PublicKey,
  grantNonce: BN,
  programId: PublicKey
): [PublicKey, number] {
  const nonceBuf = Buffer.alloc(8);
  nonceBuf.writeBigUInt64LE(BigInt(grantNonce.toString()));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("grant"), donor.toBuffer(), nonceBuf],
    programId
  );
}

/** Airdrop SOL and wait for confirmation. */
async function airdrop(
  connection: anchor.web3.Connection,
  pubkey: PublicKey,
  sol = 2
): Promise<void> {
  const sig = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, "confirmed");
}

/** Assert an instruction fails with a specific Anchor error code. */
async function assertAnchorError(
  promise: Promise<unknown>,
  errorCode: string
): Promise<void> {
  try {
    await promise;
    assert.fail(`Expected error "${errorCode}" but instruction succeeded.`);
  } catch (err: unknown) {
    if (err instanceof AnchorError) {
      assert.equal(
        err.error.errorCode.code,
        errorCode,
        `Expected "${errorCode}" but got "${err.error.errorCode.code}": ${err.message}`
      );
    } else {
      // Re-throw so the test still fails with a useful message.
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("hush", () => {
  // ------------------------------------------------------------------
  // Global setup shared across all tests
  // ------------------------------------------------------------------
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Hush as Program<Hush>;
  const connection = provider.connection;

  // Keypairs
  const authority = (provider.wallet as anchor.Wallet).payer; // vault authority
  const donor = Keypair.generate();
  const charity = Keypair.generate();
  const nonAuthority = Keypair.generate(); // unprivileged signer

  // Token mint (mocked USDC — 6 decimals)
  let usdcMint: PublicKey;

  // PDAs (derived once in before())
  let vaultPda: PublicKey;
  let vaultBump: number;

  // Stealth key (32-byte mock — in production this is an ECDH output)
  const stealthKey = new Uint8Array(32).fill(0xab);
  const encryptedRandom = new Uint8Array(32).fill(0xcd);
  const memoHash = new Uint8Array(32).fill(0xef);

  // Deposit/grant amounts (USDC micro-units, 6 decimals → 1 USDC = 1_000_000)
  const DEPOSIT_AMOUNT = new BN(10_000_000); // 10 USDC
  const GRANT_AMOUNT = new BN(3_000_000);    //  3 USDC

  before(async () => {
    // Fund all test wallets
    await Promise.all([
      airdrop(connection, donor.publicKey, 5),
      airdrop(connection, charity.publicKey, 1),
      airdrop(connection, nonAuthority.publicKey, 1),
    ]);

    // Derive vault PDA
    [vaultPda, vaultBump] = findVaultPda(program.programId);

    // Create mock USDC mint (authority = provider wallet)
    usdcMint = await createMint(
      connection,
      authority,
      authority.publicKey,
      null,
      6 // decimals
    );

    // Create donor ATA and mint test USDC
    const donorAta = await createAssociatedTokenAccount(
      connection,
      donor,
      usdcMint,
      donor.publicKey
    );

    await mintTo(
      connection,
      authority,
      usdcMint,
      donorAta,
      authority,
      50_000_000 // 50 USDC
    );
  });

  // ------------------------------------------------------------------
  // 1. initialize_vault — happy path
  // ------------------------------------------------------------------
  describe("initialize_vault", () => {
    it("initializes the vault with correct state", async () => {
      const FEE_BPS = 25; // 0.25 %

      await program.methods
        .initializeVault(FEE_BPS)
        .accounts({
          authority: authority.publicKey,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });

      const vault = await program.account.hushVault.fetch(vaultPda);

      assert.ok(
        vault.authority.equals(authority.publicKey),
        "authority mismatch"
      );
      assert.equal(vault.feeBps, FEE_BPS, "fee_bps mismatch");
      assert.ok(vault.totalShielded.eqn(0), "total_shielded should be 0");
      assert.ok(vault.totalGranted.eqn(0), "total_granted should be 0");
      assert.ok(vault.grantNonce.eqn(0), "grant_nonce should be 0");
      assert.equal(vault.bump, vaultBump, "bump mismatch");
    });
  });

  // ------------------------------------------------------------------
  // 2 & 3. shield_deposit
  // ------------------------------------------------------------------
  describe("shield_deposit", () => {
    it("happy path: transfers USDC to vault, creates ShieldedAccount, emits event", async () => {
      const [shieldedPda] = findShieldedAccountPda(stealthKey, program.programId);
      const donorAta = getAssociatedTokenAddressSync(usdcMint, donor.publicKey);
      const vaultAta = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);

      // Listen for the ShieldedDeposit event
      let capturedEvent: anchor.IdlEvents<(typeof program)["idl"]>["ShieldedDeposit"] | null = null;
      const listener = program.addEventListener(
        "ShieldedDeposit",
        (ev) => {
          capturedEvent = ev;
        }
      );

      await program.methods
        .shieldDeposit(
          DEPOSIT_AMOUNT,
          Array.from(stealthKey) as unknown as number[],
          Array.from(encryptedRandom) as unknown as number[]
        )
        .accounts({
          donor: donor.publicKey,
          vault: vaultPda,
          shieldedAccount: shieldedPda,
          usdcMint,
          donorTokenAccount: donorAta,
          vaultTokenAccount: vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([donor])
        .rpc({ commitment: "confirmed" });

      await program.removeEventListener(listener);

      // Verify ShieldedAccount state
      const shielded = await program.account.shieldedAccount.fetch(shieldedPda);
      assert.ok(
        shielded.shieldedBalance.eq(DEPOSIT_AMOUNT),
        `Expected shielded_balance=${DEPOSIT_AMOUNT} but got ${shielded.shieldedBalance}`
      );
      assert.ok(shielded.depositCount.eqn(1), "deposit_count should be 1");

      // Verify vault total
      const vault = await program.account.hushVault.fetch(vaultPda);
      assert.ok(
        vault.totalShielded.eq(DEPOSIT_AMOUNT),
        "vault total_shielded mismatch"
      );

      // Verify vault ATA received the funds
      const vaultAtaBalance = await connection.getTokenAccountBalance(vaultAta);
      assert.equal(
        vaultAtaBalance.value.amount,
        DEPOSIT_AMOUNT.toString(),
        "vault ATA balance mismatch"
      );

      // Verify event was emitted
      // (event listener may fire asynchronously — give it a tick)
      await new Promise((r) => setTimeout(r, 500));
      assert.isNotNull(capturedEvent, "ShieldedDeposit event not emitted");
      assert.ok(
        (capturedEvent as NonNullable<typeof capturedEvent>).amount.eq(DEPOSIT_AMOUNT),
        "event amount mismatch"
      );
    });

    it("sad path: amount = 0 → AmountZero error", async () => {
      const [shieldedPda] = findShieldedAccountPda(stealthKey, program.programId);
      const donorAta = getAssociatedTokenAddressSync(usdcMint, donor.publicKey);
      const vaultAta = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);

      await assertAnchorError(
        program.methods
          .shieldDeposit(
            new BN(0),
            Array.from(stealthKey) as unknown as number[],
            Array.from(encryptedRandom) as unknown as number[]
          )
          .accounts({
            donor: donor.publicKey,
            vault: vaultPda,
            shieldedAccount: shieldedPda,
            usdcMint,
            donorTokenAccount: donorAta,
            vaultTokenAccount: vaultAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([donor])
          .rpc({ commitment: "confirmed" }),
        "AmountZero"
      );
    });
  });

  // ------------------------------------------------------------------
  // 4 & 5. advise_grant
  // ------------------------------------------------------------------
  describe("advise_grant", () => {
    it("happy path: creates GrantRequest, decrements shielded_balance", async () => {
      const [shieldedPda] = findShieldedAccountPda(stealthKey, program.programId);

      // Fetch current grant nonce before the call
      const vaultBefore = await program.account.hushVault.fetch(vaultPda);
      const grantNonce = vaultBefore.grantNonce;

      const [grantPda] = findGrantRequestPda(donor.publicKey, grantNonce, program.programId);

      let capturedEvent: anchor.IdlEvents<(typeof program)["idl"]>["GrantAdvised"] | null = null;
      const listener = program.addEventListener("GrantAdvised", (ev) => {
        capturedEvent = ev;
      });

      await program.methods
        .adviseGrant(
          GRANT_AMOUNT,
          charity.publicKey,
          Array.from(memoHash) as unknown as number[]
        )
        .accounts({
          donor: donor.publicKey,
          vault: vaultPda,
          shieldedAccount: shieldedPda,
          grantRequest: grantPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([donor])
        .rpc({ commitment: "confirmed" });

      await program.removeEventListener(listener);

      // Verify GrantRequest state
      const grant = await program.account.grantRequest.fetch(grantPda);
      assert.ok(grant.donor.equals(donor.publicKey), "donor mismatch");
      assert.ok(grant.charityWallet.equals(charity.publicKey), "charity_wallet mismatch");
      assert.ok(grant.amount.eq(GRANT_AMOUNT), "grant amount mismatch");
      assert.equal(grant.settled, false, "grant should not be settled");
      assert.ok(grant.grantId.eq(grantNonce), "grant_id mismatch");

      // Verify ShieldedAccount balance decremented
      const shielded = await program.account.shieldedAccount.fetch(shieldedPda);
      const expectedBalance = DEPOSIT_AMOUNT.sub(GRANT_AMOUNT);
      assert.ok(
        shielded.shieldedBalance.eq(expectedBalance),
        `Expected balance ${expectedBalance} but got ${shielded.shieldedBalance}`
      );

      // Verify vault nonce incremented
      const vaultAfter = await program.account.hushVault.fetch(vaultPda);
      assert.ok(
        vaultAfter.grantNonce.eq(grantNonce.addn(1)),
        "grant_nonce should have incremented"
      );

      // Verify event
      await new Promise((r) => setTimeout(r, 500));
      assert.isNotNull(capturedEvent, "GrantAdvised event not emitted");
    });

    it("sad path: amount > shielded_balance → InsufficientShieldedBalance error", async () => {
      const [shieldedPda] = findShieldedAccountPda(stealthKey, program.programId);
      const vaultState = await program.account.hushVault.fetch(vaultPda);
      const grantNonce = vaultState.grantNonce;
      const [grantPda] = findGrantRequestPda(donor.publicKey, grantNonce, program.programId);

      // Remaining balance = DEPOSIT_AMOUNT - GRANT_AMOUNT = 7 USDC
      // Request 100 USDC → should fail
      const overAmount = new BN(100_000_000);

      await assertAnchorError(
        program.methods
          .adviseGrant(
            overAmount,
            charity.publicKey,
            Array.from(memoHash) as unknown as number[]
          )
          .accounts({
            donor: donor.publicKey,
            vault: vaultPda,
            shieldedAccount: shieldedPda,
            grantRequest: grantPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([donor])
          .rpc({ commitment: "confirmed" }),
        "InsufficientShieldedBalance"
      );
    });
  });

  // ------------------------------------------------------------------
  // 6, 7, 8. settle_grant
  // ------------------------------------------------------------------
  describe("settle_grant", () => {
    // We use grant_id 0 (created in the advise_grant happy-path above).
    const GRANT_ID = new BN(0);
    let grantPda: PublicKey;
    let vaultAta: PublicKey;
    let charityAta: PublicKey;

    before(async () => {
      [grantPda] = findGrantRequestPda(donor.publicKey, GRANT_ID, program.programId);
      vaultAta = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);
      // Charity ATA may not exist yet — settle_grant creates it via init_if_needed
      charityAta = getAssociatedTokenAddressSync(usdcMint, charity.publicKey);
    });

    it("happy path: transfers USDC to charity, marks grant settled", async () => {
      let capturedEvent: anchor.IdlEvents<(typeof program)["idl"]>["GrantSettled"] | null = null;
      const listener = program.addEventListener("GrantSettled", (ev) => {
        capturedEvent = ev;
      });

      const vaultAtaBalanceBefore = await connection.getTokenAccountBalance(vaultAta);

      await program.methods
        .settleGrant(GRANT_ID)
        .accounts({
          settler: authority.publicKey,
          vault: vaultPda,
          grantRequest: grantPda,
          usdcMint,
          vaultTokenAccount: vaultAta,
          charityTokenAccount: charityAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc({ commitment: "confirmed" });

      await program.removeEventListener(listener);

      // Verify grant is now settled
      const grant = await program.account.grantRequest.fetch(grantPda);
      assert.equal(grant.settled, true, "grant should be settled");

      // Verify charity ATA received USDC
      const charityAtaBalance = await connection.getTokenAccountBalance(charityAta);
      assert.equal(
        charityAtaBalance.value.amount,
        GRANT_AMOUNT.toString(),
        "charity ATA balance mismatch"
      );

      // Verify vault ATA decreased by grant amount
      const vaultAtaBalanceAfter = await connection.getTokenAccountBalance(vaultAta);
      const expected =
        BigInt(vaultAtaBalanceBefore.value.amount) - BigInt(GRANT_AMOUNT.toString());
      assert.equal(
        vaultAtaBalanceAfter.value.amount,
        expected.toString(),
        "vault ATA balance should have decreased"
      );

      // Verify vault totals updated
      const vault = await program.account.hushVault.fetch(vaultPda);
      assert.ok(vault.totalGranted.eq(GRANT_AMOUNT), "total_granted mismatch");

      // Verify event emitted
      await new Promise((r) => setTimeout(r, 500));
      assert.isNotNull(capturedEvent, "GrantSettled event not emitted");
    });

    it("sad path: grant already settled → GrantAlreadySettled error", async () => {
      // grant 0 is already settled from the happy-path test above.
      await assertAnchorError(
        program.methods
          .settleGrant(GRANT_ID)
          .accounts({
            settler: authority.publicKey,
            vault: vaultPda,
            grantRequest: grantPda,
            usdcMint,
            vaultTokenAccount: vaultAta,
            charityTokenAccount: charityAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc({ commitment: "confirmed" }),
        "GrantAlreadySettled"
      );
    });

    it("sad path: wrong authority → UnauthorizedSettler error", async () => {
      // First, create a second grant so we have an unsettled one to try.
      const [shieldedPda] = findShieldedAccountPda(stealthKey, program.programId);
      const vaultState = await program.account.hushVault.fetch(vaultPda);
      const grantNonce2 = vaultState.grantNonce;
      const [grantPda2] = findGrantRequestPda(donor.publicKey, grantNonce2, program.programId);

      await program.methods
        .adviseGrant(
          new BN(1_000_000), // 1 USDC
          charity.publicKey,
          Array.from(memoHash) as unknown as number[]
        )
        .accounts({
          donor: donor.publicKey,
          vault: vaultPda,
          shieldedAccount: shieldedPda,
          grantRequest: grantPda2,
          systemProgram: SystemProgram.programId,
        })
        .signers([donor])
        .rpc({ commitment: "confirmed" });

      // Now attempt to settle with a non-authority account.
      await assertAnchorError(
        program.methods
          .settleGrant(grantNonce2)
          .accounts({
            settler: nonAuthority.publicKey,
            vault: vaultPda,
            grantRequest: grantPda2,
            usdcMint,
            vaultTokenAccount: vaultAta,
            charityTokenAccount: charityAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([nonAuthority])
          .rpc({ commitment: "confirmed" }),
        "UnauthorizedSettler"
      );
    });
  });

  // ------------------------------------------------------------------
  // 9 & 10. rebalance_yield
  // ------------------------------------------------------------------
  describe("rebalance_yield", () => {
    const PROTOCOL = 0; // Kamino
    const REBALANCE_AMOUNT = new BN(5_000_000); // 5 USDC notional

    it("happy path: authority emits RebalanceYield event", async () => {
      let capturedEvent: anchor.IdlEvents<(typeof program)["idl"]>["RebalanceYield"] | null = null;
      const listener = program.addEventListener("RebalanceYield", (ev) => {
        capturedEvent = ev;
      });

      await program.methods
        .rebalanceYield(PROTOCOL, REBALANCE_AMOUNT)
        .accounts({
          authority: authority.publicKey,
          vault: vaultPda,
        })
        .signers([authority])
        .rpc({ commitment: "confirmed" });

      await program.removeEventListener(listener);
      await new Promise((r) => setTimeout(r, 500));

      assert.isNotNull(capturedEvent, "RebalanceYield event not emitted");
      const ev = capturedEvent as NonNullable<typeof capturedEvent>;
      assert.equal(ev.protocol, PROTOCOL, "protocol byte mismatch");
      assert.ok(ev.amount.eq(REBALANCE_AMOUNT), "rebalance amount mismatch");
      assert.isAbove(ev.timestamp.toNumber(), 0, "timestamp should be set");
    });

    it("sad path: non-authority caller → UnauthorizedSettler error", async () => {
      await assertAnchorError(
        program.methods
          .rebalanceYield(PROTOCOL, REBALANCE_AMOUNT)
          .accounts({
            authority: nonAuthority.publicKey,
            vault: vaultPda,
          })
          .signers([nonAuthority])
          .rpc({ commitment: "confirmed" }),
        "UnauthorizedSettler"
      );
    });
  });
});
