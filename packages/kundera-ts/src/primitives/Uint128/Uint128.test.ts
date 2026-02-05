import { describe, it, expect } from 'vitest';
import { Uint128, MIN, MAX, SIZE } from './index.js';

describe('Uint128', () => {
  describe('constants', () => {
    it('should have correct MIN value', () => {
      expect(MIN).toBe(0n);
    });

    it('should have correct MAX value', () => {
      expect(MAX).toBe(340282366920938463463374607431768211455n);
    });

    it('should have correct SIZE in bits', () => {
      expect(SIZE).toBe(128);
    });
  });

  describe('from', () => {
    it('should create from bigint', () => {
      const value = Uint128.from(1000000000000000000000n);
      expect(Uint128.toBigInt(value)).toBe(1000000000000000000000n);
    });

    it('should create from number', () => {
      const value = Uint128.from(1000000);
      expect(Uint128.toBigInt(value)).toBe(1000000n);
    });

    it('should create from decimal string', () => {
      const value = Uint128.from('1000000000000000000000');
      expect(Uint128.toBigInt(value)).toBe(1000000000000000000000n);
    });

    it('should create from hex string', () => {
      const value = Uint128.from('0xffffffffffffffffffffffffffffffff');
      expect(Uint128.toBigInt(value)).toBe(340282366920938463463374607431768211455n);
    });

    it('should create MIN value', () => {
      const value = Uint128.from(0n);
      expect(Uint128.toBigInt(value)).toBe(0n);
    });

    it('should create MAX value', () => {
      const value = Uint128.from(340282366920938463463374607431768211455n);
      expect(Uint128.toBigInt(value)).toBe(340282366920938463463374607431768211455n);
    });

    it('should create MAX - 1 value', () => {
      const value = Uint128.from(340282366920938463463374607431768211454n);
      expect(Uint128.toBigInt(value)).toBe(340282366920938463463374607431768211454n);
    });

    it('should throw on negative value', () => {
      expect(() => Uint128.from(-1n)).toThrow();
      expect(() => Uint128.from(-1)).toThrow();
    });

    it('should throw on overflow', () => {
      expect(() => Uint128.from(340282366920938463463374607431768211456n)).toThrow();
    });

    it('should throw on non-integer number', () => {
      expect(() => Uint128.from(1.5)).toThrow();
    });
  });

  describe('toHex', () => {
    it('should convert to hex string with 0x prefix', () => {
      const value = Uint128.from(340282366920938463463374607431768211455n);
      expect(Uint128.toHex(value)).toBe('0xffffffffffffffffffffffffffffffff');
    });

    it('should convert zero to hex', () => {
      const value = Uint128.from(0n);
      expect(Uint128.toHex(value)).toBe('0x0');
    });

    it('should convert small value to hex', () => {
      const value = Uint128.from(18446744073709551616n);
      expect(Uint128.toHex(value)).toBe('0x10000000000000000');
    });
  });

  describe('toBigInt', () => {
    it('should convert to bigint', () => {
      const value = Uint128.from(123456789012345678901234n);
      expect(Uint128.toBigInt(value)).toBe(123456789012345678901234n);
    });

    it('should return bigint type', () => {
      const value = Uint128.from(123456789012345678901234n);
      expect(typeof Uint128.toBigInt(value)).toBe('bigint');
    });
  });

  describe('toFelt', () => {
    it('should convert to Felt252', () => {
      const value = Uint128.from(340282366920938463463374607431768211455n);
      const felt = Uint128.toFelt(value);
      expect(felt.toBigInt()).toBe(340282366920938463463374607431768211455n);
    });

    it('should convert zero to Felt252', () => {
      const value = Uint128.from(0n);
      const felt = Uint128.toFelt(value);
      expect(felt.toBigInt()).toBe(0n);
    });
  });
});
