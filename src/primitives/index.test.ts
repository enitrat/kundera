import { describe, expect, test } from 'bun:test';
import {
  Felt252,
  fromHex,
  fromBigInt,
  fromBytes,
  toHex,
  toBigInt,
  isValid,
  isZero,
  equals,
  ContractAddress,
  ClassHash,
  StorageKey,
  FIELD_PRIME,
  MAX_CONTRACT_ADDRESS,
  Felt,
  Address,
  encodeShortString,
  decodeShortString,
  encodeShortStringHex,
  MAX_SHORT_STRING_LENGTH,
} from './index';

describe('Felt252', () => {
  test('from number', () => {
    const felt = Felt252(42);
    expect(toBigInt(felt)).toBe(42n);
  });

  test('from bigint', () => {
    const felt = Felt252(123456789n);
    expect(toBigInt(felt)).toBe(123456789n);
  });

  test('from hex with 0x prefix', () => {
    const felt = fromHex('0x2a');
    expect(toBigInt(felt)).toBe(42n);
  });

  test('from hex without prefix', () => {
    const felt = fromHex('2a');
    expect(toBigInt(felt)).toBe(42n);
  });

  test('from bytes', () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 42;
    const felt = fromBytes(bytes);
    expect(toBigInt(felt)).toBe(42n);
  });

  test('toHex returns padded hex', () => {
    const felt = Felt252(42);
    const hex = toHex(felt);
    expect(hex).toStartWith('0x');
    expect(hex.length).toBe(66); // 0x + 64 hex chars
    expect(hex).toBe(
      '0x000000000000000000000000000000000000000000000000000000000000002a'
    );
  });

  test('hex roundtrip', () => {
    const original = Felt252(0x123456789abcdef0n);
    const hex = toHex(original);
    const parsed = fromHex(hex);
    expect(equals(original, parsed)).toBe(true);
  });

  test('rejects negative values', () => {
    expect(() => fromBigInt(-1n)).toThrow('negative');
  });

  test('rejects values >= FIELD_PRIME', () => {
    expect(() => fromBigInt(FIELD_PRIME)).toThrow('exceeds');
  });

  test('rejects hex >= FIELD_PRIME', () => {
    expect(() => fromHex('0x' + FIELD_PRIME.toString(16))).toThrow('exceeds');
  });

  test('rejects hex string too long', () => {
    expect(() => fromHex('0x' + 'f'.repeat(65))).toThrow('too long');
  });

  test('rejects invalid hex string', () => {
    expect(() => fromHex('0xzz')).toThrow('Invalid hex');
  });

  test('ZERO constant', () => {
    expect(isZero(Felt.ZERO)).toBe(true);
    expect(toBigInt(Felt.ZERO)).toBe(0n);
  });

  test('ONE constant', () => {
    expect(isZero(Felt.ONE)).toBe(false);
    expect(toBigInt(Felt.ONE)).toBe(1n);
  });

  test('isValid returns true for valid felt', () => {
    expect(isValid(Felt252(42))).toBe(true);
  });

  test('isZero returns true for zero', () => {
    expect(isZero(Felt252(0))).toBe(true);
    expect(isZero(Felt252(1))).toBe(false);
  });

  test('equals compares correctly', () => {
    const a = Felt252(42);
    const b = Felt252(42);
    const c = Felt252(43);
    expect(equals(a, b)).toBe(true);
    expect(equals(a, c)).toBe(false);
  });
});

describe('ContractAddress', () => {
  test('creates valid address', () => {
    const addr = ContractAddress(42n);
    expect(toBigInt(addr)).toBe(42n);
  });

  test('rejects address >= 2^251', () => {
    expect(() => ContractAddress(MAX_CONTRACT_ADDRESS)).toThrow('< 2^251');
  });

  test('accepts address just below limit', () => {
    const addr = ContractAddress(MAX_CONTRACT_ADDRESS - 1n);
    expect(toBigInt(addr)).toBe(MAX_CONTRACT_ADDRESS - 1n);
  });

  test('Address.isValid checks range', () => {
    expect(Address.isValid(Felt252(42))).toBe(true);
    // Create a felt that's >= 2^251 but < FIELD_PRIME
    const bytes = new Uint8Array(32);
    bytes[0] = 0x08; // Sets bit 251
    const largeFelt = fromBytes(bytes);
    expect(Address.isValid(largeFelt)).toBe(false);
  });
});

