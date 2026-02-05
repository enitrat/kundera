import { describe, expect, test } from 'vitest';
import { Int8 } from './Int8.js';
import { MIN, MAX, PRIME } from './constants.js';
import { Felt252 } from '../Felt252/index.js';

describe('Int8', () => {
  describe('constants', () => {
    test('MIN is -128', () => {
      expect(MIN).toBe(-128n);
    });

    test('MAX is 127', () => {
      expect(MAX).toBe(127n);
    });

    test('PRIME is correct Stark curve field prime', () => {
      const expected = 2n ** 251n + 17n * 2n ** 192n + 1n;
      expect(PRIME).toBe(expected);
    });
  });

  describe('from', () => {
    test('creates Int8 from positive bigint', () => {
      const value = Int8.from(42n);
      expect(Int8.toBigInt(value)).toBe(42n);
    });

    test('creates Int8 from zero', () => {
      const value = Int8.from(0n);
      expect(Int8.toBigInt(value)).toBe(0n);
    });

    test('creates Int8 from negative bigint', () => {
      const value = Int8.from(-42n);
      expect(Int8.toBigInt(value)).toBe(-42n);
    });

    test('creates Int8 from number', () => {
      const value = Int8.from(123);
      expect(Int8.toBigInt(value)).toBe(123n);
    });

    test('creates Int8 from negative number', () => {
      const value = Int8.from(-123);
      expect(Int8.toBigInt(value)).toBe(-123n);
    });

    test('creates Int8 from string', () => {
      const value = Int8.from('100');
      expect(Int8.toBigInt(value)).toBe(100n);
    });

    test('creates Int8 from negative string', () => {
      const value = Int8.from('-100');
      expect(Int8.toBigInt(value)).toBe(-100n);
    });

    test('creates Int8 at MAX boundary (127)', () => {
      const value = Int8.from(MAX);
      expect(Int8.toBigInt(value)).toBe(127n);
    });

    test('creates Int8 at MAX-1 (126)', () => {
      const value = Int8.from(MAX - 1n);
      expect(Int8.toBigInt(value)).toBe(126n);
    });

    test('creates Int8 at MIN boundary (-128)', () => {
      const value = Int8.from(MIN);
      expect(Int8.toBigInt(value)).toBe(-128n);
    });

    test('creates Int8 at MIN+1 (-127)', () => {
      const value = Int8.from(MIN + 1n);
      expect(Int8.toBigInt(value)).toBe(-127n);
    });

    test('creates Int8 for -1', () => {
      const value = Int8.from(-1n);
      expect(Int8.toBigInt(value)).toBe(-1n);
    });

    test('rejects value above MAX (128)', () => {
      expect(() => Int8.from(128n)).toThrow();
    });

    test('rejects value below MIN (-129)', () => {
      expect(() => Int8.from(-129n)).toThrow();
    });
  });

  describe('toHex', () => {
    test('positive value to hex', () => {
      const value = Int8.from(127n);
      expect(Int8.toHex(value)).toBe('0x7f');
    });

    test('zero to hex', () => {
      const value = Int8.from(0n);
      expect(Int8.toHex(value)).toBe('0x0');
    });

    test('negative value to hex shows signed representation', () => {
      const value = Int8.from(-1n);
      expect(Int8.toHex(value)).toBe('-0x1');
    });

    test('MIN to hex', () => {
      const value = Int8.from(MIN);
      expect(Int8.toHex(value)).toBe('-0x80');
    });
  });

  describe('toFelt - Cairo field encoding', () => {
    test('positive value encodes directly', () => {
      const value = Int8.from(42n);
      const felt = Int8.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(42n);
    });

    test('zero encodes as zero', () => {
      const value = Int8.from(0n);
      const felt = Int8.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(0n);
    });

    test('MAX (127) encodes directly', () => {
      const value = Int8.from(MAX);
      const felt = Int8.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(127n);
    });

    test('-1 encodes as PRIME - 1', () => {
      const value = Int8.from(-1n);
      const felt = Int8.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME - 1n);
    });

    test('MIN (-128) encodes as PRIME - 128', () => {
      const value = Int8.from(MIN);
      const felt = Int8.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME - 128n);
    });

    test('-42 encodes as PRIME - 42', () => {
      const value = Int8.from(-42n);
      const felt = Int8.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME - 42n);
    });
  });

  describe('fromFelt - Cairo field decoding', () => {
    test('decodes positive felt to positive Int8', () => {
      const felt = Felt252.fromBigInt(42n);
      const value = Int8.fromFelt(felt);
      expect(Int8.toBigInt(value)).toBe(42n);
    });

    test('decodes zero felt to zero', () => {
      const felt = Felt252.fromBigInt(0n);
      const value = Int8.fromFelt(felt);
      expect(Int8.toBigInt(value)).toBe(0n);
    });

    test('decodes MAX felt (127) to MAX', () => {
      const felt = Felt252.fromBigInt(127n);
      const value = Int8.fromFelt(felt);
      expect(Int8.toBigInt(value)).toBe(127n);
    });

    test('decodes PRIME - 1 to -1', () => {
      const felt = Felt252.fromBigInt(PRIME - 1n);
      const value = Int8.fromFelt(felt);
      expect(Int8.toBigInt(value)).toBe(-1n);
    });

    test('decodes PRIME - 128 to -128 (MIN)', () => {
      const felt = Felt252.fromBigInt(PRIME - 128n);
      const value = Int8.fromFelt(felt);
      expect(Int8.toBigInt(value)).toBe(-128n);
    });

    test('decodes PRIME - 42 to -42', () => {
      const felt = Felt252.fromBigInt(PRIME - 42n);
      const value = Int8.fromFelt(felt);
      expect(Int8.toBigInt(value)).toBe(-42n);
    });
  });

  describe('toFelt/fromFelt roundtrip', () => {
    test('roundtrip for positive values', () => {
      const testValues = [0n, 1n, 42n, 100n, 126n, 127n];
      for (const expected of testValues) {
        const original = Int8.from(expected);
        const felt = Int8.toFelt(original);
        const decoded = Int8.fromFelt(felt);
        expect(Int8.toBigInt(decoded)).toBe(expected);
      }
    });

    test('roundtrip for negative values', () => {
      const testValues = [-1n, -42n, -100n, -127n, -128n];
      for (const expected of testValues) {
        const original = Int8.from(expected);
        const felt = Int8.toFelt(original);
        const decoded = Int8.fromFelt(felt);
        expect(Int8.toBigInt(decoded)).toBe(expected);
      }
    });
  });

  describe('utility functions', () => {
    test('isValid returns true for valid values', () => {
      expect(Int8.isValid(Int8.from(0n))).toBe(true);
      expect(Int8.isValid(Int8.from(MAX))).toBe(true);
      expect(Int8.isValid(Int8.from(MIN))).toBe(true);
    });

    test('isZero', () => {
      expect(Int8.isZero(Int8.from(0n))).toBe(true);
      expect(Int8.isZero(Int8.from(1n))).toBe(false);
      expect(Int8.isZero(Int8.from(-1n))).toBe(false);
    });

    test('isNegative', () => {
      expect(Int8.isNegative(Int8.from(-1n))).toBe(true);
      expect(Int8.isNegative(Int8.from(MIN))).toBe(true);
      expect(Int8.isNegative(Int8.from(0n))).toBe(false);
      expect(Int8.isNegative(Int8.from(1n))).toBe(false);
    });

    test('isPositive', () => {
      expect(Int8.isPositive(Int8.from(1n))).toBe(true);
      expect(Int8.isPositive(Int8.from(MAX))).toBe(true);
      expect(Int8.isPositive(Int8.from(0n))).toBe(false);
      expect(Int8.isPositive(Int8.from(-1n))).toBe(false);
    });

    test('equals', () => {
      expect(Int8.equals(Int8.from(42n), Int8.from(42n))).toBe(true);
      expect(Int8.equals(Int8.from(42n), Int8.from(43n))).toBe(false);
      expect(Int8.equals(Int8.from(-42n), Int8.from(-42n))).toBe(true);
    });
  });

  describe('constants', () => {
    test('ZERO constant', () => {
      expect(Int8.toBigInt(Int8.ZERO)).toBe(0n);
    });

    test('ONE constant', () => {
      expect(Int8.toBigInt(Int8.ONE)).toBe(1n);
    });

    test('MIN constant', () => {
      expect(Int8.toBigInt(Int8.MIN)).toBe(-128n);
    });

    test('MAX constant', () => {
      expect(Int8.toBigInt(Int8.MAX)).toBe(127n);
    });
  });
});
