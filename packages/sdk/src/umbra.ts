/**
 * Umbra-style stealth address primitives for Solana.
 *
 * Adapted from the Umbra protocol (https://app.umbra.cash) to work with
 * Ed25519/X25519 keys on Solana. The ECDH shared-secret derivation uses
 * X25519 (Curve25519 Diffie-Hellman) via nacl.scalarMult, not secp256k1.
 *
 * Security note: These primitives are for demonstration/devnet use.
 * A production deployment would require formal cryptographic auditing.
 */

import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Domain-separated hash helper. Returns the first 32 bytes of SHA-512. */
function domainHash(domain: string, data: Uint8Array): Uint8Array {
  const domainBytes = new TextEncoder().encode(domain);
  const combined = new Uint8Array(domainBytes.length + data.length);
  combined.set(domainBytes, 0);
  combined.set(data, domainBytes.length);
  // nacl.hash is SHA-512; we take the first 32 bytes as our key material.
  return nacl.hash(combined).subarray(0, 32);
}

/** XOR two equal-length byte arrays, returning a new array. */
function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  if (a.length !== b.length) {
    throw new RangeError(`xorBytes: length mismatch (${a.length} vs ${b.length})`);
  }
  const result = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] ^ b[i];
  }
  return result;
}

/** Convert a hex string to a Uint8Array. */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new RangeError('hexToBytes: odd-length hex string');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Convert a Uint8Array to a lowercase hex string. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derives a deterministic viewing key from a wallet secret key.
 *
 * The viewing key allows an auditor or the donor themselves to decrypt
 * incoming stealth deposits without being able to spend funds (no spending
 * key is exposed).
 *
 * @param walletSecretKey - The 64-byte Ed25519 secret key from the wallet.
 * @returns The 32-byte viewing key and its hex encoding.
 */
export function generateViewingKey(walletSecretKey: Uint8Array): {
  viewingKey: Uint8Array;
  viewingKeyHex: string;
} {
  if (walletSecretKey.length !== 64) {
    throw new RangeError('generateViewingKey: walletSecretKey must be 64 bytes');
  }
  const viewingKey = domainHash('hush:viewing_key', walletSecretKey);
  return { viewingKey, viewingKeyHex: bytesToHex(viewingKey) };
}

/**
 * Derives a deterministic spending key from a wallet secret key.
 *
 * The spending key is used (together with the viewing key) to spend funds
 * from a shielded account. It must never be shared.
 *
 * @param walletSecretKey - The 64-byte Ed25519 secret key from the wallet.
 * @returns The 32-byte spending key and its hex encoding.
 */
export function generateSpendingKey(walletSecretKey: Uint8Array): {
  spendingKey: Uint8Array;
  spendingKeyHex: string;
} {
  if (walletSecretKey.length !== 64) {
    throw new RangeError('generateSpendingKey: walletSecretKey must be 64 bytes');
  }
  const spendingKey = domainHash('hush:spending_key', walletSecretKey);
  return { spendingKey, spendingKeyHex: bytesToHex(spendingKey) };
}

// ---------------------------------------------------------------------------
// Stealth address generation
// ---------------------------------------------------------------------------

/**
 * Generates a one-time stealth address for a recipient using ECDH.
 *
 * Protocol:
 * 1. Generate a random ephemeral X25519 keypair `(r, R)`.
 * 2. Compute ECDH shared secret: `S = X25519(r, recipientViewingPubkey)`.
 * 3. Hash `S` with domain separator to get mask `m = H("hush:stealth_mask", S)`.
 * 4. Derive stealth pubkey: `P_stealth = XOR(recipientSpendingPubkey, m)`.
 *    (In a production system this would use EC point addition, not XOR;
 *     this simplified version is sufficient for devnet demonstration.)
 * 5. Encrypt the random scalar `r` to the recipient using nacl.box so they
 *    can recover `P_stealth` later using their viewing key.
 *
 * @param recipientSpendingPubkey - The 32-byte spending public key of the recipient.
 * @param recipientViewingPubkey  - The 32-byte viewing public key of the recipient.
 * @returns Stealth pubkey (32 bytes), encrypted random (80 bytes), and ephemeral pubkey (32 bytes).
 */
