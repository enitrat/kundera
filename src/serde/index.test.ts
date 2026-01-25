import { describe, expect, test } from 'bun:test';
import {
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
} from './index';
import { Felt252, toBigInt, equals } from '../primitives/index';

describe('u256 serialization', () => {
  test('small value roundtrip', () => {
    const value = 42n;
    const [low, high] = serializeU256(value);

    expect(toBigInt(low)).toBe(42n);
    expect(toBigInt(high)).toBe(0n);

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

    expect(toBigInt(low)).toBe(456n);
    expect(toBigInt(high)).toBe(123n);
  });
});

describe('array serialization', () => {
  test('serializes with length prefix', () => {
    const items = [Felt252(1n), Felt252(2n), Felt252(3n)];
    const serialized = serializeArray(items);

    expect(serialized.length).toBe(4); // length + 3 items
    expect(toBigInt(serialized[0])).toBe(3n); // length
    expect(equals(serialized[1], items[0])).toBe(true);
    expect(equals(serialized[2], items[1])).toBe(true);
    expect(equals(serialized[3], items[2])).toBe(true);
  });

  test('deserializes correctly', () => {
    const items = [Felt252(1n), Felt252(2n), Felt252(3n)];
    const serialized = serializeArray(items);

    const { array, nextOffset } = deserializeArray(serialized);

    expect(array.length).toBe(3);
    expect(nextOffset).toBe(4);
    expect(equals(array[0], items[0])).toBe(true);
  });

  test('empty array', () => {
    const serialized = serializeArray([]);
    expect(serialized.length).toBe(1);
    expect(toBigInt(serialized[0])).toBe(0n);

    const { array, nextOffset } = deserializeArray(serialized);
    expect(array.length).toBe(0);
    expect(nextOffset).toBe(1);
  });
});

describe('ByteArray serialization', () => {
  test('short string', () => {
    const data = new TextEncoder().encode('Hello');
    const serialized = serializeByteArray(data);

    // [num_full_words=0, pending_word, pending_word_len=5]
    expect(serialized.length).toBe(3);
    expect(toBigInt(serialized[0])).toBe(0n); // no full words
    expect(toBigInt(serialized[2])).toBe(5n); // 5 pending bytes
  });

  test('exact 31 bytes', () => {
    const data = new Uint8Array(31).fill(0x42);
    const serialized = serializeByteArray(data);

    // [num_full_words=1, word0, pending_word=0, pending_word_len=0]
    expect(serialized.length).toBe(4);
    expect(toBigInt(serialized[0])).toBe(1n); // 1 full word
    expect(toBigInt(serialized[3])).toBe(0n); // 0 pending bytes
  });

  test('32 bytes (1 full + 1 pending)', () => {
    const data = new Uint8Array(32).fill(0x42);
    const serialized = serializeByteArray(data);

    // [num_full_words=1, word0, pending_word, pending_word_len=1]
    expect(serialized.length).toBe(4);
    expect(toBigInt(serialized[0])).toBe(1n); // 1 full word
    expect(toBigInt(serialized[3])).toBe(1n); // 1 pending byte
  });
});

describe('CairoSerde namespace', () => {
  test('has all functions', () => {
    expect(CairoSerde.serializeU256).toBe(serializeU256);
    expect(CairoSerde.deserializeU256).toBe(deserializeU256);
    expect(CairoSerde.serializeArray).toBe(serializeArray);
    expect(CairoSerde.deserializeArray).toBe(deserializeArray);
    expect(CairoSerde.serializeByteArray).toBe(serializeByteArray);
  });
});
