import { describe, expect, test } from 'bun:test';
import { Int128 } from './Int128.js';
import { MIN, MAX, PRIME } from './constants.js';
import { Felt252 } from '../Felt252/index.js';

describe('Int128', () => {
  describe('constants', () => {
    test('MIN is -2^127', () => {
      expect(MIN).toBe(-(2n ** 127n));
    });

    test('MAX is 2^127 - 1', () => {
      expect(MAX).toBe(2n ** 127n - 1n);
    });

    test('PRIME is correct Stark curve field prime', () => {
      const expected = 2n ** 251n + 17n * 2n ** 192n + 1n;
      expect(PRIME).toBe(expected);
    });
  });

  describe('from', () => {
    test('creates Int128 from positive bigint', () => {
      const value = Int128.from(42n);
      expect(Int128.toBigInt(value)).toBe(42n);
    });

    test('creates Int128 from zero', () => {
      const value = Int128.from(0n);
      expect(Int128.toBigInt(value)).toBe(0n);
    });

    test('creates Int128 from negative bigint', () => {
      const value = Int128.from(-42n);
      expect(Int128.toBigInt(value)).toBe(-42n);
    });

    test('creates Int128 from number', () => {
      const value = Int128.from(123);
      expect(Int128.toBigInt(value)).toBe(123n);
    });

    test('creates Int128 from negative number', () => {
      const value = Int128.from(-123);
      expect(Int128.toBigInt(value)).toBe(-123n);
    });

    test('creates Int128 from string', () => {
      const value = Int128.from('12345');
      expect(Int128.toBigInt(value)).toBe(12345n);
    });

    test('creates Int128 from negative string', () => {
      const value = Int128.from('-12345');
      expect(Int128.toBigInt(value)).toBe(-12345n);
    });

    test('creates Int128 at MAX boundary', () => {
      const value = Int128.from(MAX);
      expect(Int128.toBigInt(value)).toBe(MAX);
    });

    test('creates Int128 at MAX-1', () => {
      const value = Int128.from(MAX - 1n);
      expect(Int128.toBigInt(value)).toBe(MAX - 1n);
    });

    test('creates Int128 at MIN boundary', () => {
      const value = Int128.from(MIN);
      expect(Int128.toBigInt(value)).toBe(MIN);
    });

    test('creates Int128 at MIN+1', () => {
      const value = Int128.from(MIN + 1n);
      expect(Int128.toBigInt(value)).toBe(MIN + 1n);
    });

    test('creates Int128 for -1', () => {
      const value = Int128.from(-1n);
      expect(Int128.toBigInt(value)).toBe(-1n);
    });

    test('rejects value above MAX', () => {
      expect(() => Int128.from(MAX + 1n)).toThrow();
    });

    test('rejects value below MIN', () => {
      expect(() => Int128.from(MIN - 1n)).toThrow();
    });
  });

  describe('toHex', () => {
    test('positive value to hex', () => {
      const value = Int128.from(255n);
      expect(Int128.toHex(value)).toBe('0xff');
    });

    test('zero to hex', () => {
      const value = Int128.from(0n);
      expect(Int128.toHex(value)).toBe('0x0');
    });

    test('negative value to hex shows signed representation', () => {
      // Negative values shown with minus sign for readability
      const value = Int128.from(-1n);
      expect(Int128.toHex(value)).toBe('-0x1');
    });

    test('MIN to hex', () => {
      const value = Int128.from(MIN);
      // MIN = -2^127 = -0x80000000000000000000000000000000
      expect(Int128.toHex(value)).toBe('-0x80000000000000000000000000000000');
    });
  });

  describe('toBigInt', () => {
    test('returns original positive value', () => {
      const value = Int128.from(12345n);
      expect(Int128.toBigInt(value)).toBe(12345n);
    });

    test('returns original negative value', () => {
      const value = Int128.from(-12345n);
      expect(Int128.toBigInt(value)).toBe(-12345n);
    });
  });

  describe('toFelt - Cairo field encoding', () => {
    test('positive value encodes directly', () => {
      const value = Int128.from(42n);
      const felt = Int128.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(42n);
    });

    test('zero encodes as zero', () => {
      const value = Int128.from(0n);
      const felt = Int128.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(0n);
    });

    test('MAX encodes directly', () => {
      const value = Int128.from(MAX);
      const felt = Int128.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(MAX);
    });

    test('-1 encodes as PRIME - 1', () => {
      const value = Int128.from(-1n);
      const felt = Int128.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME - 1n);
    });

    test('MIN encodes as PRIME + MIN', () => {
      const value = Int128.from(MIN);
      const felt = Int128.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME + MIN);
    });

    test('MIN+1 encodes as PRIME + MIN + 1', () => {
      const value = Int128.from(MIN + 1n);
      const felt = Int128.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME + MIN + 1n);
    });

    test('-42 encodes as PRIME - 42', () => {
      const value = Int128.from(-42n);
      const felt = Int128.toFelt(value);
      expect(Felt252.toBigInt(felt)).toBe(PRIME - 42n);
    });
  });

  describe('fromFelt - Cairo field decoding', () => {
    test('decodes positive felt to positive Int128', () => {
      const felt = Felt252.fromBigInt(42n);
      const value = Int128.fromFelt(felt);
      expect(Int128.toBigInt(value)).toBe(42n);
    });

    test('decodes zero felt to zero', () => {
      const felt = Felt252.fromBigInt(0n);
      const value = Int128.fromFelt(felt);
      expect(Int128.toBigInt(value)).toBe(0n);
    });

    test('decodes MAX felt to MAX', () => {
      const felt = Felt252.fromBigInt(MAX);
      const value = Int128.fromFelt(felt);
      expect(Int128.toBigInt(value)).toBe(MAX);
    });

    test('decodes PRIME - 1 to -1', () => {
      const felt = Felt252.fromBigInt(PRIME - 1n);
      const value = Int128.fromFelt(felt);
      expect(Int128.toBigInt(value)).toBe(-1n);
    });

    test('decodes PRIME + MIN to MIN', () => {
      const felt = Felt252.fromBigInt(PRIME + MIN);
      const value = Int128.fromFelt(felt);
      expect(Int128.toBigInt(value)).toBe(MIN);
    });

    test('decodes PRIME - 42 to -42', () => {
      const felt = Felt252.fromBigInt(PRIME - 42n);
      const value = Int128.fromFelt(felt);
      expect(Int128.toBigInt(value)).toBe(-42n);
    });
  });

  describe('toFelt/fromFelt roundtrip', () => {
    test('roundtrip for positive values', () => {
      const testValues = [0n, 1n, 42n, 12345n, MAX - 1n, MAX];
      for (const expected of testValues) {
        const original = Int128.from(expected);
        const felt = Int128.toFelt(original);
        const decoded = Int128.fromFelt(felt);
        expect(Int128.toBigInt(decoded)).toBe(expected);
      }
    });

    test('roundtrip for negative values', () => {
      const testValues = [-1n, -42n, -12345n, MIN + 1n, MIN];
      for (const expected of testValues) {
        const original = Int128.from(expected);
        const felt = Int128.toFelt(original);
        const decoded = Int128.fromFelt(felt);
        expect(Int128.toBigInt(decoded)).toBe(expected);
      }
    });
  });

  describe('isValid', () => {
    test('valid values return true', () => {
      expect(Int128.isValid(Int128.from(0n))).toBe(true);
      expect(Int128.isValid(Int128.from(MAX))).toBe(true);
      expect(Int128.isValid(Int128.from(MIN))).toBe(true);
      expect(Int128.isValid(Int128.from(-1n))).toBe(true);
    });
  });

  describe('isZero', () => {
    test('zero returns true', () => {
      expect(Int128.isZero(Int128.from(0n))).toBe(true);
    });

    test('non-zero returns false', () => {
      expect(Int128.isZero(Int128.from(1n))).toBe(false);
      expect(Int128.isZero(Int128.from(-1n))).toBe(false);
    });
  });

  describe('isNegative', () => {
    test('negative values return true', () => {
      expect(Int128.isNegative(Int128.from(-1n))).toBe(true);
      expect(Int128.isNegative(Int128.from(MIN))).toBe(true);
    });

    test('zero returns false', () => {
      expect(Int128.isNegative(Int128.from(0n))).toBe(false);
    });

    test('positive values return false', () => {
      expect(Int128.isNegative(Int128.from(1n))).toBe(false);
      expect(Int128.isNegative(Int128.from(MAX))).toBe(false);
    });
  });

  describe('isPositive', () => {
    test('positive values return true', () => {
      expect(Int128.isPositive(Int128.from(1n))).toBe(true);
      expect(Int128.isPositive(Int128.from(MAX))).toBe(true);
    });

    test('zero returns false', () => {
      expect(Int128.isPositive(Int128.from(0n))).toBe(false);
    });

    test('negative values return false', () => {
      expect(Int128.isPositive(Int128.from(-1n))).toBe(false);
      expect(Int128.isPositive(Int128.from(MIN))).toBe(false);
    });
  });

  describe('equals', () => {
    test('equal values return true', () => {
      const a = Int128.from(42n);
      const b = Int128.from(42n);
      expect(Int128.equals(a, b)).toBe(true);
    });

    test('different values return false', () => {
      const a = Int128.from(42n);
      const b = Int128.from(43n);
      expect(Int128.equals(a, b)).toBe(false);
    });

    test('negative equal values', () => {
      const a = Int128.from(-42n);
      const b = Int128.from(-42n);
      expect(Int128.equals(a, b)).toBe(true);
    });
  });

  describe('constants', () => {
    test('ZERO constant', () => {
      expect(Int128.toBigInt(Int128.ZERO)).toBe(0n);
    });

    test('ONE constant', () => {
      expect(Int128.toBigInt(Int128.ONE)).toBe(1n);
    });

    test('MIN constant', () => {
      expect(Int128.toBigInt(Int128.MIN)).toBe(MIN);
    });

    test('MAX constant', () => {
      expect(Int128.toBigInt(Int128.MAX)).toBe(MAX);
    });
  });
});
