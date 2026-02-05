import { describe, it, expect } from 'vitest';
import { Uint256, MIN, MAX, SIZE } from './index.js';

describe('Uint256', () => {
  describe('constants', () => {
    it('should have correct MIN value', () => {
      expect(MIN).toBe(0n);
    });

    it('should have correct MAX value', () => {
      expect(MAX).toBe(2n ** 256n - 1n);
    });

    it('should have correct SIZE in bits', () => {
      expect(SIZE).toBe(256);
    });
  });

  describe('from', () => {
    it('should create from bigint', () => {
      const value = Uint256.from(1000000000000000000000n);
      expect(Uint256.toBigInt(value)).toBe(1000000000000000000000n);
    });

    it('should create from number', () => {
      const value = Uint256.from(1000000);
      expect(Uint256.toBigInt(value)).toBe(1000000n);
    });

    it('should create from decimal string', () => {
      const value = Uint256.from('1000000000000000000000');
      expect(Uint256.toBigInt(value)).toBe(1000000000000000000000n);
    });

    it('should create from hex string', () => {
      const value = Uint256.from('0xff');
      expect(Uint256.toBigInt(value)).toBe(255n);
    });

    it('should create MIN value', () => {
      const value = Uint256.from(0n);
      expect(Uint256.toBigInt(value)).toBe(0n);
    });

    it('should create MAX value', () => {
      const maxValue = 2n ** 256n - 1n;
      const value = Uint256.from(maxValue);
      expect(Uint256.toBigInt(value)).toBe(maxValue);
    });

    it('should create MAX - 1 value', () => {
      const maxMinus1 = 2n ** 256n - 2n;
      const value = Uint256.from(maxMinus1);
      expect(Uint256.toBigInt(value)).toBe(maxMinus1);
    });

    it('should throw on negative value', () => {
      expect(() => Uint256.from(-1n)).toThrow();
      expect(() => Uint256.from(-1)).toThrow();
    });

    it('should throw on overflow', () => {
      expect(() => Uint256.from(2n ** 256n)).toThrow();
    });

    it('should throw on non-integer number', () => {
      expect(() => Uint256.from(1.5)).toThrow();
    });
  });

  describe('toHex', () => {
    it('should convert to hex string with 0x prefix', () => {
      const value = Uint256.from(255n);
      expect(Uint256.toHex(value)).toBe('0xff');
    });

    it('should convert zero to hex', () => {
      const value = Uint256.from(0n);
      expect(Uint256.toHex(value)).toBe('0x0');
    });

    it('should convert large value to hex', () => {
      const value = Uint256.from(2n ** 128n);
      expect(Uint256.toHex(value)).toBe('0x100000000000000000000000000000000');
    });
  });

  describe('toBigInt', () => {
    it('should convert to bigint', () => {
      const value = Uint256.from(123456789012345678901234n);
      expect(Uint256.toBigInt(value)).toBe(123456789012345678901234n);
    });

    it('should return bigint type', () => {
      const value = Uint256.from(123456789012345678901234n);
      expect(typeof Uint256.toBigInt(value)).toBe('bigint');
    });
  });

  describe('toFelt', () => {
    it('should return tuple of [low, high] Felt252 values', () => {
      const value = Uint256.from(0n);
      const [low, high] = Uint256.toFelts(value);
      expect(low.toBigInt()).toBe(0n);
      expect(high.toBigInt()).toBe(0n);
    });

    it('should split value correctly with only low part', () => {
      const value = Uint256.from(255n);
      const [low, high] = Uint256.toFelts(value);
      expect(low.toBigInt()).toBe(255n);
      expect(high.toBigInt()).toBe(0n);
    });

    it('should split value correctly with only high part', () => {
      // Value is exactly 2^128 (only high part)
      const value = Uint256.from(2n ** 128n);
      const [low, high] = Uint256.toFelts(value);
      expect(low.toBigInt()).toBe(0n);
      expect(high.toBigInt()).toBe(1n);
    });

    it('should split MAX value correctly', () => {
      // MAX = 2^256 - 1
      // low = 2^128 - 1 (all bits set in lower 128)
      // high = 2^128 - 1 (all bits set in upper 128)
      const maxValue = 2n ** 256n - 1n;
      const value = Uint256.from(maxValue);
      const [low, high] = Uint256.toFelts(value);
      expect(low.toBigInt()).toBe(2n ** 128n - 1n);
      expect(high.toBigInt()).toBe(2n ** 128n - 1n);
    });

    it('should split mixed value correctly', () => {
      // Value: 2^128 + 123
      // low = 123
      // high = 1
      const value = Uint256.from(2n ** 128n + 123n);
      const [low, high] = Uint256.toFelts(value);
      expect(low.toBigInt()).toBe(123n);
      expect(high.toBigInt()).toBe(1n);
    });

    it('should split large mixed value correctly', () => {
      // Value: 5 * 2^128 + 12345
      // low = 12345
      // high = 5
      const value = Uint256.from(5n * (2n ** 128n) + 12345n);
      const [low, high] = Uint256.toFelts(value);
      expect(low.toBigInt()).toBe(12345n);
      expect(high.toBigInt()).toBe(5n);
    });

    it('should handle max 128-bit value in low part', () => {
      // Value: 2^128 - 1 (max value that fits in low)
      const value = Uint256.from(2n ** 128n - 1n);
      const [low, high] = Uint256.toFelts(value);
      expect(low.toBigInt()).toBe(2n ** 128n - 1n);
      expect(high.toBigInt()).toBe(0n);
    });
  });
});
