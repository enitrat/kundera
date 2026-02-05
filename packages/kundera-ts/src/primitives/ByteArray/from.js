import { BYTES_PER_WORD } from './constants.js';

/**
 * Create ByteArray from Uint8Array
 *
 * Splits the input into 31-byte words and a pending partial word.
 *
 * @param {Uint8Array} bytes - Input bytes
 * @returns {import('./types.js').ByteArrayType}
 */
export function from(bytes) {
  const data = [];
  let offset = 0;

  // Process full 31-byte words
  while (offset + BYTES_PER_WORD <= bytes.length) {
    const word = bytesToBigInt(bytes.subarray(offset, offset + BYTES_PER_WORD));
    data.push(word);
    offset += BYTES_PER_WORD;
  }

  // Process remaining bytes as pending word
  const remaining = bytes.length - offset;
  let pendingWord = 0n;
  if (remaining > 0) {
    pendingWord = bytesToBigInt(bytes.subarray(offset));
  }

  return /** @type {any} */ ({
    data,
    pendingWord,
    pendingWordLen: remaining,
  });
}

/**
 * Convert bytes to bigint (big-endian)
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
function bytesToBigInt(bytes) {
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(/** @type {number} */ (bytes[i]));
  }
  return result;
}
