/**
 * Starknet Primitives
 *
 * Core types for the Starknet ecosystem.
 */

// ============ Constants ============

/**
 * Field prime P = 2^251 + 17*2^192 + 1
 */
export const FIELD_PRIME =
  0x800000000000011000000000000000000000000000000000000000000000001n;

/**
 * Maximum valid contract address (< 2^251)
 */
export const MAX_CONTRACT_ADDRESS = 1n << 251n;

// ============ Felt252 ============

/**
 * Felt252 - 252-bit field element
 *
 * The fundamental type in Starknet. All values are elements of the
 * finite field F_p where p = 2^251 + 17*2^192 + 1.
 */
export type Felt252Type = Uint8Array & { readonly __tag: 'Felt252' };

/**
 * Input types that can be converted to Felt252
 */
export type Felt252Input = Felt252Type | Uint8Array | string | bigint | number;

/**
 * Create a Felt252 from various input types
 */
export function Felt252(value: Felt252Input): Felt252Type {
  if (typeof value === 'string') {
    return fromHex(value);
  }
  if (typeof value === 'bigint' || typeof value === 'number') {
    return fromBigInt(BigInt(value));
  }
  if (value instanceof Uint8Array) {
    if (value.length !== 32) {
      throw new Error('Felt252 must be exactly 32 bytes');
    }
    return value as Felt252Type;
  }
  return value;
}

/**
 * Create Felt252 from hex string
 */
export function fromHex(hex: string): Felt252Type {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length > 64) {
    throw new Error('Hex string too long for Felt252');
  }
  let value: bigint;
  try {
    value = BigInt('0x' + (clean.length === 0 ? '0' : clean));
  } catch {
    throw new Error('Invalid hex string');
  }
  if (value >= FIELD_PRIME) {
    throw new Error('Value exceeds field prime');
  }

  const bytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }

  return bytes as Felt252Type;
}

/**
 * Create Felt252 from bigint
 */
export function fromBigInt(value: bigint): Felt252Type {
  if (value < 0n) {
    throw new Error('Felt252 cannot be negative');
  }
  if (value >= FIELD_PRIME) {
    throw new Error('Value exceeds field prime');
  }

  const hex = value.toString(16);
  return fromHex(hex);
}

/**
 * Create Felt252 from bytes (validates length)
 */
export function fromBytes(bytes: Uint8Array): Felt252Type {
  if (bytes.length !== 32) {
    throw new Error('Felt252 must be exactly 32 bytes');
  }
  return new Uint8Array(bytes) as Felt252Type;
}

/**
 * Convert Felt252 to hex string
 */
