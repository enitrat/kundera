/**
 * Pedersen Hash Tests
 *
 * Tests for the pure JS Pedersen hash implementation using @scure/starknet.
 */

import { describe, expect, test } from 'bun:test';
import { Pedersen, hash, hashMany } from './index';
import { Felt252 } from '../../primitives/Felt252/index.js';

describe('Pedersen', () => {
  // Test vectors from @scure/starknet test suite
  describe('test vectors', () => {
    test('pedersen(0, 0)', () => {
      const h = hash(Felt252(0n), Felt252(0n));
      expect(h.toBigInt()).toBe(
        0x49ee3eba8c1600700ee1b87eb599f16716b0b1022947733551fde4050ca6804n
      );
    });

    test('pedersen(1, 2)', () => {
      const h = hash(Felt252(1n), Felt252(2n));
      expect(h.toBigInt()).toBe(
        0x5bb9440e27889a364bcb678b1f679ecd1347acdedcbf36e83494f857cc58026n
      );
    });

    test('pedersen(2, 3)', () => {
      const h = hash(Felt252(2n), Felt252(3n));
      expect(h.toBigInt()).toBe(
        0x5774fa77b3d843ae9167abd61cf80365a9b2b02218fc2f628494b5bdc9b33b8n
      );
    });

    test('pedersen(3, 4)', () => {
      const h = hash(Felt252(3n), Felt252(4n));
      expect(h.toBigInt()).toBe(
        0x262697b88544f733e5c6907c3e1763131e9f14c51ee7951258abbfb29415fbfn
      );
    });

    test('pedersen with large values', () => {
      const h = hash(
        Felt252('0x3d937c035c878245caf64531a5756109c53068da139362728feb561405371cb'),
        Felt252('0x208a0a10250e382e1e4bbe2880906c2791bf6275695e02fbbc6aeff9cd8b31a')
      );
      expect(h.toBigInt()).toBe(
        0x30e480bed5fe53fa909cc0f8c4d99b8f9f2c016be4c41e13a4848797979c662n
      );
    });

    test('pedersen with large values 2', () => {
      const h = hash(
        Felt252('0x58f580910a6ca59b28927c08fe6c43e2e303ca384badc365795fc645d479d45'),
        Felt252('0x78734f65a067be9bdb39de18434d71e79f7b6466a4b66bbd979ab9e7515fe0b')
      );
      expect(h.toBigInt()).toBe(
        0x68cc0b76cddd1dd4ed2301ada9b7c872b23875d5ff837b3a87993e0d9996b87n
      );
    });

    test('pedersen with max field value', () => {
      const big = 3618502788666131213697322783095070105623107215331596699973092056135872020475n;
      const h = hash(Felt252(big), Felt252(big));
      expect(h.toBigInt()).toBe(
        0x721e167a36655994e88efa865e2ed8a0488d36db4d988fec043cda755728223n
      );
    });

    test('pedersen with field_prime - 1', () => {
      const big = 3618502788666131213697322783095070105623107215331596699973092056135872020480n;
      const h = hash(Felt252(big), Felt252(big));
      expect(h.toBigInt()).toBe(
        0x7258fccaf3371fad51b117471d9d888a1786c5694c3e6099160477b593a576en
      );
    });
  });

  describe('hashMany', () => {
    test('empty array returns zero', () => {
      const h = hashMany([]);
      expect(h.toBigInt()).toBe(0n);
    });

    test('single element returns identity', () => {
      // hashMany([x]) returns x (no hashing needed for single element)
      const h = hashMany([Felt252(42n)]);
      expect(h.toBigInt()).toBe(42n);
    });

    test('two elements equals hash(a, b)', () => {
      const a = Felt252(1n);
      const b = Felt252(2n);
      const chained = hashMany([a, b]);
      const direct = hash(a, b);
      expect(chained.toBigInt()).toBe(direct.toBigInt());
    });

    test('chaining: hashMany([a,b,c]) = hash(hash(a,b), c)', () => {
      const a = Felt252(1n);
      const b = Felt252(2n);
      const c = Felt252(3n);

      const chained = hashMany([a, b, c]);
      const manual = hash(hash(a, b), c);

      expect(chained.toBigInt()).toBe(manual.toBigInt());
    });
  });

  test('deterministic', () => {
    const a = Felt252(123n);
    const b = Felt252(456n);
    const h1 = hash(a, b);
    const h2 = hash(a, b);
    expect(h1.toBigInt()).toBe(h2.toBigInt());
  });

  test('namespace works', () => {
    expect(Pedersen.hash).toBe(hash);
    expect(Pedersen.hashMany).toBe(hashMany);
  });

  test('result is valid Felt252', () => {
    const a = Felt252(100n);
    const b = Felt252(200n);
    const h = hash(a, b);
    expect(h.isValid()).toBe(true);
    expect(h.length).toBe(32);
  });

  test('hashMany chaining is correct', () => {
    // hashMany([a, b, c]) should equal hash(hash(a, b), c)
    const a = Felt252(1n);
    const b = Felt252(2n);
    const c = Felt252(3n);

    const chained = hashMany([a, b, c]);
    const manual = hash(hash(a, b), c);

    expect(chained.toBigInt()).toBe(manual.toBigInt());
  });
});
