import { describe, expect, test } from 'vitest';
import { serializeU256 } from './serializeU256';
import { deserializeU256 } from './deserializeU256';

describe('u256 serialization', () => {
  test('small value roundtrip', () => {
    const value = 42n;
    const [low, high] = serializeU256(value);

    expect(low.toBigInt()).toBe(42n);
    expect(high.toBigInt()).toBe(0n);

    const result = deserializeU256([low, high]);
    expect(result).toBe(value);
  });

  test('large value roundtrip', () => {
    const value = (1n << 200n) + 12345n;
    const [low, high] = serializeU256(value);

    const result = deserializeU256([low, high]);
    expect(result).toBe(value);
  });

  test('max u256 roundtrip', () => {
    const value = (1n << 256n) - 1n;
    const [low, high] = serializeU256(value);

    const result = deserializeU256([low, high]);
    expect(result).toBe(value);
  });

  test('split is correct', () => {
    // Value that spans both limbs
    const value = (123n << 128n) + 456n;
    const [low, high] = serializeU256(value);

    expect(low.toBigInt()).toBe(456n);
    expect(high.toBigInt()).toBe(123n);
  });
});
