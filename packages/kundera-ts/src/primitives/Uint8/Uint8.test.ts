import { describe, it, expect } from 'vitest';
import { Uint8, MIN, MAX, SIZE } from './index.js';

describe('Uint8', () => {
  describe('constants', () => {
    it('should have correct MIN value', () => {
      expect(MIN).toBe(0n);
    });

    it('should have correct MAX value', () => {
      expect(MAX).toBe(255n);
    });

    it('should have correct SIZE in bits', () => {
      expect(SIZE).toBe(8);
    });
  });

  describe('from', () => {
    it('should create from bigint', () => {
      const value = Uint8.from(100n);
      expect(Uint8.toBigInt(value)).toBe(100n);
    });

    it('should create from number', () => {
      const value = Uint8.from(100);
      expect(Uint8.toBigInt(value)).toBe(100n);
    });

    it('should create from decimal string', () => {
      const value = Uint8.from('100');
      expect(Uint8.toBigInt(value)).toBe(100n);
    });

    it('should create from hex string', () => {
      const value = Uint8.from('0xff');
      expect(Uint8.toBigInt(value)).toBe(255n);
    });

    it('should create MIN value', () => {
      const value = Uint8.from(0n);
      expect(Uint8.toBigInt(value)).toBe(0n);
    });

    it('should create MAX value', () => {
      const value = Uint8.from(255n);
      expect(Uint8.toBigInt(value)).toBe(255n);
    });

    it('should create MAX - 1 value', () => {
      const value = Uint8.from(254n);
      expect(Uint8.toBigInt(value)).toBe(254n);
    });

    it('should throw on negative value', () => {
      expect(() => Uint8.from(-1n)).toThrow();
      expect(() => Uint8.from(-1)).toThrow();
    });

    it('should throw on overflow', () => {
      expect(() => Uint8.from(256n)).toThrow();
      expect(() => Uint8.from(256)).toThrow();
    });

    it('should throw on non-integer number', () => {
      expect(() => Uint8.from(1.5)).toThrow();
    });
  });

  describe('toHex', () => {
    it('should convert to hex string with 0x prefix', () => {
      const value = Uint8.from(255n);
      expect(Uint8.toHex(value)).toBe('0xff');
    });

    it('should convert zero to hex', () => {
      const value = Uint8.from(0n);
      expect(Uint8.toHex(value)).toBe('0x0');
    });

    it('should convert small value to hex', () => {
      const value = Uint8.from(16n);
      expect(Uint8.toHex(value)).toBe('0x10');
    });
  });

  describe('toBigInt', () => {
    it('should convert to bigint', () => {
      const value = Uint8.from(123n);
      expect(Uint8.toBigInt(value)).toBe(123n);
    });

    it('should return bigint type', () => {
      const value = Uint8.from(123n);
      expect(typeof Uint8.toBigInt(value)).toBe('bigint');
    });
  });

  describe('toFelt', () => {
    it('should convert to Felt252', () => {
      const value = Uint8.from(255n);
      const felt = Uint8.toFelt(value);
      expect(felt.toBigInt()).toBe(255n);
    });

    it('should convert zero to Felt252', () => {
      const value = Uint8.from(0n);
      const felt = Uint8.toFelt(value);
      expect(felt.toBigInt()).toBe(0n);
    });
  });
});
