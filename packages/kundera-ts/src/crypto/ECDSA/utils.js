import { toBigIntInternal } from '../../primitives/Felt252/index.js';

/**
 * Convert Felt252Type to hex without 0x prefix, padded to 64 chars
 * @param {import('../../primitives/index.js').Felt252Type} felt
 * @returns {string}
 */
export function feltToHex64(felt) {
  return toBigIntInternal(felt).toString(16).padStart(64, '0');
}

/**
 * Convert hex string to Uint8Array
 * @param {string} hex - Hex string without 0x prefix
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
