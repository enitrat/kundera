/**
 * Starknet Primitives
 *
 * Core types for the Starknet ecosystem.
 */

declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

// ============ Constants ============

/**
 * Field prime P = 2^251 + 17*2^192 + 1
 */
export const FIELD_PRIME =
  0x800000000000011000000000000000000000000000000000000000000000001n;

/**
 * Maximum valid contract address (< 2^251)
 */
export const MAX_ADDRESS = 1n << 251n;
export const MAX_CONTRACT_ADDRESS = MAX_ADDRESS;

/**
 * Maximum valid ETH address (< 2^160)
 */
export const MAX_ETH_ADDRESS = 1n << 160n;

// ============ Felt252 ============

export interface FeltMethods {
  toHex(): string;
  toBigInt(): bigint;
  isValid(): boolean;
  isZero(): boolean;
  equals(other: Felt252Type): boolean;
}

/**
 * Felt252 - 252-bit field element
 *
 * The fundamental type in Starknet. All values are elements of the
 * finite field F_p where p = 2^251 + 17*2^192 + 1.
 */
export type Felt252Type = Brand<Uint8Array, 'Felt252'> & FeltMethods;

/**
 * Input types that can be converted to Felt252
 */
export type Felt252Input = Felt252Type | Uint8Array | string | bigint | number;

const feltPrototype = Object.create(Uint8Array.prototype) as FeltMethods;

// ============ Short String ============

/**
 * Maximum length for short strings (31 characters)
 * Short strings are ASCII strings that fit in a single felt252
 */
export const MAX_SHORT_STRING_LENGTH = 31;