export function generateStealthAddress(
  recipientSpendingPubkey: Uint8Array,
  recipientViewingPubkey: Uint8Array,
): {
  stealthPubkey: Uint8Array;
  encryptedRandom: Uint8Array;
  ephemeralPubkey: Uint8Array;
} {
  if (recipientSpendingPubkey.length !== 32) {
    throw new RangeError('generateStealthAddress: recipientSpendingPubkey must be 32 bytes');
  }
  if (recipientViewingPubkey.length !== 32) {
    throw new RangeError('generateStealthAddress: recipientViewingPubkey must be 32 bytes');
  }

  // Step 1: Generate ephemeral X25519 keypair.
  // nacl.box.keyPair() generates Curve25519 keys suitable for DH.
  const ephemeral = nacl.box.keyPair();

  // Step 2: ECDH shared secret S = X25519(ephemeral_privkey, recipientViewingPubkey).
  const sharedSecret = nacl.scalarMult(ephemeral.secretKey, recipientViewingPubkey);

  // Step 3: Hash shared secret with domain separator to produce the mask.
  const mask = domainHash('hush:stealth_mask', sharedSecret);

  // Step 4: XOR spending pubkey with mask to produce the stealth pubkey.
  const stealthPubkey = xorBytes(recipientSpendingPubkey, mask);

  // Step 5: Encrypt the ephemeral secret key to the recipient's viewing pubkey
  // so the recipient can recover the stealth key later.
  // nacl.box uses X25519-XSalsa20-Poly1305.
  const nonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes
  const encryptedPayload = nacl.box(
    ephemeral.secretKey,          // plaintext: the ephemeral private key
    nonce,
    recipientViewingPubkey,       // recipient's Curve25519 public key
    ephemeral.secretKey,          // sender uses same ephemeral key (self-encrypted)
  );

  // Pack nonce + ciphertext together: [24 bytes nonce || ciphertext]
  const encryptedRandom = new Uint8Array(nonce.length + encryptedPayload.length);
  encryptedRandom.set(nonce, 0);
  encryptedRandom.set(encryptedPayload, nonce.length);

  return {
    stealthPubkey,
    encryptedRandom,
    ephemeralPubkey: ephemeral.publicKey,
  };
}

// ---------------------------------------------------------------------------
// Stealth address recovery
// ---------------------------------------------------------------------------

/**
 * Attempts to recover a stealth address using the recipient's viewing and spending keys.
 *
 * Protocol (reversal of `generateStealthAddress`):
 * 1. Extract nonce and ciphertext from `encryptedRandom`.
 * 2. Decrypt the ephemeral secret key using the viewing key via nacl.box.open.
 * 3. Re-derive the shared secret: `S = X25519(ephemeral_privkey, viewingKey)`.
 *    (Note: viewing key is used as both sender and receiver here because the
 *     encryption is self-addressed; see the generation step.)
 * 4. Recompute mask `m = H("hush:stealth_mask", S)`.
 * 5. Recover stealth pubkey: `P_stealth = XOR(spendingKey_pubkey, m)`.
 *
 * @param encryptedRandom  - Packed nonce + ciphertext from `generateStealthAddress`.
 * @param ephemeralPubkey  - The ephemeral public key from `generateStealthAddress`.
 * @param viewingKey       - The recipient's 32-byte viewing key (private scalar).
 * @param spendingKey      - The recipient's 32-byte spending key (private scalar).
 * @returns The recovered 32-byte stealth pubkey, or null if decryption fails.
 */
