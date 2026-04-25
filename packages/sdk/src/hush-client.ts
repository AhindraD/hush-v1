/**
 * High-level HUSH program client.
 *
 * Wraps the Anchor-generated program to provide a typed, ergonomic interface
 * for interacting with the HUSH on-chain program.  All methods return
 * Solana transaction signatures on success and throw typed `HushClientError`
 * instances on failure.
 */

import { AnchorProvider, Program, BN, web3 } from '@coral-xyz/anchor';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  HUSH_PROGRAM_ID,
  HUSH_VAULT_SEED,
  SHIELDED_ACCOUNT_SEED,
  GRANT_SEED,
} from './constants';

// ---------------------------------------------------------------------------
// Typed error
// ---------------------------------------------------------------------------

/** Error codes surfaced by `HushClient` methods. */
export type HushClientErrorCode =
  | 'INSUFFICIENT_BALANCE'
  | 'ACCOUNT_NOT_FOUND'
  | 'INVALID_STEALTH_KEY'
  | 'INVALID_GRANT_ID'
  | 'ANCHOR_ERROR'
  | 'UNKNOWN';

/** Typed error thrown by `HushClient` methods. */
export class HushClientError extends Error {
  constructor(
    public readonly code: HushClientErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'HushClientError';
  }
}

// ---------------------------------------------------------------------------
// Parameter shapes
// ---------------------------------------------------------------------------

/** Parameters for `shieldDeposit`. */
export interface ShieldDepositParams {
  /** USDC amount to deposit in raw units (6 decimals). */
  amount: BN;
  /** 32-byte stealth public key (Ed25519) of the recipient shielded account. */
  stealthPubkey: Uint8Array;
  /** Packed `[nonce || ciphertext]` encrypted random from `generateStealthAddress`. */
  encryptedRandom: Uint8Array;
  /** USDC mint public key (typically `USDC_MINT_DEVNET` on devnet). */
  usdcMint: PublicKey;
}

/** Parameters for `adviseGrant`. */
export interface AdviseGrantParams {
  /** 32-byte stealth public key of the donor initiating the grant. */
  stealthPubkey: Uint8Array;
  /** USDC grant amount in raw units (6 decimals). */
  amount: BN;
  /** Destination charity wallet public key. */
  charityWallet: PublicKey;
  /** 32-byte SHA-256 hash of the off-chain memo. */
  memoHash: Uint8Array;
  /** Monotonically increasing grant ID for this stealth key. */
  grantId: BN;
}

// ---------------------------------------------------------------------------
// HushClient
// ---------------------------------------------------------------------------

/**
 * High-level client for the HUSH on-chain program.
 *
 * Instantiate once per session and reuse across operations.
 *
 * @example
 * ```typescript
 * import { AnchorProvider } from '@coral-xyz/anchor';
 * import { HushClient } from '@hush/sdk';
 * import idl from '../idl/hush.json';
 *
 * const provider = AnchorProvider.env();
 * const client = new HushClient(provider, idl);
 *
 * const sig = await client.shieldDeposit({
 *   amount: new BN(1_000_000), // 1 USDC
 *   stealthPubkey,
 *   encryptedRandom,
 *   usdcMint: USDC_MINT_DEVNET,
 * });
 * ```
 */
