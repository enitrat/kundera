/**
 * Native FFI Tests
 *
 * Tests the Bun FFI bindings to the Rust crypto library.
 * These tests require the native library to be built:
 *   cargo build --release
 */

import { describe, expect, test, beforeAll } from 'bun:test';
import {
  isNativeAvailable,
  getNativeLibraryPath,
  feltAdd,
  feltSub,
  feltMul,
  feltDiv,
  feltNeg,
  feltInverse,
  feltPow,
  feltSqrt,
  pedersenHash,
  poseidonHash,
  poseidonHashMany,
  getPublicKey,
  sign,
  verify,
  StarkResult,
} from './index';
import { Felt252, toBigInt, toHex, equals, FIELD_PRIME } from '../primitives/index';

describe('Native FFI', () => {
  // Skip all tests if native library isn't available
  beforeAll(() => {
    if (!isNativeAvailable()) {
      console.log('Native library not found. Build with: cargo build --release');
      console.log('Skipping native FFI tests.');
    }
  });

  describe('availability', () => {
    test('isNativeAvailable returns boolean', () => {
      const available = isNativeAvailable();
      expect(typeof available).toBe('boolean');
    });

    test('getNativeLibraryPath returns path when available', () => {
      if (!isNativeAvailable()) return;
      const path = getNativeLibraryPath();
      expect(path).not.toBeNull();
      if (path) {
        const lower = path.toLowerCase();
        if (lower.endsWith('.dll')) {
          expect(lower).toContain('starknet_crypto_ffi.dll');
        } else {
          expect(path).toContain('libstarknet_crypto_ffi');
        }
      }
    });
  });

  describe('felt arithmetic', () => {
    test('feltAdd: 2 + 3 = 5', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(2);
      const b = Felt252(3);
      const result = feltAdd(a, b);
      expect(toBigInt(result)).toBe(5n);
    });

    test('feltSub: 10 - 3 = 7', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(10);
      const b = Felt252(3);
      const result = feltSub(a, b);
      expect(toBigInt(result)).toBe(7n);
    });

    test('feltSub: wraps around field', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(3);
      const b = Felt252(10);
      const result = feltSub(a, b);
      // 3 - 10 = -7 mod P = P - 7
      expect(toBigInt(result)).toBe(FIELD_PRIME - 7n);
    });

    test('feltMul: 6 * 7 = 42', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(6);
      const b = Felt252(7);
      const result = feltMul(a, b);
      expect(toBigInt(result)).toBe(42n);
    });

    test('feltDiv: 42 / 7 = 6', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(42);
      const b = Felt252(7);
      const result = feltDiv(a, b);
      expect(toBigInt(result)).toBe(6n);
    });

    test('feltNeg: -5 mod P', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(5);
      const result = feltNeg(a);
      expect(toBigInt(result)).toBe(FIELD_PRIME - 5n);
    });

    test('feltInverse: 1/2 mod P', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(2);
      const inv = feltInverse(a);
      // inv * 2 should equal 1
      const product = feltMul(inv, a);
      expect(toBigInt(product)).toBe(1n);
    });

    test('feltPow: 2^10 = 1024', () => {
      if (!isNativeAvailable()) return;
      const base = Felt252(2);
      const exp = Felt252(10);
      const result = feltPow(base, exp);
      expect(toBigInt(result)).toBe(1024n);
    });

    test('feltSqrt: sqrt(4) = 2 or P-2', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(4);
      const result = feltSqrt(a);
      const value = toBigInt(result);
      // sqrt can return either root
      expect(value === 2n || value === FIELD_PRIME - 2n).toBe(true);
    });
  });

  describe('hashing', () => {
    test('pedersenHash produces 32-byte result', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(1);
      const b = Felt252(2);
      const result = pedersenHash(a, b);
      expect(result.length).toBe(32);
    });

    test('pedersenHash is deterministic', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(123);
      const b = Felt252(456);
      const r1 = pedersenHash(a, b);
      const r2 = pedersenHash(a, b);
      expect(equals(r1, r2)).toBe(true);
    });

    test('poseidonHash produces 32-byte result', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(1);
      const b = Felt252(2);
      const result = poseidonHash(a, b);
      expect(result.length).toBe(32);
    });

    test('poseidonHash differs from pedersenHash', () => {
      if (!isNativeAvailable()) return;
      const a = Felt252(1);
      const b = Felt252(2);
      const ped = pedersenHash(a, b);
      const pos = poseidonHash(a, b);
      expect(equals(ped, pos)).toBe(false);
    });

    test('poseidonHashMany with multiple inputs', () => {
      if (!isNativeAvailable()) return;
      const inputs = [Felt252(1), Felt252(2), Felt252(3)];
      const result = poseidonHashMany(inputs);
      expect(result.length).toBe(32);
    });

    test('poseidonHashMany with single input', () => {
      if (!isNativeAvailable()) return;
      const inputs = [Felt252(42)];
      const result = poseidonHashMany(inputs);
      expect(result.length).toBe(32);
    });
  });

  describe('ECDSA', () => {
    // Use values that are valid field elements (< FIELD_PRIME)
    const TEST_PRIVATE_KEY = Felt252(
      0x123456789abcdef0123456789abcdefn
    );
    const TEST_MESSAGE = Felt252(
      0xdeadbeefcafebabedeadbeefcafebaben
    );

    test('getPublicKey produces 32-byte result', () => {
      if (!isNativeAvailable()) return;
      const pubKey = getPublicKey(TEST_PRIVATE_KEY);
      expect(pubKey.length).toBe(32);
    });

    test('getPublicKey is deterministic', () => {
      if (!isNativeAvailable()) return;
      const pk1 = getPublicKey(TEST_PRIVATE_KEY);
      const pk2 = getPublicKey(TEST_PRIVATE_KEY);
      expect(equals(pk1, pk2)).toBe(true);
    });

    test('sign produces r and s', () => {
      if (!isNativeAvailable()) return;
      const sig = sign(TEST_PRIVATE_KEY, TEST_MESSAGE);
      expect(sig.r.length).toBe(32);
      expect(sig.s.length).toBe(32);
    });

    test('sign is deterministic (RFC6979)', () => {
      if (!isNativeAvailable()) return;
      const sig1 = sign(TEST_PRIVATE_KEY, TEST_MESSAGE);
      const sig2 = sign(TEST_PRIVATE_KEY, TEST_MESSAGE);
      expect(equals(sig1.r, sig2.r)).toBe(true);
      expect(equals(sig1.s, sig2.s)).toBe(true);
    });

    test('verify accepts valid signature', () => {
      if (!isNativeAvailable()) return;
      const pubKey = getPublicKey(TEST_PRIVATE_KEY);
      const sig = sign(TEST_PRIVATE_KEY, TEST_MESSAGE);
      const isValid = verify(pubKey, TEST_MESSAGE, sig);
      expect(isValid).toBe(true);
    });

    test('verify rejects invalid signature', () => {
      if (!isNativeAvailable()) return;
      const pubKey = getPublicKey(TEST_PRIVATE_KEY);
      const sig = sign(TEST_PRIVATE_KEY, TEST_MESSAGE);
      // Corrupt the signature
      const badR = Felt252(toBigInt(sig.r) + 1n);
      const isValid = verify(pubKey, TEST_MESSAGE, { r: badR, s: sig.s });
      expect(isValid).toBe(false);
    });

    test('verify rejects wrong message', () => {
      if (!isNativeAvailable()) return;
      const pubKey = getPublicKey(TEST_PRIVATE_KEY);
      const sig = sign(TEST_PRIVATE_KEY, TEST_MESSAGE);
      const wrongMessage = Felt252(42);
      const isValid = verify(pubKey, wrongMessage, sig);
      expect(isValid).toBe(false);
    });

    test('verify rejects wrong public key', () => {
      if (!isNativeAvailable()) return;
      const wrongKey = getPublicKey(Felt252(999));
      const sig = sign(TEST_PRIVATE_KEY, TEST_MESSAGE);
      const isValid = verify(wrongKey, TEST_MESSAGE, sig);
      expect(isValid).toBe(false);
    });
  });
});