export function toHex(felt: Felt252Type): string {
  return (
    '0x' +
    Array.from(felt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Convert Felt252 to bigint
 */
export function toBigInt(felt: Felt252Type): bigint {
  return BigInt(toHex(felt));
}

/**
 * Check if a Felt252 is valid (< FIELD_PRIME)
 */
export function isValid(felt: Felt252Type): boolean {
  return toBigInt(felt) < FIELD_PRIME;
}

/**
 * Check if a Felt252 is zero
 */
export function isZero(felt: Felt252Type): boolean {
  return felt.every((b) => b === 0);
}

/**
 * Check equality of two Felt252 values
 */
export function equals(a: Felt252Type, b: Felt252Type): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ============ ContractAddress ============

/**
 * ContractAddress - Starknet contract address
 * Must be < 2^251
 */
export type ContractAddressType = Felt252Type & {
  readonly __tag: 'ContractAddress';
};

/**
 * Check if a value is a valid contract address (< 2^251)
 */
export function isValidContractAddress(felt: Felt252Type): boolean {
  return toBigInt(felt) < MAX_CONTRACT_ADDRESS;
}

/**
 * Create a ContractAddress from Felt252 (with validation)
 */
export function ContractAddress(felt: Felt252Input): ContractAddressType {
  const f = Felt252(felt);
  if (!isValidContractAddress(f)) {
    throw new Error('Contract address must be < 2^251');
  }
  return f as ContractAddressType;
}

/**
 * Create a ContractAddress without validation (unsafe)
 */
export function ContractAddressUnchecked(
  felt: Felt252Input
): ContractAddressType {
  return Felt252(felt) as ContractAddressType;
}

// ============ ClassHash ============

/**
 * ClassHash - Contract class identifier
 */
export type ClassHashType = Felt252Type & { readonly __tag: 'ClassHash' };

/**
 * Create a ClassHash from Felt252 (with validation)
 */
export function ClassHash(felt: Felt252Input): ClassHashType {
  const f = Felt252(felt);
  if (!isValid(f)) {
    throw new Error('ClassHash must be a valid felt');
  }
  return f as ClassHashType;
}

/**
 * Create a ClassHash without validation (unsafe)
 */
export function ClassHashUnchecked(felt: Felt252Input): ClassHashType {
  return Felt252(felt) as ClassHashType;
}

// ============ StorageKey ============

/**
 * StorageKey - Storage slot address
 */
export type StorageKeyType = Felt252Type & { readonly __tag: 'StorageKey' };

/**
 * Create a StorageKey from Felt252 (with validation)
 */
export function StorageKey(felt: Felt252Input): StorageKeyType {
  const f = Felt252(felt);
  if (!isValid(f)) {
    throw new Error('StorageKey must be a valid felt');
  }
  return f as StorageKeyType;
}

/**
 * Create a StorageKey without validation (unsafe)
 */
export function StorageKeyUnchecked(felt: Felt252Input): StorageKeyType {
  return Felt252(felt) as StorageKeyType;
}

// ============ Short String ============

/**
 * Maximum length for short strings (31 characters)
 * Short strings are ASCII strings that fit in a single felt252
 */
export const MAX_SHORT_STRING_LENGTH = 31;

/**
 * Check if string contains only ASCII characters
 */
function isASCII(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) return false;
  }
  return true;
}

/**
 * Encode a short string to felt (bigint)
 *
 * Short strings are ASCII strings up to 31 characters that fit in a single felt252.
 * Each character is encoded as its ASCII value.
 *
 * @param str - ASCII string (max 31 characters)
 * @returns Encoded value as bigint
 *
 * @example
 * ```ts
 * encodeShortString('hello') // 448378203247n
 * ```
 */
export function encodeShortString(str: string): bigint {
  if (!isASCII(str)) {
    throw new Error(`${str} is not an ASCII string`);
  }
  if (str.length > MAX_SHORT_STRING_LENGTH) {
    throw new Error(`${str} is too long for short string (max 31 chars)`);
  }
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    result = (result << 8n) | BigInt(str.charCodeAt(i));
  }
  return result;
}

/**
 * Encode a short string to hex
 *
 * @param str - ASCII string (max 31 characters)
 * @returns Hex-encoded felt representation
 */
export function encodeShortStringHex(str: string): string {
  const value = encodeShortString(str);
  return '0x' + value.toString(16);
}

/**
 * Decode a short string from felt
 *
 * @param felt - Felt value as bigint, hex string, or Felt252
 * @returns Decoded ASCII string
 *
 * @example
 * ```ts
 * decodeShortString(448378203247n) // 'hello'
 * decodeShortString('0x68656c6c6f') // 'hello'
 * ```
 */
export function decodeShortString(felt: bigint | string | Felt252Type): string {
  let value: bigint;
  if (typeof felt === 'bigint') {
    value = felt;
  } else if (typeof felt === 'string') {
    value = BigInt(felt.startsWith('0x') ? felt : '0x' + felt);
  } else {
    value = toBigInt(felt);
  }

  if (value === 0n) return '';

  let str = '';
  while (value > 0n) {
    const charCode = Number(value & 0xffn);
    if (charCode !== 0) {
      str = String.fromCharCode(charCode) + str;
    }
    value >>= 8n;
  }
  return str;
}

// ============ Namespace exports ============

export const Felt = {
  from: Felt252,
  fromHex,
  fromBigInt,
  fromBytes,
  toHex,
  toBigInt,
  isValid,
  isZero,
  equals,
  encodeShortString,
  decodeShortString,
  ZERO: Felt252(0n),
  ONE: Felt252(1n),
  TWO: Felt252(2n),
  PRIME: FIELD_PRIME,
  MAX_SHORT_STRING_LENGTH,
} as const;

export const Address = {
  from: ContractAddress,
  fromUnchecked: ContractAddressUnchecked,
  isValid: isValidContractAddress,
  MAX: MAX_CONTRACT_ADDRESS,
} as const;

export const Class = {
  from: ClassHash,
  fromUnchecked: ClassHashUnchecked,
} as const;

export const Storage = {
  from: StorageKey,
  fromUnchecked: StorageKeyUnchecked,
} as const;
