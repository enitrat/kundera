import { describe, expect, test } from 'bun:test';
import { ClassHash } from './ClassHash';
import { Felt252 } from '../Felt252/Felt252';

describe('ClassHash', () => {
  test('creates valid class hash', () => {
    const hash = ClassHash(42n);
    expect(hash.toBigInt()).toBe(42n);
  });

  test('rejects class hash >= 2^251', () => {
    const bytes = new Uint8Array(32);
    bytes[0] = 0x08; // Sets bit 251
    const tooLarge = Felt252.fromBytes(bytes);
    expect(() => ClassHash(tooLarge)).toThrow('< 2^251');
  });
});