export class HushClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly program: Program<any>;
  private readonly provider: AnchorProvider;

  /**
   * @param provider - Anchor provider (wallet + connection).
   * @param idl      - The HUSH program IDL JSON object.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(provider: AnchorProvider, idl: any) {
    this.provider = provider;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.program = new Program(idl, HUSH_PROGRAM_ID, provider) as Program<any>;
  }

  // ---------------------------------------------------------------------------
  // PDA helpers
  // ---------------------------------------------------------------------------

  /**
   * Derives the global `HushVault` PDA and its bump seed.
   *
   * The vault is a singleton account seeded with `HUSH_VAULT_SEED`.
   *
   * @returns `[vaultPda, bump]`
   */
  getVaultPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [HUSH_VAULT_SEED],
      HUSH_PROGRAM_ID,
    );
  }

  /**
   * Derives the `ShieldedAccount` PDA for a given stealth public key.
   *
   * Seeds: `[SHIELDED_ACCOUNT_SEED, stealthPubkey]`
   *
   * @param stealthPubkey - 32-byte stealth public key.
   * @returns `[shieldedAccountPda, bump]`
   */
  getShieldedAccountPda(stealthPubkey: Uint8Array): [PublicKey, number] {
    if (stealthPubkey.length !== 32) {
      throw new HushClientError(
        'INVALID_STEALTH_KEY',
        `getShieldedAccountPda: expected 32 bytes, got ${stealthPubkey.length}`,
      );
    }
    return PublicKey.findProgramAddressSync(
      [SHIELDED_ACCOUNT_SEED, stealthPubkey],
      HUSH_PROGRAM_ID,
    );
  }

  /**
   * Derives the `GrantRequest` PDA for a donor's specific grant ID.
   *
   * Seeds: `[GRANT_SEED, donor.toBuffer(), grantId.toBuffer('le', 8)]`
   *
   * @param donor   - The donor's on-chain public key (the signer of the advisory tx).
   * @param grantId - The monotonically increasing grant ID (BN).
   * @returns `[grantPda, bump]`
   */
  getGrantPda(donor: PublicKey, grantId: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [GRANT_SEED, donor.toBuffer(), grantId.toBuffer('le', 8)],
      HUSH_PROGRAM_ID,
    );
  }

  // ---------------------------------------------------------------------------
  // Instructions
  // ---------------------------------------------------------------------------

  /**
   * Deposits USDC from the signer's wallet into a shielded account.
   *
   * On-chain instruction: `shield_deposit`
   *
   * The caller must have already:
   *  1. Generated a stealth address via `generateStealthAddress()`.
   *  2. Approved the vault's USDC token account for the deposit amount.
   *
   * @param params - {@link ShieldDepositParams}
   * @returns The confirmed Solana transaction signature.
   * @throws {HushClientError} On anchor errors or missing accounts.
   */
  async shieldDeposit(params: ShieldDepositParams): Promise<string> {
    const { amount, stealthPubkey, encryptedRandom, usdcMint } = params;

    if (stealthPubkey.length !== 32) {
      throw new HushClientError('INVALID_STEALTH_KEY', 'stealthPubkey must be 32 bytes');
    }

    const [vaultPda] = this.getVaultPda();
    const [shieldedAccountPda] = this.getShieldedAccountPda(stealthPubkey);

    // Derive the vault's USDC token account (the ATA owned by the vault PDA).
    const vaultUsdcAta = await getAssociatedTokenAddress(usdcMint, vaultPda, true);

    // Derive the signer's USDC token account.
    const signerUsdcAta = await getAssociatedTokenAddress(
      usdcMint,
      this.provider.wallet.publicKey,
    );

    try {
      const sig = await this.program.methods
        .shieldDeposit(
          amount,
          Array.from(stealthPubkey),
          Array.from(encryptedRandom),
        )
        .accounts({
          vault: vaultPda,
          shieldedAccount: shieldedAccountPda,
          signerUsdcAta,
          vaultUsdcAta,
          usdcMint,
          signer: this.provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      return sig;
    } catch (err) {
      throw this.wrapAnchorError(err);
    }
  }

  /**
   * Submits a grant advisory from a donor's shielded balance.
   *
   * On-chain instruction: `advise_grant`
   *
   * The shielded account must have sufficient balance to cover `amount`.
   * The grant is created in `Pending` status and requires admin approval
   * before it can be settled.
   *
   * @param params - {@link AdviseGrantParams}
   * @returns The confirmed Solana transaction signature.
   * @throws {HushClientError} On anchor errors, insufficient balance, or invalid params.
   */
  async adviseGrant(params: AdviseGrantParams): Promise<string> {
    const { stealthPubkey, amount, charityWallet, memoHash, grantId } = params;

    if (stealthPubkey.length !== 32) {
      throw new HushClientError('INVALID_STEALTH_KEY', 'stealthPubkey must be 32 bytes');
    }
    if (memoHash.length !== 32) {
      throw new HushClientError(
        'ANCHOR_ERROR',
        `memoHash must be 32 bytes (SHA-256), got ${memoHash.length}`,
      );
    }

    const [vaultPda] = this.getVaultPda();
    const [shieldedAccountPda] = this.getShieldedAccountPda(stealthPubkey);
    const [grantPda] = this.getGrantPda(this.provider.wallet.publicKey, grantId);

    try {
      const sig = await this.program.methods
        .adviseGrant(
          Array.from(stealthPubkey),
          amount,
          Array.from(memoHash),
          grantId,
        )
        .accounts({
          vault: vaultPda,
          shieldedAccount: shieldedAccountPda,
          grant: grantPda,
          charityWallet,
          signer: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      return sig;
    } catch (err) {
      throw this.wrapAnchorError(err);
    }
  }

  // ---------------------------------------------------------------------------
  // Account fetches
  // ---------------------------------------------------------------------------

  /**
   * Fetches and deserializes the global `HushVault` account.
   *
   * @returns The decoded vault account data.
   * @throws {HushClientError} If the account does not exist or cannot be decoded.
   */
  async fetchVault(): Promise<unknown> {
    const [vaultPda] = this.getVaultPda();
    try {
      const vault = await this.program.account['hushVault'].fetch(vaultPda);
      return vault;
    } catch (err) {
      throw this.wrapAnchorError(err, 'ACCOUNT_NOT_FOUND');
    }
  }

  /**
   * Fetches and deserializes a `ShieldedAccount` for a given stealth key.
   *
   * @param stealthPubkey - The 32-byte stealth public key.
   * @returns The decoded shielded account data.
   * @throws {HushClientError} If the account does not exist or cannot be decoded.
   */
  async fetchShieldedAccount(stealthPubkey: Uint8Array): Promise<unknown> {
    const [shieldedAccountPda] = this.getShieldedAccountPda(stealthPubkey);
    try {
      const account = await this.program.account['shieldedAccount'].fetch(shieldedAccountPda);
      return account;
    } catch (err) {
      throw this.wrapAnchorError(err, 'ACCOUNT_NOT_FOUND');
    }
  }

  /**
   * Fetches and deserializes a `GrantRequest` account.
   *
   * @param donor   - The donor's on-chain public key.
   * @param grantId - The monotonically increasing grant ID (BN).
   * @returns The decoded grant request data.
   * @throws {HushClientError} If the grant does not exist or cannot be decoded.
   */
  async fetchGrant(donor: PublicKey, grantId: BN): Promise<unknown> {
    const [grantPda] = this.getGrantPda(donor, grantId);
    try {
      const grant = await this.program.account['grantRequest'].fetch(grantPda);
      return grant;
    } catch (err) {
      throw this.wrapAnchorError(err, 'ACCOUNT_NOT_FOUND');
    }
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Wraps an unknown thrown value into a typed `HushClientError`.
   *
   * Inspects the error for Anchor-specific codes (e.g. `InsufficientFunds`)
   * and maps them to `HushClientErrorCode` values where possible.
   */
  private wrapAnchorError(
    err: unknown,
    fallbackCode: HushClientErrorCode = 'ANCHOR_ERROR',
  ): HushClientError {
    if (err instanceof HushClientError) return err;

    const message = err instanceof Error ? err.message : String(err);

    // Attempt to extract a known Anchor / program error code.
    if (message.includes('InsufficientFunds') || message.includes('insufficient')) {
      return new HushClientError('INSUFFICIENT_BALANCE', message, err);
    }
    if (message.includes('AccountNotFound') || message.includes('Account does not exist')) {
      return new HushClientError('ACCOUNT_NOT_FOUND', message, err);
    }

    return new HushClientError(fallbackCode, message, err);
  }
}