export function recoverStealthAddress(
  encryptedRandom: Uint8Array,
  ephemeralPubkey: Uint8Array,
  viewingKey: Uint8Array,
  spendingKey: Uint8Array,
): Uint8Array | null {
  if (encryptedRandom.length < nacl.box.nonceLength) {
    return null;
  }

  // Unpack nonce and ciphertext.
  const nonce = encryptedRandom.subarray(0, nacl.box.nonceLength);
  const ciphertext = encryptedRandom.subarray(nacl.box.nonceLength);

  // Derive the viewing public key so we can open the box.
  // The box was encrypted with nacl.box(plaintext, nonce, viewingPubkey, ephemeralSecretKey).
  // Since the sender used the ephemeral key as the "sender" key in the box,
  // we open it with (ciphertext, nonce, ephemeralPubkey, viewingKey).
  const decrypted = nacl.box.open(ciphertext, nonce, ephemeralPubkey, viewingKey);
  if (!decrypted) {
    // Decryption failed — this event was not addressed to this viewing key.
    return null;
  }

  // decrypted is the ephemeral secret key (32 bytes).
  if (decrypted.length !== 32) {
    return null;
  }

  // Re-derive shared secret using the recovered ephemeral secret key.
  const viewingPubkey = nacl.scalarMult.base(viewingKey);
  const sharedSecret = nacl.scalarMult(decrypted, viewingPubkey);

  // Recompute mask.
  const mask = domainHash('hush:stealth_mask', sharedSecret);

  // Recover spending public key.
  const spendingPubkey = nacl.scalarMult.base(spendingKey);

  // XOR with mask to recover the stealth pubkey.
  const stealthPubkey = xorBytes(spendingPubkey, mask);
  return stealthPubkey;
}

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

/**
 * Encodes a viewing key as a human-readable string with a "vk_" prefix.
 *
 * The prefix disambiguates viewing keys from other base-58 encoded values
 * (e.g., wallet addresses or transaction signatures).
 *
 * @param viewingKey - The raw 32-byte viewing key.
 * @returns A base-58 string prefixed with `"vk_"`.
 */
export function encodeViewingKey(viewingKey: Uint8Array): string {
  return `vk_${bs58.encode(viewingKey)}`;
}

/**
 * Decodes a `"vk_"`-prefixed viewing key back to raw bytes.
 *
 * @param encoded - A string previously returned by `encodeViewingKey`.
 * @returns The raw 32-byte viewing key.
 * @throws {Error} If the prefix is missing or the base-58 payload is invalid.
 */
export function decodeViewingKey(encoded: string): Uint8Array {
  if (!encoded.startsWith('vk_')) {
    throw new Error(`decodeViewingKey: expected "vk_" prefix, got "${encoded.slice(0, 8)}…"`);
  }
  const b58 = encoded.slice(3); // strip "vk_"
  const bytes = bs58.decode(b58);
  if (bytes.length !== 32) {
    throw new RangeError(`decodeViewingKey: expected 32 bytes, got ${bytes.length}`);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/**
 * Masks a wallet address for safe display in UIs.
 *
 * Preserves the first 4 and last 4 characters to allow visual verification
 * without exposing the full address.
 *
 * @example maskWalletAddress('HUSHvau1tXGqT1nFDUzGJpyvT1CYS8yEQV8X5LmHHu1')
 * //=> 'HUSH...Hu1'  (wait, 4+4 shown)
 *
 * @param address - Any base-58 encoded Solana address or public key string.
 * @returns A masked string in the form `"<first4>...<last4>"`.
 */
export function maskWalletAddress(address: string): string {
  if (address.length <= 8) {
    return address; // too short to mask meaningfully
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Converts a raw 32-byte stealth pubkey to a `PublicKey` instance.
 *
 * @param stealthPubkey - The 32-byte stealth public key.
 * @returns A `@solana/web3.js` `PublicKey`.
 */
export function stealthPubkeyToPublicKey(stealthPubkey: Uint8Array): PublicKey {
  return new PublicKey(stealthPubkey);
}
