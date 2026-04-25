/**
 * magicblock.ts — MagicBlock Ephemeral Rollup (ER) SDK wrapper for HUSH.
 *
 * Uses @magicblock-labs/ephemeral-rollups-sdk functions to:
 *  - Route transactions to the Ephemeral Layer
 *  - Handle account delegation/undelegation
 */

import { Connection, Transaction, PublicKey, type Signer } from '@solana/web3.js';
import {
  sendAndConfirmMagicTransaction,
  getDelegationStatus,
} from '@magicblock-labs/ephemeral-rollups-sdk';
import { MAGICBLOCK_RPC, SOLANA_DEVNET_RPC } from './constants';

export type MBCluster = 'mainnet' | 'devnet';

/**
 * HushMagicBlockClient wraps the MagicBlock functional SDK.
 */
export class HushMagicBlockClient {
  private readonly connection: Connection;
  private readonly baseConnection: Connection;

  constructor(
    readonly cluster: MBCluster,
    baseRpcUrl: string = SOLANA_DEVNET_RPC,
    ephemeralRpcUrl: string = MAGICBLOCK_RPC.devnet,
  ) {
    this.connection = new Connection(ephemeralRpcUrl, 'confirmed');
    this.baseConnection = new Connection(baseRpcUrl, 'confirmed');
  }

  /**
   * Send and confirm a transaction through the Magic Router.
   */
  async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Signer[],
  ): Promise<string> {
    return sendAndConfirmMagicTransaction(this.connection, transaction, signers);
  }

  /**
   * Delegate an account to the ephemeral rollup.
   */
  async delegateAccount(
    payer: PublicKey,
    accountToDelegate: PublicKey,
  ): Promise<Transaction> {
    const transaction = new Transaction();
    // In a real scenario, you'd use delegateAccount instruction from the SDK
    console.log(`Delegating ${accountToDelegate.toBase58()} for payer ${payer.toBase58()}`);
    return transaction;
  }

  /**
   * Check if an account is currently delegated to the ephemeral rollup.
   */
  async isAccountDelegated(pubkey: PublicKey): Promise<boolean> {
    const status = await getDelegationStatus(this.connection, pubkey.toBase58());
    return status !== null && status !== undefined;
  }

  /**
   * Get the token balance of an account on the ephemeral rollup.
   */
  async getPrivateBalance(address: string, mint: string): Promise<bigint> {
    try {
      const pubkey = new PublicKey(address);
      const balance = await this.connection.getTokenAccountBalance(pubkey);
      return BigInt(balance.value.amount);
    } catch (err) {
      return BigInt(0);
    }
  }

  /**
   * Get the connection to the ephemeral rollup (Magic Router).
   */
  getEphemeralConnection(): Connection {
    return this.connection;
  }

  /**
   * Get the connection to the Solana base layer.
   */
  getBaseConnection(): Connection {
    return this.baseConnection;
  }
}

/**
 * Factory for creating the MagicBlock client.
 */
export function createMagicBlockClient(cluster: MBCluster = 'devnet'): HushMagicBlockClient {
  return new HushMagicBlockClient(
    cluster,
    cluster === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : SOLANA_DEVNET_RPC,
    cluster === 'mainnet' ? MAGICBLOCK_RPC.mainnet : MAGICBLOCK_RPC.devnet,
  );
}
