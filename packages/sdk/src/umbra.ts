/**
 * umbra.ts — Real Umbra Privacy SDK wrapper for HUSH.
 *
 * Uses @umbra-privacy/sdk (https://sdk.umbraprivacy.com/quickstart) to:
 *  - Create an authenticated Umbra client from a browser wallet signer
 *  - Register user on-chain (idempotent)
 *  - Deposit USDC into an encrypted (shielded) balance
 *  - Withdraw USDC from encrypted balance back to public wallet
 *  - Create receiver-claimable UTXOs (private sends to charities / NPOs)
 *  - Scan and claim received UTXOs
 *
 * The Umbra SDK handles all ZK proof generation, encryption, and
 * on-chain program interaction internally.
 */

import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
  getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  getClaimableUtxoScannerFunction,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getUmbraRelayer,
  type UmbraClient,
} from '@umbra-privacy/sdk';
import {
  getCreateReceiverClaimableUtxoFromPublicBalanceProver,
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver,
} from '@umbra-privacy/web-zk-prover';
import { UMBRA_INDEXER_API, UMBRA_RELAYER_API } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UmbraNetwork = 'mainnet' | 'devnet';

export interface UmbraDepositResult {
  queueSignature:    string;
  callbackSignature: string;
}

export interface UmbraWithdrawResult {
  queueSignature:    string;
  callbackSignature: string;
}

export interface UmbraUtxoResult {
  signatures: string[];
}

export interface UmbraClaimResult {
  signatures: string[];
}

// ── HushUmbraSession ──────────────────────────────────────────────────────────

/**
 * HushUmbraSession wraps the Umbra SDK client for a single authenticated wallet.
 *
 * Usage:
 *   const session = await HushUmbraSession.create(walletSigner, 'devnet', rpcUrl, rpcWsUrl);
 *   await session.register();
 *   const result = await session.deposit(mint, 1_000_000n);
 */
export class HushUmbraSession {
  private constructor(
    private readonly client: UmbraClient,
    readonly network: UmbraNetwork,
  ) {}

  /**
   * Create and initialise an Umbra session for the given signer.
   *
   * @param signer       - Any Umbra-compatible signer (createInMemorySigner, or wallet adapter shim)
   * @param network      - 'mainnet' or 'devnet'
   * @param rpcUrl       - Solana JSON-RPC HTTP URL
   * @param rpcWsUrl     - Solana JSON-RPC WebSocket URL
   */
  static async create(
    signer: unknown,
    network: UmbraNetwork,
    rpcUrl: string,
    rpcWsUrl: string,
  ): Promise<HushUmbraSession> {
    const client = await getUmbraClient({
      signer: signer as Parameters<typeof getUmbraClient>[0]['signer'],
      network,
      rpcUrl,
      rpcSubscriptionsUrl: rpcWsUrl,
      indexerApiEndpoint:  UMBRA_INDEXER_API,
    });
    return new HushUmbraSession(client, network);
  }

  /**
   * Register (or re-register) the user on-chain.
   * Safe to call if already registered — the SDK handles key rotation.
   * Enables both confidential balances and anonymous UTXO transfers.
   */
  async register(): Promise<string[]> {
    const register = getUserRegistrationFunction({ client: this.client });
    return register({ confidential: true, anonymous: true });
  }

  /**
   * Deposit an SPL token (typically USDC) from the user's public wallet
   * into their Umbra encrypted balance. This is the stealth ingress step
   * in the HUSH deposit flow.
   *
   * @param mint         - SPL mint address (default: USDC)
   * @param amount       - Amount in base units (e.g. 1_000_000n = 1 USDC)
   */
  async deposit(mint: string, amount: bigint): Promise<UmbraDepositResult> {
    const depositFn = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({
      client: this.client,
    });
    const result = await depositFn(
      this.client.signer.address,
      mint,
      amount,
    );
    return {
      queueSignature:    result.queueSignature,
      callbackSignature: result.callbackSignature,
    };
  }

  /**
   * Withdraw an SPL token from the Umbra encrypted balance back to the
   * user's public wallet.
   *
   * @param mint   - SPL mint address
   * @param amount - Amount in base units
   */
  async withdraw(mint: string, amount: bigint): Promise<UmbraWithdrawResult> {
    const withdrawFn = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({
      client: this.client,
    });
    const result = await withdrawFn(
      this.client.signer.address,
      mint,
      amount,
    );
    return {
      queueSignature:    result.queueSignature,
      callbackSignature: result.callbackSignature,
    };
  }

  /**
   * Create a receiver-claimable UTXO — a private, anonymous transfer to
   * a recipient (e.g. an NPO / charity address). The recipient can claim
   * the tokens with no on-chain link back to the sender.
   *
   * Uses Groth16 ZK proofs via @umbra-privacy/web-zk-prover.
   *
   * @param recipientAddress - Base-58 Solana address of the recipient
   * @param mint             - SPL mint address
   * @param amount           - Amount in base units
   */
  async sendPrivateGrant(
    recipientAddress: string,
    mint: string,
    amount: bigint,
  ): Promise<UmbraUtxoResult> {
    const zkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
    const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
      { client: this.client },
      { zkProver },
    );
    const signatures = await createUtxo({
      destinationAddress: recipientAddress,
      mint,
      amount,
    });
    return { signatures };
  }

  /**
   * Scan the Umbra Merkle tree for UTXOs claimable by this wallet.
   * Returns UTXOs encrypted to this wallet's X25519 key.
   *
   * @param treeIndex  - Which Merkle tree to scan (default: 0)
   * @param startLeaf  - Resume from this leaf index (default: 0)
   */
  async scanUtxos(treeIndex = 0, startLeaf = 0) {
    const scanFn = getClaimableUtxoScannerFunction({ client: this.client });
    return scanFn(treeIndex, startLeaf);
  }

  /**
   * Claim received UTXOs into the wallet's encrypted balance.
   * The claim proves ownership via ZK proof, burning the UTXO
   * and crediting the encrypted balance — no on-chain trace.
   *
   * @param utxos - Array of UTXOs from scanUtxos().received
   */
  async claimUtxos(utxos: Awaited<ReturnType<typeof this.scanUtxos>>['received']): Promise<UmbraClaimResult> {
    if (utxos.length === 0) return { signatures: [] };

    const zkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
    const relayer   = getUmbraRelayer({ apiEndpoint: UMBRA_RELAYER_API });

    const claimFn = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
      { client: this.client },
      { zkProver, relayer },
    );
    const result = await claimFn(utxos);
    return { signatures: Array.isArray(result) ? result : [result as string] };
  }
}
