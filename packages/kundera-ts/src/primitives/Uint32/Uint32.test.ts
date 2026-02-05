import { describe, it, expect } from 'vitest';
import { Uint32, MIN, MAX, SIZE } from './index.js';

describe('Uint32', () => {
  describe('constants', () => {
    it('should have correct MIN value', () => {
      expect(MIN).toBe(0n);
    });

    it('should have correct MAX value', () => {
      expect(MAX).toBe(4294967295n);
    });

    it('should have correct SIZE in bits', () => {
      expect(SIZE).toBe(32);
    });
  });

  describe('from', () => {
    it('should create from bigint', () => {
      const value = Uint32.from(1000000n);
      expect(Uint32.toBigInt(value)).toBe(1000000n);
    });

    it('should create from number', () => {
      const value = Uint32.from(1000000);
      expect(Uint32.toBigInt(value)).toBe(1000000n);
    });

    it('should create from decimal string', () => {
      const value = Uint32.from('1000000');
      expect(Uint32.toBigInt(value)).toBe(1000000n);
    });

    it('should create from hex string', () => {
      const value = Uint32.from('0xffffffff');
      expect(Uint32.toBigInt(value)).toBe(4294967295n);
    });

    it('should create MIN value', () => {
      const value = Uint32.from(0n);
      expect(Uint32.toBigInt(value)).toBe(0n);
    });

    it('should create MAX value', () => {
      const value = Uint32.from(4294967295n);
      expect(Uint32.toBigInt(value)).toBe(4294967295n);
    });

    it('should create MAX - 1 value', () => {
      const value = Uint32.from(4294967294n);
      expect(Uint32.toBigInt(value)).toBe(4294967294n);
    });

    it('should throw on negative value', () => {
      expect(() => Uint32.from(-1n)).toThrow();
      expect(() => Uint32.from(-1)).toThrow();
    });

    it('should throw on overflow', () => {
      expect(() => Uint32.from(4294967296n)).toThrow();
      expect(() => Uint32.from(4294967296)).toThrow();
    });

    it('should throw on non-integer number', () => {
      expect(() => Uint32.from(1.5)).toThrow();
    });
  });

  describe('toHex', () => {
    it('should convert to hex string with 0x prefix', () => {
      const value = Uint32.from(4294967295n);
      expect(Uint32.toHex(value)).toBe('0xffffffff');
    });

    it('should convert zero to hex', () => {
      const value = Uint32.from(0n);
      expect(Uint32.toHex(value)).toBe('0x0');
    });

    it('should convert small value to hex', () => {
      const value = Uint32.from(65536n);
      expect(Uint32.toHex(value)).toBe('0x10000');
    });
  });

  describe('toBigInt', () => {
    it('should convert to bigint', () => {
      const value = Uint32.from(123456789n);
      expect(Uint32.toBigInt(value)).toBe(123456789n);
    });

    it('should return bigint type', () => {
      const value = Uint32.from(123456789n);
      expect(typeof Uint32.toBigInt(value)).toBe('bigint');
    });
  });

  describe('toFelt', () => {
    it('should convert to Felt252', () => {
      const value = Uint32.from(4294967295n);
      const felt = Uint32.toFelt(value);
      expect(felt.toBigInt()).toBe(4294967295n);
    });

    it('should convert zero to Felt252', () => {
      const value = Uint32.from(0n);
      const felt = Uint32.toFelt(value);
      expect(felt.toBigInt()).toBe(0n);
    });
  });
});
