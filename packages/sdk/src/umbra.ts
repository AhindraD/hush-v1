/**
 * umbra.ts — Real Umbra Privacy SDK wrapper for HUSH.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getUmbraClient } from '@umbra-privacy/sdk';

export type UmbraNetwork = 'mainnet' | 'devnet';

/**
 * HushUmbraSession wraps the Umbra SDK client.
 */
export class HushUmbraSession {
  private constructor(
    private readonly client: any,
    readonly network: UmbraNetwork,
    private readonly connection: Connection,
  ) {}

  /**
   * Create and initialise an Umbra session.
   */
  static async create(
    wallet: any,
    network: UmbraNetwork,
    rpcUrl: string,
  ): Promise<HushUmbraSession> {
    const connection = new Connection(rpcUrl, 'confirmed');
    // Version 4.0.0 uses rpcUrl and network
    const client = await getUmbraClient({
      network,
      rpcUrl,
      rpcSubscriptionsUrl: rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
      signer: wallet,
    });
    return new HushUmbraSession(client, network, connection);
  }

  /**
   * Shield an SPL token (e.g. USDC).
   * Returns a transaction that must be signed and sent.
   */
  async shield(mint: string, amount: bigint, owner: PublicKey): Promise<Transaction> {
    return this.client.deposit({
      mint: new PublicKey(mint),
      amount: Number(amount),
      owner,
    });
  }

  /**
   * Send tokens privately to another recipient.
   */
  async sendPrivate(
    recipient: string,
    mint: string,
    amount: bigint,
  ): Promise<Transaction> {
    return this.client.transfer({
      mint: new PublicKey(mint),
      amount: Number(amount),
      recipient: new PublicKey(recipient),
    });
  }

  /**
   * Unshield tokens back to public wallet.
   */
  async unshield(mint: string, amount: bigint, destination: PublicKey): Promise<Transaction> {
    return this.client.withdraw({
      mint: new PublicKey(mint),
      amount: Number(amount),
      destination,
    });
  }

  /**
   * Get private balance for a specific mint.
   */
  async getPrivateBalance(mint: string): Promise<bigint> {
    const balance = await this.client.getPrivateBalance(new PublicKey(mint));
    return BigInt(balance);
  }
}
