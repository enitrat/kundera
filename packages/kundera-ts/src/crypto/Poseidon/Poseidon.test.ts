import { describe, expect, test } from 'bun:test';
import { Poseidon, hash, hashMany } from './index.js';
import { Felt252 } from '../../primitives/Felt252/index.js';

describe('Poseidon', () => {
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

  test('hashMany with array', () => {
    const values = [Felt252(1n), Felt252(2n), Felt252(3n)];
    const h = hashMany(values);
    expect(h.toBigInt()).toBeGreaterThan(0n);
  });

  test('hashMany with single element', () => {
    const values = [Felt252(42n)];
    const h = hashMany(values);
    expect(h.toBigInt()).toBeGreaterThan(0n);
  });

  test('known vector - poseidon(1, 2)', () => {
    // Known from @scure/starknet
    const h = hash(Felt252(1n), Felt252(2n));
    expect(h.toBigInt()).toBe(0x5d44a3decb2b2e0cc71071f7b802f45dd792d064f0fc7316c46514f70f9891an);
  });

  test('namespace works', () => {
    expect(Poseidon.hash).toBe(hash);
    expect(Poseidon.hashMany).toBe(hashMany);
  });
});