describe('ClassHash', () => {
  test('creates valid class hash', () => {
    const hash = ClassHash(42n);
    expect(toBigInt(hash)).toBe(42n);
  });
});

describe('StorageKey', () => {
  test('creates valid storage key', () => {
    const key = StorageKey(42n);
    expect(toBigInt(key)).toBe(42n);
  });
});

describe('Constants', () => {
  test('FIELD_PRIME is correct', () => {
    // P = 2^251 + 17*2^192 + 1
    const expected = (1n << 251n) + 17n * (1n << 192n) + 1n;
    expect(FIELD_PRIME).toBe(expected);
  });

  test('MAX_CONTRACT_ADDRESS is 2^251', () => {
    expect(MAX_CONTRACT_ADDRESS).toBe(1n << 251n);
  });
});

describe('Short String', () => {
  test('MAX_SHORT_STRING_LENGTH is 31', () => {
    expect(MAX_SHORT_STRING_LENGTH).toBe(31);
  });

  test('encodeShortString encodes hello', () => {
    const encoded = encodeShortString('hello');
    // 'h'=0x68, 'e'=0x65, 'l'=0x6c, 'l'=0x6c, 'o'=0x6f
    // = 0x68656c6c6f = 448378203247
    expect(encoded).toBe(448378203247n);
  });

  test('encodeShortStringHex encodes hello', () => {
    const encoded = encodeShortStringHex('hello');
    expect(encoded).toBe('0x68656c6c6f');
  });

  test('decodeShortString decodes from bigint', () => {
    const decoded = decodeShortString(448378203247n);
    expect(decoded).toBe('hello');
  });

  test('decodeShortString decodes from hex', () => {
    const decoded = decodeShortString('0x68656c6c6f');
    expect(decoded).toBe('hello');
  });

  test('decodeShortString decodes from Felt252', () => {
    const felt = Felt252(448378203247n);
    const decoded = decodeShortString(felt);
    expect(decoded).toBe('hello');
  });

  test('encodeShortString handles empty string', () => {
    const encoded = encodeShortString('');
    expect(encoded).toBe(0n);
  });

  test('decodeShortString handles zero', () => {
    const decoded = decodeShortString(0n);
    expect(decoded).toBe('');
  });

  test('roundtrip preserves value', () => {
    const original = 'test_string_123';
    const encoded = encodeShortString(original);
    const decoded = decodeShortString(encoded);
    expect(decoded).toBe(original);
  });

  test('encodes single character', () => {
    const encoded = encodeShortString('A');
    expect(encoded).toBe(65n); // 'A' = 0x41 = 65
  });

  test('encodes max length string (31 chars)', () => {
    const str = 'a'.repeat(31);
    const encoded = encodeShortString(str);
    expect(typeof encoded).toBe('bigint');
    expect(decodeShortString(encoded)).toBe(str);
  });

  test('rejects non-ASCII characters', () => {
    expect(() => encodeShortString('hello\u00e9')).toThrow('not an ASCII');
  });

  test('rejects string longer than 31 chars', () => {
    const str = 'a'.repeat(32);
    expect(() => encodeShortString(str)).toThrow('too long');
  });

  test('Felt namespace includes short string functions', () => {
    expect(Felt.encodeShortString).toBe(encodeShortString);
    expect(Felt.decodeShortString).toBe(decodeShortString);
    expect(Felt.MAX_SHORT_STRING_LENGTH).toBe(31);
  });
});