function bytesToHex(bytes: Uint8Array): string {
  return (
    '0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

function toBigIntInternal(bytes: Uint8Array): bigint {
  return BigInt(bytesToHex(bytes));
}

Object.defineProperties(feltPrototype, {
  toHex: {
    value: function toHex(this: Uint8Array): string {
      return bytesToHex(this);
    },
  },
  toBigInt: {
    value: function toBigInt(this: Uint8Array): bigint {
      return toBigIntInternal(this);
    },
  },
  isValid: {
    value: function isValid(this: Uint8Array): boolean {
      return toBigIntInternal(this) < FIELD_PRIME;
    },
  },
  isZero: {
    value: function isZero(this: Uint8Array): boolean {
      for (const byte of this) {
        if (byte !== 0) return false;
      }
      return true;
    },
  },
  equals: {
    value: function equals(this: Uint8Array, other: Felt252Type): boolean {
      if (this.length !== other.length) return false;
      for (let i = 0; i < this.length; i++) {
        if (this[i] !== other[i]) return false;
      }
      return true;
    },
  },
});

function withFeltPrototype(bytes: Uint8Array): Felt252Type {
  if (Object.getPrototypeOf(bytes) !== feltPrototype) {
    Object.setPrototypeOf(bytes, feltPrototype);
  }
  return bytes as Felt252Type;
}

function fromHexInternal(hex: string): Felt252Type {
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

  return withFeltPrototype(bytes);
}

function fromBigIntInternal(value: bigint): Felt252Type {
  if (value < 0n) {
    throw new Error('Felt252 cannot be negative');
  }
  if (value >= FIELD_PRIME) {
    throw new Error('Value exceeds field prime');
  }

  const hex = value.toString(16);
  return fromHexInternal(hex);
}

function fromBytesInternal(bytes: Uint8Array): Felt252Type {
  if (bytes.length !== 32) {
    throw new Error('Felt252 must be exactly 32 bytes');
  }
  return withFeltPrototype(new Uint8Array(bytes));
}

function createFelt(value: Felt252Input): Felt252Type {
  if (typeof value === 'string') {
    return fromHexInternal(value);
  }
  if (typeof value === 'bigint' || typeof value === 'number') {
    return fromBigIntInternal(BigInt(value));
  }
  if (value instanceof Uint8Array) {
    if (value.length !== 32) {
      throw new Error('Felt252 must be exactly 32 bytes');
    }
    return withFeltPrototype(value);
  }
  return withFeltPrototype(value);
}

const feltZero = createFelt(0n);
const feltOne = createFelt(1n);
const feltTwo = createFelt(2n);

/**
 * Create a Felt252 from various input types
 */
export const Felt252 = Object.assign(createFelt, {
  from: createFelt,
  fromHex: fromHexInternal,
  fromBigInt: fromBigIntInternal,
  fromBytes: fromBytesInternal,
  isValid: (felt: Felt252Type) => felt.isValid(),
  isZero: (felt: Felt252Type) => felt.isZero(),
  equals: (a: Felt252Type, b: Felt252Type) => a.equals(b),
  toHex: (felt: Felt252Type) => felt.toHex(),
  toBigInt: (felt: Felt252Type) => felt.toBigInt(),
  ZERO: feltZero,
  ONE: feltOne,
  TWO: feltTwo,
  PRIME: FIELD_PRIME,
  MAX_SHORT_STRING_LENGTH,
  encodeShortString,
  encodeShortStringHex,
  decodeShortString,
});

// ============ ContractAddress ============

/**
 * ContractAddress - Starknet contract address
 * Must be < 2^251
 */
export type ContractAddressType = Brand<Uint8Array, 'ContractAddress'> & FeltMethods;

function isValidContractAddressInternal(felt: Felt252Type): boolean {
  return felt.toBigInt() < MAX_CONTRACT_ADDRESS;
}

/**
 * Create a ContractAddress from Felt252 (with validation)
 */
const createContractAddress = (felt: Felt252Input): ContractAddressType => {
  const f = Felt252(felt);
  if (!isValidContractAddressInternal(f)) {
    throw new Error('Contract address must be < 2^251');
  }
  return f as unknown as ContractAddressType;
};

export const ContractAddress = Object.assign(createContractAddress, {
  from: createContractAddress,
  isValid: (felt: Felt252Input) => isValidContractAddressInternal(Felt252(felt)),
  MAX: MAX_CONTRACT_ADDRESS,
});

// ============ ClassHash ============

/**
 * ClassHash - Contract class identifier
 */
export type ClassHashType = Brand<Uint8Array, 'ClassHash'> & FeltMethods;

/**
 * Create a ClassHash from Felt252 (with validation)
 */
const createClassHash = (felt: Felt252Input): ClassHashType => {
  const f = Felt252(felt);
  if (f.toBigInt() >= MAX_ADDRESS) {
    throw new Error('ClassHash must be < 2^251');
  }
  return f as unknown as ClassHashType;
};

export const ClassHash = Object.assign(createClassHash, {
  from: createClassHash,
});

// ============ StorageKey ============

/**
 * StorageKey - Storage slot address
 */
export type StorageKeyType = Brand<Uint8Array, 'StorageKey'> & FeltMethods;

/**
 * Create a StorageKey from Felt252 (with validation)
 */
const createStorageKey = (felt: Felt252Input): StorageKeyType => {
  const f = Felt252(felt);
  if (f.toBigInt() >= MAX_ADDRESS) {
    throw new Error('StorageKey must be < 2^251');
  }
  return f as unknown as StorageKeyType;
};

export const StorageKey = Object.assign(createStorageKey, {
  from: createStorageKey,
});

// ============ EthAddress ============

/**
 * EthAddress - L1 Ethereum address used in L1-L2 messaging
 * Must be < 2^160
 */
export type EthAddressType = Brand<Uint8Array, 'EthAddress'> & FeltMethods;

/**
 * Create an EthAddress from Felt252 (with validation)
 */
const createEthAddress = (felt: Felt252Input): EthAddressType => {
  const f = Felt252(felt);
  if (f.toBigInt() >= MAX_ETH_ADDRESS) {
    throw new Error('EthAddress must be < 2^160');
  }
  return f as unknown as EthAddressType;
};

export const EthAddress = Object.assign(createEthAddress, {
  from: createEthAddress,
  isValid: (felt: Felt252Input) => Felt252(felt).toBigInt() < MAX_ETH_ADDRESS,
  MAX: MAX_ETH_ADDRESS,
});

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
    value = felt.toBigInt();
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

export const Felt = Felt252;

export const Address = ContractAddress;
export const Class = ClassHash;
export const Storage = StorageKey;
