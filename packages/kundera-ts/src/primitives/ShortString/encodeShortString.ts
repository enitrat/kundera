import { MAX_SHORT_STRING_LENGTH } from '../Felt252/constants.js';
import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type } from '../Felt252/types.js';

function isASCII(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) return false;
  }
  return true;
}

/**
 * Encode a short string to Felt252
 *
 * Short strings are ASCII strings up to 31 characters that fit in a single felt252.
 * Each character is encoded as its ASCII value.
 *
 * @param str - ASCII string (max 31 characters)
 * @returns Encoded value as Felt252Type
 *
 * @example
 * ```ts
 * encodeShortString('hello') // Felt252(448378203247n)
 * ```
 */
export function encodeShortString(str: string): Felt252Type {
  if (!isASCII(str)) {
    throw new Error(`${str} is not an ASCII string`);
  }
  if (str.length > MAX_SHORT_STRING_LENGTH) {
    throw new Error(`${str} is too long for short string (max 31 chars)`);
  }
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    result = (result << 8n) | BigInt(str.charCodeAt(i));
  }
  return Felt252(result);
}
