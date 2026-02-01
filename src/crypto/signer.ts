/**
 * Signer Interface and Implementations
 *
 * Abstract signing interface with PrivateKeySigner implementation.
 *
 * @module crypto/signer
 */

import {
  Felt252,
  type Felt252Type,
  type Felt252Input,
} from '../primitives/index.js';
import { sign, getPublicKey, poseidonHashMany, type Signature } from './index.js';
import type { TypedData, SignatureArray } from './account-types.js';

// ============ Signer Interface ============

/**
 * Abstract signer interface for account operations
 */
export interface SignerInterface {
  /**
   * Get the public key associated with this signer
   */
  getPubKey(): Promise<string>;

  /**
   * Sign a message hash
   * @param hash - The message hash to sign
   */
  signRaw(hash: Felt252Input): Promise<Signature>;

  /**
   * Sign typed data (SNIP-12 / EIP-712 style)
   * @param typedData - The typed data to sign
   * @param accountAddress - The account address for domain separation
   */
  signMessage(
    typedData: TypedData,
    accountAddress: string
  ): Promise<SignatureArray>;

  /**
   * Sign a transaction hash
   * @param hash - The transaction hash to sign
   */
  signTransaction(hash: Felt252Input): Promise<SignatureArray>;
}

// ============ Private Key Signer ============

/**
 * Signer implementation using a private key
 */
export class PrivateKeySigner implements SignerInterface {
  private readonly privateKey: Felt252Type;
  private publicKey: Felt252Type | null = null;

  /**
   * Create a new PrivateKeySigner
   * @param privateKey - The private key (hex string, bigint, or Felt252)
   */
  constructor(privateKey: Felt252Input) {
    this.privateKey = Felt252(privateKey);
  }

  /**
   * Get the public key (computed lazily and cached)
   */
  async getPubKey(): Promise<string> {
    if (!this.publicKey) {
      this.publicKey = getPublicKey(this.privateKey);
    }
    return this.publicKey.toHex();
  }

  /**
   * Sign a raw message hash
   */
  async signRaw(hash: Felt252Input): Promise<Signature> {
    const hashFelt = Felt252(hash);
    return sign(this.privateKey, hashFelt);
  }

  /**
   * Sign typed data (SNIP-12)
   *
   * The typed data hash is computed as:
   * poseidon("StarkNet Message", domain_hash, account, message_hash)
   */
  async signMessage(
    typedData: TypedData,
    accountAddress: string
  ): Promise<SignatureArray> {
    const messageHash = computeTypedDataHash(typedData, accountAddress);
    const signature = await this.signRaw(messageHash);
    return [signature.r.toBigInt(), signature.s.toBigInt()];
  }

  /**
   * Sign a transaction hash
   */
  async signTransaction(hash: Felt252Input): Promise<SignatureArray> {
    const signature = await this.signRaw(hash);
    return [signature.r.toBigInt(), signature.s.toBigInt()];
  }
}

// ============ Typed Data Hashing (SNIP-12) ============

/**
 * SNIP-12 typed data prefix
 */
const STARKNET_MESSAGE_PREFIX = Felt252(
  0x537461726b4e6574204d657373616765n // "StarkNet Message"
);

/**
 * Compute typed data hash following SNIP-12
 *
 * hash = poseidon(prefix, domain_hash, account, message_hash)
 */
function computeTypedDataHash(
  typedData: TypedData,
  accountAddress: string
): Felt252Type {
  const domainHash = hashDomain(typedData.domain);
  const messageHash = hashStruct(
    typedData.primaryType,
    typedData.message,
    typedData.types
  );

  return poseidonHashMany([
    STARKNET_MESSAGE_PREFIX,
    domainHash,
    Felt252(accountAddress),
    messageHash,
  ]);
}

/**
 * Hash the domain struct
 */
function hashDomain(domain: TypedData['domain']): Felt252Type {
  const elements: Felt252Type[] = [];

  if (domain.name) {
    elements.push(hashShortString(domain.name));
  }
  if (domain.version) {
    elements.push(hashShortString(domain.version));
  }
  if (domain.chainId) {
    elements.push(Felt252(domain.chainId));
  }
  if (domain.revision) {
    elements.push(hashShortString(domain.revision));
  }

  return poseidonHashMany(elements);
}

/**
 * Hash a struct recursively
 */
function hashStruct(
  typeName: string,
  data: Record<string, unknown>,
  types: TypedData['types']
): Felt252Type {
  const typeHash = computeTypeHash(typeName, types);
  const fields = types[typeName] || [];

  const elements: Felt252Type[] = [typeHash];

  for (const field of fields) {
    const value = data[field.name];
    elements.push(hashValue(field.type, value, types));
  }

  return poseidonHashMany(elements);
}

/**
 * Compute type hash for a struct type
 */
function computeTypeHash(
  typeName: string,
  types: TypedData['types']
): Felt252Type {
  const typeString = encodeType(typeName, types);
  return hashShortString(typeString);
}

/**
 * Encode type string (recursive)
 */
function encodeType(typeName: string, types: TypedData['types']): string {
  const fields = types[typeName];
  if (!fields) return typeName;

  const fieldStrings = fields.map((f) => `${f.name}:${f.type}`);
  return `${typeName}(${fieldStrings.join(',')})`;
}

/**
 * Hash a single value based on its type
 */
function hashValue(
  type: string,
  value: unknown,
  types: TypedData['types']
): Felt252Type {
  // Primitive types
  if (type === 'felt' || type === 'felt252') {
    return Felt252(value as Felt252Input);
  }

  if (type === 'string' || type === 'shortstring') {
    return hashShortString(value as string);
  }

  if (type === 'bool') {
    return Felt252(value ? 1n : 0n);
  }

  if (type === 'u128' || type === 'u256') {
    return Felt252(BigInt(value as string | number | bigint));
  }

  // Array types
  if (type.endsWith('*')) {
    const elementType = type.slice(0, -1);
    const arr = value as unknown[];
    const hashes = arr.map((v) => hashValue(elementType, v, types));
    return poseidonHashMany(hashes);
  }

  // Struct types
  if (types[type]) {
    return hashStruct(type, value as Record<string, unknown>, types);
  }

  // Fallback to felt
  return Felt252(value as Felt252Input);
}

/**
 * Hash a short string (< 31 chars) as felt
 */
function hashShortString(str: string): Felt252Type {
  if (str.length > 31) {
    // For long strings, hash as bytes
    const chunks: Felt252Type[] = [];
    for (let i = 0; i < str.length; i += 31) {
      chunks.push(shortStringToFelt(str.slice(i, i + 31)));
    }
    return poseidonHashMany(chunks);
  }
  return shortStringToFelt(str);
}

/**
 * Convert short string to felt (ASCII encoding)
 */
function shortStringToFelt(str: string): Felt252Type {
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    result = result * 256n + BigInt(str.charCodeAt(i));
  }
  return Felt252(result);
}

// ============ Factory Functions ============

/**
 * Create a PrivateKeySigner from a private key
 */
export function createSigner(privateKey: Felt252Input): SignerInterface {
  return new PrivateKeySigner(privateKey);
}
