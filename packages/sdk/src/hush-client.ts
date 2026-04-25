/**
 * hush-client.ts — High-level HUSH client that composes Umbra + MagicBlock.
 *
 * This is the primary API surface for the HUSH frontend and server. It wires:
 *  - @umbra-privacy/sdk  → stealth ingress (encrypted deposit / UTXO sends)
 *  - MagicBlock PPA REST → private ephemeral rollup transfers + settlement
 *  - @coral-xyz/anchor   → on-chain program interaction
 */

import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {
  HUSH_PROGRAM_ID,
  USDC_MINT_DEVNET,
  USDC_MINT_MAINNET,
  SOLANA_DEVNET_RPC,
} from './constants';
import {
  HushUmbraSession,
  type UmbraDepositResult,
  type UmbraWithdrawResult,
  type UmbraUtxoResult,
} from './umbra';
import {
  PrivatePaymentsClient,
  createPrivatePaymentsClient,
  type MBTxEnvelope,
  type MBPrivateBalance,
} from './magicblock';

export type HushNetwork = 'mainnet' | 'devnet';

export interface HushClientOptions {
  network:  HushNetwork;
  rpcUrl?:  string;
  rpcWsUrl?: string;
  /** Wallet signer — pass an Umbra-compatible signer (createInMemorySigner or wallet shim) */
  signer?:  unknown;
}

/**
 * HushClient — unified entry point for the HUSH SDK.
 *
 * Compose Umbra (stealth ingress) and MagicBlock (shielded ephemeral rollup)
 * into a single coherent API surface.
 *
 * Usage:
 *   const client = await HushClient.create({ network: 'devnet', signer });
 *   await client.registerUmbra();
 *   const deposit = await client.shieldDeposit(1_000_000n); // 1 USDC
 *   const grant   = await client.adviseGrant(npoAddress, 500_000n, 'Education');
 */
export class HushClient {
  readonly network:   HushNetwork;
  readonly rpcUrl:    string;
  readonly rpcWsUrl:  string;
  readonly connection: Connection;
  readonly mbClient:  PrivatePaymentsClient;

  private umbraSession?: HushUmbraSession;

  private constructor(
    opts: Required<HushClientOptions> & { rpcWsUrl: string },
    mbClient: PrivatePaymentsClient,
  ) {
    this.network    = opts.network;
    this.rpcUrl     = opts.rpcUrl;
    this.rpcWsUrl   = opts.rpcWsUrl;
    this.connection = new Connection(opts.rpcUrl, 'confirmed');
    this.mbClient   = mbClient;
  }

  /** Create and initialise a HushClient (does NOT auto-register Umbra). */
  static async create(opts: HushClientOptions): Promise<HushClient> {
    const rpcUrl  = opts.rpcUrl   ?? SOLANA_DEVNET_RPC;
    const rpcWsUrl = opts.rpcWsUrl ?? rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');

    const mbClient = createPrivatePaymentsClient({ cluster: opts.network });

    const client = new HushClient(
      { network: opts.network, rpcUrl, rpcWsUrl, signer: opts.signer },
      mbClient,
    );

    if (opts.signer) {
      client.umbraSession = await HushUmbraSession.create(
        opts.signer,
        opts.network,
        rpcUrl,
        rpcWsUrl,
      );
    }

    return client;
  }

  // ── Umbra flows ─────────────────────────────────────────────────────────────

  /**
   * Register the wallet with Umbra on-chain.
   * Must be called before any deposit/UTXO operations.
   * Safe to call repeatedly (handles key rotation).
   */
  async registerUmbra(): Promise<string[]> {
    this.requireUmbra();
    return this.umbraSession!.register();
  }

  /**
   * Deposit USDC from the user's public wallet into Umbra encrypted balance.
   * This is Step 1 of the HUSH deposit flow — stealth ingress.
   *
   * @param amount - Amount in USDC base units (1 USDC = 1_000_000)
   */
  async shieldDeposit(amount: bigint): Promise<UmbraDepositResult> {
    this.requireUmbra();
    const mint = this.network === 'mainnet'
      ? USDC_MINT_MAINNET.toBase58()
      : USDC_MINT_DEVNET.toBase58();
    return this.umbraSession!.deposit(mint, amount);
  }

  /**
   * Withdraw USDC from Umbra encrypted balance back to public wallet.
   *
   * @param amount - Amount in USDC base units
   */
  async withdrawFromShield(amount: bigint): Promise<UmbraWithdrawResult> {
    this.requireUmbra();
    const mint = this.network === 'mainnet'
      ? USDC_MINT_MAINNET.toBase58()
      : USDC_MINT_DEVNET.toBase58();
    return this.umbraSession!.withdraw(mint, amount);
  }

  // ── MagicBlock Private Payments flows ───────────────────────────────────────

  /**
   * Build a deposit transaction into the MagicBlock ephemeral rollup.
   * Step 2 of HUSH: move shielded funds into the private rollup for yield + grants.
   *
   * @param ownerAddress - Base-58 address of the fund owner
   * @param amount       - USDC base units
   */
  async buildRollupDeposit(ownerAddress: string, amount: bigint): Promise<MBTxEnvelope> {
    return this.mbClient.buildDeposit(ownerAddress, amount);
  }

  /**
   * Build a private transfer inside the MagicBlock ephemeral rollup.
   * Used for internal rebalancing and yield moves — completely off-chain.
   *
   * @param from   - Source address
   * @param to     - Destination address
   * @param amount - USDC base units
   * @param memo   - Optional reference string
   */
  async buildPrivateRollupTransfer(
    from:   string,
    to:     string,
    amount: bigint,
    memo?:  string,
  ): Promise<MBTxEnvelope> {
    return this.mbClient.buildPrivateTransfer(from, to, amount, memo);
  }

  /**
   * Advise a grant — create a private UTXO to the NPO via Umbra (anonymous send).
   * The NPO can claim the UTXO with no on-chain link to the donor.
   *
   * Alternatively, use buildSettlementTransfer() for a MagicBlock-routed payout.
   *
   * @param npoAddress - Recipient NPO wallet address
   * @param amount     - USDC base units
   * @param memo       - Grant purpose / reference
   */
  async adviseGrant(
    npoAddress: string,
    amount:     bigint,
    memo?:      string,
  ): Promise<UmbraUtxoResult> {
    this.requireUmbra();
    const mint = this.network === 'mainnet'
      ? USDC_MINT_MAINNET.toBase58()
      : USDC_MINT_DEVNET.toBase58();
    return this.umbraSession!.sendPrivateGrant(npoAddress, mint, amount);
  }

  /**
   * Build a settlement transfer from rollup → NPO base wallet.
   * Used by the SettlementRelay server-side agent for on-chain grant settlement.
   *
   * @param relayAddress - The HUSH settlement relay address (ephemeral balance holder)
   * @param npoAddress   - Final recipient NPO address
   * @param amount       - USDC base units
   * @param memo         - Grant reference / ID
   */
  async buildGrantSettlement(
    relayAddress: string,
    npoAddress:   string,
    amount:       bigint,
    memo?:        string,
  ): Promise<MBTxEnvelope> {
    return this.mbClient.buildSettlementTransfer(relayAddress, npoAddress, amount, memo);
  }

  /**
   * Query the ephemeral rollup (private) balance for an address.
   */
  async getPrivateBalance(address: string): Promise<MBPrivateBalance> {
    return this.mbClient.getPrivateBalance(address);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private requireUmbra(): void {
    if (!this.umbraSession) {
      throw new Error(
        'HushClient: no Umbra session — pass a signer to HushClient.create()',
      );
    }
  }
}
