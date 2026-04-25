/**
 * hush-client.ts — High-level HUSH client that composes Umbra + MagicBlock.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  HUSH_PROGRAM_ID,
  USDC_MINT_DEVNET,
  USDC_MINT_MAINNET,
  SOLANA_DEVNET_RPC,
} from './constants';
import {
  HushUmbraSession,
} from './umbra';
import {
  HushMagicBlockClient,
  createMagicBlockClient,
} from './magicblock';

export type HushNetwork = 'mainnet' | 'devnet';

export interface HushClientOptions {
  network:  HushNetwork;
  rpcUrl?:  string;
  /** Wallet signer — pass a standard Solana wallet adapter */
  signer?:  any;
}

/**
 * HushClient — unified entry point for the HUSH SDK.
 */
export class HushClient {
  readonly network:   HushNetwork;
  readonly rpcUrl:    string;
  readonly connection: Connection;
  readonly mbClient:  HushMagicBlockClient;

  private umbraSession?: HushUmbraSession;

  private constructor(
    opts: Required<Omit<HushClientOptions, 'signer'>> & { signer?: any },
    mbClient: HushMagicBlockClient,
  ) {
    this.network    = opts.network;
    this.rpcUrl     = opts.rpcUrl;
    this.connection = new Connection(opts.rpcUrl, 'confirmed');
    this.mbClient   = mbClient;
  }

  /** Create and initialise a HushClient. */
  static async create(opts: HushClientOptions): Promise<HushClient> {
    const rpcUrl  = opts.rpcUrl ?? SOLANA_DEVNET_RPC;
    const mbClient = createMagicBlockClient(opts.network === 'mainnet' ? 'mainnet' : 'devnet');

    const client = new HushClient(
      { network: opts.network, rpcUrl, signer: opts.signer },
      mbClient,
    );

    if (opts.signer) {
      client.umbraSession = await HushUmbraSession.create(
        opts.signer,
        opts.network,
        rpcUrl,
      );
    }

    return client;
  }

  // ── Umbra flows ─────────────────────────────────────────────────────────────

  /**
   * Shield USDC from the user's public wallet into Umbra private balance.
   */
  async shieldDeposit(amount: bigint, owner: PublicKey): Promise<Transaction> {
    this.requireUmbra();
    const mint = this.network === 'mainnet'
      ? USDC_MINT_MAINNET.toBase58()
      : USDC_MINT_DEVNET.toBase58();
    return this.umbraSession!.shield(mint, amount, owner);
  }

  /**
   * Send tokens privately to another recipient (anonymous grant).
   */
  async sendPrivateGrant(
    recipient: string,
    amount: bigint,
  ): Promise<Transaction> {
    this.requireUmbra();
    const mint = this.network === 'mainnet'
      ? USDC_MINT_MAINNET.toBase58()
      : USDC_MINT_DEVNET.toBase58();
    return this.umbraSession!.sendPrivate(recipient, mint, amount);
  }

  /**
   * Get private balance from Umbra.
   */
  async getUmbraPrivateBalance(): Promise<bigint> {
    this.requireUmbra();
    const mint = this.network === 'mainnet'
      ? USDC_MINT_MAINNET.toBase58()
      : USDC_MINT_DEVNET.toBase58();
    return this.umbraSession!.getPrivateBalance(mint);
  }

  // ── MagicBlock / ER flows ──────────────────────────────────────────────────

  /**
   * Build a deposit transaction into the MagicBlock ephemeral rollup.
   */
  async buildRollupDeposit(ownerAddress: string, amount: bigint): Promise<Transaction> {
    return this.mbClient.delegateAccount(new PublicKey(ownerAddress), new PublicKey(ownerAddress));
  }

  /**
   * Execute a transaction through the MagicBlock Router (ER-aware).
   */
  async executeTransaction(tx: Transaction, signers: any[]): Promise<string> {
    return this.mbClient.sendAndConfirmTransaction(tx, signers);
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
