/**
 * Crypto Module Tests
 *
 * Tests crypto functions - uses native FFI when available, stubs otherwise.
 */

import { describe, expect, test } from 'bun:test';
import '../test-utils/setupCrypto';
import {
  pedersenHash,
  poseidonHash,
  poseidonHashMany,
  sign,
  verify,
  getPublicKey,
  recover,
  snKeccak,
  feltAdd,
  feltSub,
  feltMul,
  feltDiv,
  feltNeg,
  feltInverse,
  feltPow,
  feltSqrt,
  isNativeAvailable,
  isWasmAvailable,
  isWasmLoaded,
  loadWasmCrypto,
  Pedersen,
  Poseidon,
  StarkCurve,
  Felt,
} from './index';
import { Felt252, toBigInt, equals, FIELD_PRIME } from '../primitives/index';

// Detect native availability once
const nativeAvailable = isNativeAvailable();

describe('Crypto module', () => {
  const a = Felt252(1n);
  const b = Felt252(2n);

  describe('native availability', () => {
    test('isNativeAvailable returns boolean', () => {
      expect(typeof nativeAvailable).toBe('boolean');
      if (nativeAvailable) {
        console.log('Native FFI is available - running full tests');
      } else {
        console.log('Native FFI not available - testing stubs');
      }
    });
  });

  const cryptoReady = () => nativeAvailable || isWasmLoaded();

  describe('hashing', () => {
    test('pedersenHash works when crypto is available (or throws otherwise)', () => {
      if (!cryptoReady()) {
        expect(() => pedersenHash(a, b)).toThrow('Not implemented');
        return;
      }
      const result = pedersenHash(a, b);
      expect(result.length).toBe(32);
    });

    test('poseidonHash works when crypto is available (or throws otherwise)', () => {
      if (!cryptoReady()) {
        expect(() => poseidonHash(a, b)).toThrow('Not implemented');
        return;
      }
      const result = poseidonHash(a, b);
      expect(result.length).toBe(32);
    });

    test('poseidonHashMany works when crypto is available (or throws otherwise)', () => {
      if (!cryptoReady()) {
        expect(() => poseidonHashMany([a, b])).toThrow('Not implemented');
        return;
      }
      const result = poseidonHashMany([a, b]);
      expect(result.length).toBe(32);
    });

    // snKeccak computes truncated keccak256 (250 bits) for Starknet selectors
    test('snKeccak computes selector', () => {
      if (!cryptoReady()) {
        expect(() => snKeccak('transfer')).toThrow('Not implemented');
        return;
      }
      // Test with known input - "transfer" selector
      const result = snKeccak('transfer');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
      // Result should be < 2^250 (masked)
      const value = toBigInt(result);
      expect(value).toBeLessThan(1n << 250n);
    });

    // Golden vector tests for snKeccak
    describe('snKeccak golden vectors', () => {
      // Known Starknet selectors (verified against starknet.js 6.23.1)
      const goldenVectors: Array<{ input: string; expected: bigint }> = [
        // Empty string
        {
          input: '',
          // keccak256('') masked to 250 bits
          expected: 0x1d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470n,
        },
        // Standard function selectors
        {
          input: 'transfer',
          expected: 0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12en,
        },
        {
          input: '__execute__',
          expected: 0x15d40a3d6ca2ac30f4031e42be28da9b056fef9bb7357ac5e85627ee876e5adn,
        },
        {
          input: 'balanceOf',
          expected: 0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76en,
        },
        {
          input: 'approve',
          expected: 0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480cn,
        },
        {
          input: 'transferFrom',
          expected: 0x41b033f4a31df8067c24d1e9b550a2ce75fd4a29e1147af9752174f0e6cb20n,
        },
      ];

      for (const { input, expected } of goldenVectors) {
        test(`snKeccak("${input || '<empty>'}") matches expected`, () => {
          if (!cryptoReady()) {
            expect(() => snKeccak(input)).toThrow('Not implemented');
            return;
          }
          const result = snKeccak(input);
          const value = toBigInt(result);
          expect(value).toBe(expected);
        });
      }

      test('snKeccak works with Uint8Array input', () => {
        if (!cryptoReady()) {
          expect(() => snKeccak('transfer')).toThrow('Not implemented');
          return;
        }
        const bytes = new TextEncoder().encode('transfer');
        const fromBytes = snKeccak(bytes);
        const fromString = snKeccak('transfer');
        expect(equals(fromBytes, fromString)).toBe(true);
      });

      test('snKeccak result is always < 2^250', () => {
        if (!cryptoReady()) {
          expect(() => snKeccak('transfer')).toThrow('Not implemented');
          return;
        }
        // Test with various inputs to ensure masking works
        const testInputs = ['a', 'test', 'longerinput', '\x00\x01\x02'];
        for (const input of testInputs) {
          const result = snKeccak(input);
          const value = toBigInt(result);
          expect(value).toBeLessThan(1n << 250n);
        }
      });
    });
  });

  describe('felt arithmetic', () => {
    test('feltAdd: 2 + 3 = 5 (or throws without crypto)', () => {
      if (!cryptoReady()) {
        expect(() => feltAdd(a, b)).toThrow('Not implemented');
        return;
      }
      const result = feltAdd(Felt252(2), Felt252(3));
      expect(toBigInt(result)).toBe(5n);
    });

    test('feltSub: 10 - 3 = 7 (or throws without crypto)', () => {
      if (!cryptoReady()) {
        expect(() => feltSub(a, b)).toThrow('Not implemented');
        return;
      }
      const result = feltSub(Felt252(10), Felt252(3));
      expect(toBigInt(result)).toBe(7n);
    });

    test('feltMul: 6 * 7 = 42 (or throws without crypto)', () => {
      if (!cryptoReady()) {
        expect(() => feltMul(a, b)).toThrow('Not implemented');
        return;
      }
      const result = feltMul(Felt252(6), Felt252(7));
      expect(toBigInt(result)).toBe(42n);
    });

    test('feltDiv: 42 / 7 = 6 (or throws without crypto)', () => {
      if (!cryptoReady()) {
        expect(() => feltDiv(a, b)).toThrow('Not implemented');
        return;
      }
      const result = feltDiv(Felt252(42), Felt252(7));
      expect(toBigInt(result)).toBe(6n);
    });

    test('feltNeg: -5 mod P (or throws without crypto)', () => {
      if (!cryptoReady()) {
        expect(() => feltNeg(a)).toThrow('Not implemented');
        return;
      }
      const result = feltNeg(Felt252(5));
      expect(toBigInt(result)).toBe(FIELD_PRIME - 5n);
    });

    test('feltInverse: 1/2 * 2 = 1 (or throws without crypto)', () => {
      if (!cryptoReady()) {
        expect(() => feltInverse(a)).toThrow('Not implemented');
        return;
      }
      const two = Felt252(2);
      const inv = feltInverse(two);
      const product = feltMul(inv, two);
      expect(toBigInt(product)).toBe(1n);
    });

    test('feltPow: 2^10 = 1024 (or throws without crypto)', () => {
      if (!cryptoReady()) {
        expect(() => feltPow(a, b)).toThrow('Not implemented');
        return;
      }
      const result = feltPow(Felt252(2), Felt252(10));
      expect(toBigInt(result)).toBe(1024n);
    });

    test('feltSqrt: sqrt(4) = 2 or P-2 (or throws without crypto)', () => {
      if (!cryptoReady()) {
        expect(() => feltSqrt(a)).toThrow('Not implemented');
        return;
      }
      const result = feltSqrt(Felt252(4));
      const value = toBigInt(result);
      expect(value === 2n || value === FIELD_PRIME - 2n).toBe(true);
    });
  });

  describe('ECDSA', () => {
    // Use values that are valid field elements (< FIELD_PRIME)
    const privateKey = Felt252(
      0x123456789abcdef0123456789abcdefn
    );
    const messageHash = Felt252(
      0xdeadbeefcafebabedeadbeefcafebaben
    );

    test('getPublicKey works when crypto is available (or throws otherwise)', () => {
      if (!cryptoReady()) {
        expect(() => getPublicKey(a)).toThrow('Not implemented');
        return;
      }
      const pubKey = getPublicKey(privateKey);
      expect(pubKey.length).toBe(32);
    });

    test('sign works when crypto is available (or throws otherwise)', () => {
      if (!cryptoReady()) {
        expect(() => sign(a, b)).toThrow('Not implemented');
        return;
      }
      const sig = sign(privateKey, messageHash);
      expect(sig.r.length).toBe(32);
      expect(sig.s.length).toBe(32);
    });

    test('verify works when crypto is available (or throws otherwise)', () => {
      if (!cryptoReady()) {
        expect(() => verify(a, b, { r: a, s: b })).toThrow('Not implemented');
        return;
      }
      const pubKey = getPublicKey(privateKey);
      const sig = sign(privateKey, messageHash);
      const isValid = verify(pubKey, messageHash, sig);
      expect(isValid).toBe(true);
    });

    test('verify rejects invalid signature when crypto is available', () => {
      if (!cryptoReady()) {
        expect(() => verify(a, b, { r: a, s: b })).toThrow('Not implemented');
        return;
      }
      const pubKey = getPublicKey(privateKey);
      const sig = sign(privateKey, messageHash);
      const badSig = { r: Felt252(1), s: sig.s };
      const isValid = verify(pubKey, messageHash, badSig);
      expect(isValid).toBe(false);
    });

    test('recover works when crypto is available (or throws otherwise)', () => {
      if (!cryptoReady()) {
        expect(() => recover(a, a, b, Felt252(0))).toThrow('Not implemented');
        return;
      }
      const sig = sign(privateKey, messageHash);
      const pubKey = getPublicKey(privateKey);
      let recovered: Felt252Type | null = null;

      for (const v of [Felt252(0), Felt252(1)]) {
        try {
          const candidate = recover(messageHash, sig.r, sig.s, v);
          if (equals(candidate, pubKey)) {
            recovered = candidate;
            break;
          }
        } catch {
          // try next v
        }
      }

      expect(recovered).not.toBeNull();
    });
  });
});

describe('Namespace exports', () => {
  test('Pedersen namespace has hash', () => {
    expect(Pedersen.hash).toBe(pedersenHash);
  });

  test('Poseidon namespace has hash and hashMany', () => {
    expect(Poseidon.hash).toBe(poseidonHash);
    expect(Poseidon.hashMany).toBe(poseidonHashMany);
  });

  test('StarkCurve namespace has sign, verify, getPublicKey, recover', () => {
    expect(StarkCurve.sign).toBe(sign);
    expect(StarkCurve.verify).toBe(verify);
    expect(StarkCurve.getPublicKey).toBe(getPublicKey);
    expect(StarkCurve.recover).toBe(recover);
  });

  test('Felt namespace has all arithmetic operations', () => {
    expect(Felt.add).toBe(feltAdd);
    expect(Felt.sub).toBe(feltSub);
    expect(Felt.mul).toBe(feltMul);
    expect(Felt.div).toBe(feltDiv);
    expect(Felt.neg).toBe(feltNeg);
    expect(Felt.inverse).toBe(feltInverse);
    expect(Felt.pow).toBe(feltPow);
    expect(Felt.sqrt).toBe(feltSqrt);
  });
});
