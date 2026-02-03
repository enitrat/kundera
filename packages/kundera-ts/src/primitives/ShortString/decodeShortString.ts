import type { Felt252Type } from '../Felt252/types.js';

/**
 * Decode a short string from felt
 *
 * @param felt - Felt value as bigint, hex string, or Felt252
 * @returns Decoded ASCII string
 *
 * @example
 * ```ts
 * decodeShortString(448378203247n) // 'hello'
 * decodeShortString('0x68656c6c6f') // 'hello'
 * ```
 */
export function decodeShortString(felt: bigint | string | Felt252Type): string {
  let value: bigint;
  if (typeof felt === 'bigint') {
    value = felt;
  } else if (typeof felt === 'string') {
    value = BigInt(felt.startsWith('0x') ? felt : '0x' + felt);
  } else {
    value = felt.toBigInt();
  }

  if (value === 0n) return '';

  let str = '';
  while (value > 0n) {
    const charCode = Number(value & 0xffn);
    if (charCode !== 0) {
      str = String.fromCharCode(charCode) + str;
    }
    value >>= 8n;
  }
  return str;
}
