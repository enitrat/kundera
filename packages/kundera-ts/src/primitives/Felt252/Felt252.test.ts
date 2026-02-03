import { describe, expect, test } from 'bun:test';
import { Felt252 } from './Felt252';
import { FIELD_PRIME } from './constants';
import { Felt } from '../index';

describe('Felt252', () => {
  test('from number', () => {
    const felt = Felt252(42);
    expect(felt.toBigInt()).toBe(42n);
  });

  test('from bigint', () => {
    const felt = Felt252(123456789n);
    expect(felt.toBigInt()).toBe(123456789n);
  });

  test('from hex with 0x prefix', () => {
    const felt = Felt252.fromHex('0x2a');
    expect(felt.toBigInt()).toBe(42n);
  });

  test('from hex without prefix', () => {
    const felt = Felt252.fromHex('2a');
    expect(felt.toBigInt()).toBe(42n);
  });

  test('from bytes', () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 42;
    const felt = Felt252.fromBytes(bytes);
    expect(felt.toBigInt()).toBe(42n);
  });

  test('toHex returns padded hex', () => {
    const felt = Felt252(42);
    const hex = felt.toHex();
    expect(hex).toStartWith('0x');
    expect(hex.length).toBe(66); // 0x + 64 hex chars
    expect(hex).toBe(
      '0x000000000000000000000000000000000000000000000000000000000000002a'
    );
  });

  test('hex roundtrip', () => {
    const original = Felt252(0x123456789abcdef0n);
    const hex = original.toHex();
    const parsed = Felt252.fromHex(hex);
    expect(original.equals(parsed)).toBe(true);
  });

  test('rejects negative values', () => {
    expect(() => Felt252.fromBigInt(-1n)).toThrow('negative');
  });

  test('rejects values >= FIELD_PRIME', () => {
    expect(() => Felt252.fromBigInt(FIELD_PRIME)).toThrow('exceeds');
  });

  test('rejects hex >= FIELD_PRIME', () => {
    expect(() => Felt252.fromHex('0x' + FIELD_PRIME.toString(16))).toThrow('exceeds');
  });

  test('rejects hex string too long', () => {
    expect(() => Felt252.fromHex('0x' + 'f'.repeat(65))).toThrow('too long');
  });

  test('rejects invalid hex string', () => {
    expect(() => Felt252.fromHex('0xzz')).toThrow('Invalid hex');
  });

  test('ZERO constant', () => {
    expect(Felt.ZERO.isZero()).toBe(true);
    expect(Felt.ZERO.toBigInt()).toBe(0n);
  });

  test('ONE constant', () => {
    expect(Felt.ONE.isZero()).toBe(false);
    expect(Felt.ONE.toBigInt()).toBe(1n);
  });

  test('isValid returns true for valid felt', () => {
    expect(Felt252(42).isValid()).toBe(true);
  });

  test('isZero returns true for zero', () => {
    expect(Felt252(0).isZero()).toBe(true);
    expect(Felt252(1).isZero()).toBe(false);
  });

  test('equals compares correctly', () => {
    const a = Felt252(42);
    const b = Felt252(42);
    const c = Felt252(43);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe('Constants', () => {
  test('FIELD_PRIME is correct', () => {
    // P = 2^251 + 17*2^192 + 1
    const expected = (1n << 251n) + 17n * (1n << 192n) + 1n;
    expect(FIELD_PRIME).toBe(expected);
  });
});
