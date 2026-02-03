import { describe, expect, test } from 'bun:test';
import { encodeShortString } from './encodeShortString';
import { encodeShortStringHex } from './encodeShortStringHex';
import { decodeShortString } from './decodeShortString';
import { Felt252 } from '../Felt252/Felt252';
import { MAX_SHORT_STRING_LENGTH } from '../Felt252/constants';
import { Felt } from '../index';

describe('Short String', () => {
  test('MAX_SHORT_STRING_LENGTH is 31', () => {
    expect(MAX_SHORT_STRING_LENGTH).toBe(31);
  });

  test('encodeShortString encodes hello', () => {
    const encoded = encodeShortString('hello');
    // 'h'=0x68, 'e'=0x65, 'l'=0x6c, 'l'=0x6c, 'o'=0x6f
    // = 0x68656c6c6f = 448378203247
    expect(encoded).toBe(448378203247n);
  });

  test('encodeShortStringHex encodes hello', () => {
    const encoded = encodeShortStringHex('hello');
    expect(encoded).toBe('0x68656c6c6f');
  });

  test('decodeShortString decodes from bigint', () => {
    const decoded = decodeShortString(448378203247n);
    expect(decoded).toBe('hello');
  });

  test('decodeShortString decodes from hex', () => {
    const decoded = decodeShortString('0x68656c6c6f');
    expect(decoded).toBe('hello');
  });

  test('decodeShortString decodes from Felt252', () => {
    const felt = Felt252(448378203247n);
    const decoded = decodeShortString(felt);
    expect(decoded).toBe('hello');
  });

  test('encodeShortString handles empty string', () => {
    const encoded = encodeShortString('');
    expect(encoded).toBe(0n);
  });

  test('decodeShortString handles zero', () => {
    const decoded = decodeShortString(0n);
    expect(decoded).toBe('');
  });

  test('roundtrip preserves value', () => {
    const original = 'test_string_123';
    const encoded = encodeShortString(original);
    const decoded = decodeShortString(encoded);
    expect(decoded).toBe(original);
  });

  test('encodes single character', () => {
    const encoded = encodeShortString('A');
    expect(encoded).toBe(65n); // 'A' = 0x41 = 65
  });

  test('encodes max length string (31 chars)', () => {
    const str = 'a'.repeat(31);
    const encoded = encodeShortString(str);
    expect(typeof encoded).toBe('bigint');
    expect(decodeShortString(encoded)).toBe(str);
  });

  test('rejects non-ASCII characters', () => {
    expect(() => encodeShortString('hello\u00e9')).toThrow('not an ASCII');
  });

  test('rejects string longer than 31 chars', () => {
    const str = 'a'.repeat(32);
    expect(() => encodeShortString(str)).toThrow('too long');
  });

  test('Felt namespace includes short string functions', () => {
    expect(Felt.encodeShortString).toBe(encodeShortString);
    expect(Felt.decodeShortString).toBe(decodeShortString);
    expect(Felt.MAX_SHORT_STRING_LENGTH).toBe(31);
  });
});
