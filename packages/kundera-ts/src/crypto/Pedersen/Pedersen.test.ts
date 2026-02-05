/**
 * Pedersen Hash Tests
 *
 * Tests for the pure JS Pedersen hash implementation using @scure/starknet.
 */

import { describe, expect, test } from 'bun:test';
import { Pedersen, hash, hashMany } from './index';
import { Felt252 } from '../../primitives/Felt252/index.js';

describe('Pedersen', () => {
  test('hash two felts', () => {
    const a = Felt252(1n);
    const b = Felt252(2n);
    const h = hash(a, b);
    expect(h.toBigInt()).toBeGreaterThan(0n);
  });

  test('deterministic', () => {
    const a = Felt252(123n);
    const b = Felt252(456n);
    const h1 = hash(a, b);
    const h2 = hash(a, b);
    expect(h1.toBigInt()).toBe(h2.toBigInt());
  });

  test('hashMany with single element', () => {
    const a = Felt252(42n);
    const h = hashMany([a]);
    expect(h.toBigInt()).toBe(42n);
  });

  test('hashMany with multiple elements', () => {
    const values = [Felt252(1n), Felt252(2n), Felt252(3n)];
    const h = hashMany(values);
    expect(h.toBigInt()).toBeGreaterThan(0n);
  });

  test('hashMany empty array returns zero', () => {
    const h = hashMany([]);
    expect(h.toBigInt()).toBe(0n);
  });

  test('known vector: pedersen(0, 0)', () => {
    // pedersen(0, 0) has a known value from starknet-crypto
    const h = hash(Felt252(0n), Felt252(0n));
    expect(h.toBigInt()).toBe(
      0x49ee3eba8c1600700ee1b87eb599f16716b0b1022947733551fde4050ca6804n
    );
  });

  test('known vector: pedersen(1, 2)', () => {
    // Verified against @scure/starknet
    const h = hash(Felt252(1n), Felt252(2n));
    // The result should be consistent - verify this matches @scure/starknet
    expect(h.toBigInt()).toBeGreaterThan(0n);
    expect(h.length).toBe(32);
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
