import { describe, expect, test } from 'bun:test';
import { Int32 } from './Int32.js';
import { MIN, MAX, PRIME } from './constants.js';
import { Felt252 } from '../Felt252/index.js';

describe('Int32', () => {
  describe('constants', () => {
    test('MIN is -2147483648', () => {
      expect(MIN).toBe(-2147483648n);
    });

    test('MAX is 2147483647', () => {
      expect(MAX).toBe(2147483647n);
    });

    test('PRIME is correct Stark curve field prime', () => {
      const expected = 2n ** 251n + 17n * 2n ** 192n + 1n;
      expect(PRIME).toBe(expected);
    });
  });

  describe('from', () => {
    test('creates Int32 from positive bigint', () => {
      const value = Int32.from(1000000n);
      expect(Int32.toBigInt(value)).toBe(1000000n);
    });

    test('creates Int32 from zero', () => {
      const value = Int32.from(0n);
      expect(Int32.toBigInt(value)).toBe(0n);
    });

    test('creates Int32 from negative bigint', () => {
      const value = Int32.from(-1000000n);
      expect(Int32.toBigInt(value)).toBe(-1000000n);
    });

    test('creates Int32 from number', () => {
      const value = Int32.from(123456789);
      expect(Int32.toBigInt(value)).toBe(123456789n);
    });

    test('creates Int32 from negative number', () => {
      const value = Int32.from(-123456789);
      expect(Int32.toBigInt(value)).toBe(-123456789n);
    });

    test('creates Int32 at MAX boundary (2147483647)', () => {
      const value = Int32.from(MAX);
      expect(Int32.toBigInt(value)).toBe(2147483647n);
    });

    test('creates Int32 at MIN boundary (-2147483648)', () => {
      const value = Int32.from(MIN);
      expect(Int32.toBigInt(value)).toBe(-2147483648n);
    });

    test('rejects value above MAX', () => {
      expect(() => Int32.from(2147483648n)).toThrow();
    });

    test('rejects value below MIN', () => {
      expect(() => Int32.from(-2147483649n)).toThrow();
    });
  });

  describe('toFelt - Cairo field encoding', () => {
    test('positive value encodes directly', () => {
      const value = Int32.from(1000000n);
      const felt = Int32.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(1000000n);
    });

    test('zero encodes as zero', () => {
      const value = Int32.from(0n);
      const felt = Int32.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(0n);
    });

    test('MAX encodes directly', () => {
      const value = Int32.from(MAX);
      const felt = Int32.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(2147483647n);
    });

    test('-1 encodes as PRIME - 1', () => {
      const value = Int32.from(-1n);
      const felt = Int32.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME - 1n);
    });

    test('MIN encodes as PRIME + MIN', () => {
      const value = Int32.from(MIN);
      const felt = Int32.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME - 2147483648n);
    });
  });

  describe('fromFelt - Cairo field decoding', () => {
    test('decodes positive felt to positive Int32', () => {
      const felt = Felt252.fromBigInt(1000000n);
      const value = Int32.fromFelt(felt);
      expect(Int32.toBigInt(value)).toBe(1000000n);
    });

    test('decodes PRIME - 1 to -1', () => {
      const felt = Felt252.fromBigInt(PRIME - 1n);
      const value = Int32.fromFelt(felt);
      expect(Int32.toBigInt(value)).toBe(-1n);
    });

    test('decodes PRIME + MIN to MIN', () => {
      const felt = Felt252.fromBigInt(PRIME - 2147483648n);
      const value = Int32.fromFelt(felt);
      expect(Int32.toBigInt(value)).toBe(-2147483648n);
    });
  });

  describe('toFelt/fromFelt roundtrip', () => {
    test('roundtrip for positive values', () => {
      const testValues = [0n, 1n, 1000000n, 2147483646n, 2147483647n];
      for (const expected of testValues) {
        const original = Int32.from(expected);
        const felt = Int32.toFelt(original);
        const decoded = Int32.fromFelt(felt);
        expect(Int32.toBigInt(decoded)).toBe(expected);
      }
    });

    test('roundtrip for negative values', () => {
      const testValues = [-1n, -1000000n, -2147483647n, -2147483648n];
      for (const expected of testValues) {
        const original = Int32.from(expected);
        const felt = Int32.toFelt(original);
        const decoded = Int32.fromFelt(felt);
        expect(Int32.toBigInt(decoded)).toBe(expected);
      }
    });
  });

  describe('utility functions', () => {
    test('isZero', () => {
      expect(Int32.isZero(Int32.from(0n))).toBe(true);
      expect(Int32.isZero(Int32.from(1n))).toBe(false);
    });

    test('isNegative', () => {
      expect(Int32.isNegative(Int32.from(-1n))).toBe(true);
      expect(Int32.isNegative(Int32.from(0n))).toBe(false);
    });

    test('isPositive', () => {
      expect(Int32.isPositive(Int32.from(1n))).toBe(true);
      expect(Int32.isPositive(Int32.from(0n))).toBe(false);
    });

    test('equals', () => {
      expect(Int32.equals(Int32.from(1000000n), Int32.from(1000000n))).toBe(true);
      expect(Int32.equals(Int32.from(1000000n), Int32.from(1000001n))).toBe(false);
    });
  });

  describe('constants', () => {
    test('ZERO constant', () => {
      expect(Int32.toBigInt(Int32.ZERO)).toBe(0n);
    });

    test('ONE constant', () => {
      expect(Int32.toBigInt(Int32.ONE)).toBe(1n);
    });

    test('MIN constant', () => {
      expect(Int32.toBigInt(Int32.MIN)).toBe(-2147483648n);
    });

    test('MAX constant', () => {
      expect(Int32.toBigInt(Int32.MAX)).toBe(2147483647n);
    });
  });
});
