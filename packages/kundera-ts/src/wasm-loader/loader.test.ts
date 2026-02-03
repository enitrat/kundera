/**
 * WASM Loader Tests
 *
 * Tests the WASM crypto module loader.
 * Skips if WASM artifact not present.
 */

import { describe, expect, test, beforeAll } from 'bun:test';
import {
  isWasmAvailable,
  getWasmPath,
  loadWasmCrypto,
  isWasmLoaded,
  wasmFeltAdd,
  wasmFeltMul,
  wasmPedersenHash,
  wasmPoseidonHash,
  wasmGetPublicKey,
  wasmSign,
  wasmVerify,
} from './index';
import { Felt252 } from '../primitives/index';

// Check if WASM is available
const wasmAvailable = isWasmAvailable();

describe('WASM Loader', () => {
  beforeAll(async () => {
    if (!wasmAvailable) {
      console.log('WASM artifact not found. Build with: cargo build --release --target wasm32-wasip1');
      console.log('Skipping WASM tests.');
      return;
    }

    // Load WASM before tests
    await loadWasmCrypto();
  });

  describe('availability', () => {
    test('isWasmAvailable returns boolean', () => {
      expect(typeof wasmAvailable).toBe('boolean');
    });

    test('getWasmPath returns path when available', () => {
      if (!wasmAvailable) return;
      const path = getWasmPath();
      expect(path).not.toBeNull();
      expect(path).toContain('crypto.wasm');
    });

    test('isWasmLoaded returns true after loading', () => {
      if (!wasmAvailable) return;
      expect(isWasmLoaded()).toBe(true);
    });
  });

  describe('felt arithmetic', () => {
    test('wasmFeltAdd: 2 + 3 = 5', () => {
      if (!wasmAvailable) return;
      const result = wasmFeltAdd(Felt252(2), Felt252(3));
      expect(result.toBigInt()).toBe(5n);
    });

    test('wasmFeltMul: 6 * 7 = 42', () => {
      if (!wasmAvailable) return;
      const result = wasmFeltMul(Felt252(6), Felt252(7));
      expect(result.toBigInt()).toBe(42n);
    });
  });

  describe('hashing', () => {
    test('wasmPedersenHash produces 32-byte result', () => {
      if (!wasmAvailable) return;
      const result = wasmPedersenHash(Felt252(1), Felt252(2));
      expect(result.length).toBe(32);
    });

    test('wasmPedersenHash is deterministic', () => {
      if (!wasmAvailable) return;
      const a = Felt252(123);
      const b = Felt252(456);
      const r1 = wasmPedersenHash(a, b);
      const r2 = wasmPedersenHash(a, b);
      expect(r1.equals(r2)).toBe(true);
    });

    test('wasmPoseidonHash produces 32-byte result', () => {
      if (!wasmAvailable) return;
      const result = wasmPoseidonHash(Felt252(1), Felt252(2));
      expect(result.length).toBe(32);
    });
  });

  describe('ECDSA', () => {
    const privateKey = Felt252(0x123456789abcdef0123456789abcdefn);
    const messageHash = Felt252(0xdeadbeefcafebabedeadbeefcafebaben);

    test('wasmGetPublicKey produces 32-byte result', () => {
      if (!wasmAvailable) return;
      const pubKey = wasmGetPublicKey(privateKey);
      expect(pubKey.length).toBe(32);
    });

    test('wasmSign produces r and s', () => {
      if (!wasmAvailable) return;
      const sig = wasmSign(privateKey, messageHash);
      expect(sig.r.length).toBe(32);
      expect(sig.s.length).toBe(32);
    });

    test('wasmVerify accepts valid signature', () => {
      if (!wasmAvailable) return;
      const pubKey = wasmGetPublicKey(privateKey);
      const sig = wasmSign(privateKey, messageHash);
      const isValid = wasmVerify(pubKey, messageHash, sig.r, sig.s);
      expect(isValid).toBe(true);
    });

    test('wasmVerify rejects invalid signature', () => {
      if (!wasmAvailable) return;
      const pubKey = wasmGetPublicKey(privateKey);
      const sig = wasmSign(privateKey, messageHash);
      const badR = Felt252(sig.r.toBigInt() + 1n);
      const isValid = wasmVerify(pubKey, messageHash, badR, sig.s);
      expect(isValid).toBe(false);
    });
  });

  describe('native vs wasm consistency', () => {
    test('pedersen hash matches between native and wasm', async () => {
      if (!wasmAvailable) return;

      // Import native
      let native;
      try {
        native = await import('../native/index.js');
        if (!native.isNativeAvailable()) return;
      } catch {
        return; // Native not available
      }

      const a = Felt252(12345);
      const b = Felt252(67890);

      const nativeResult = native.pedersenHash(a, b);
      const wasmResult = wasmPedersenHash(a, b);

      expect(nativeResult.equals(wasmResult)).toBe(true);
    });

    test('poseidon hash matches between native and wasm', async () => {
      if (!wasmAvailable) return;

      let native;
      try {
        native = await import('../native/index.js');
        if (!native.isNativeAvailable()) return;
      } catch {
        return;
      }

      const a = Felt252(12345);
      const b = Felt252(67890);

      const nativeResult = native.poseidonHash(a, b);
      const wasmResult = wasmPoseidonHash(a, b);

      expect(nativeResult.equals(wasmResult)).toBe(true);
    });

    test('sign produces same signature in native and wasm', async () => {
      if (!wasmAvailable) return;

      let native;
      try {
        native = await import('../native/index.js');
        if (!native.isNativeAvailable()) return;
      } catch {
        return;
      }

      const privateKey = Felt252(0x123456789abcdef0123456789abcdefn);
      const messageHash = Felt252(0xdeadbeefcafebabedeadbeefcafebaben);

      const nativeSig = native.sign(privateKey, messageHash);
      const wasmSig = wasmSign(privateKey, messageHash);

      expect(nativeSig.r.equals(wasmSig.r)).toBe(true);
      expect(nativeSig.s.equals(wasmSig.s)).toBe(true);
    });
  });
});
