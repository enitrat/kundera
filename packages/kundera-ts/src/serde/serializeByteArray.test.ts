import { describe, expect, test } from 'bun:test';
import { serializeByteArray } from './serializeByteArray';

describe('ByteArray serialization', () => {
  test('short string', () => {
    const data = new TextEncoder().encode('Hello');
    const serialized = serializeByteArray(data);

    // [num_full_words=0, pending_word, pending_word_len=5]
    expect(serialized.length).toBe(3);
    expect(serialized[0]?.toBigInt()).toBe(0n); // no full words
    expect(serialized[2]?.toBigInt()).toBe(5n); // 5 pending bytes
  });

  test('exact 31 bytes', () => {
    const data = new Uint8Array(31).fill(0x42);
    const serialized = serializeByteArray(data);

    // [num_full_words=1, word0, pending_word=0, pending_word_len=0]
    expect(serialized.length).toBe(4);
    expect(serialized[0]?.toBigInt()).toBe(1n); // 1 full word
    expect(serialized[3]?.toBigInt()).toBe(0n); // 0 pending bytes
  });

  test('32 bytes (1 full + 1 pending)', () => {
    const data = new Uint8Array(32).fill(0x42);
    const serialized = serializeByteArray(data);

    // [num_full_words=1, word0, pending_word, pending_word_len=1]
    expect(serialized.length).toBe(4);
    expect(serialized[0]?.toBigInt()).toBe(1n); // 1 full word
    expect(serialized[3]?.toBigInt()).toBe(1n); // 1 pending byte
  });
});
