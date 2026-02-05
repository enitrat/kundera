import { BYTES_PER_WORD } from './constants.js';

/**
 * Convert ByteArray to Uint8Array
 *
 * @param {import('./types.js').ByteArrayType} byteArray
 * @returns {Uint8Array}
 */
export function toBytes(byteArray) {
  const totalLen = byteArray.data.length * BYTES_PER_WORD + byteArray.pendingWordLen;
  const result = new Uint8Array(totalLen);
  let offset = 0;

  // Write full words
  for (const word of byteArray.data) {
    bigIntToBytes(word, result, offset, BYTES_PER_WORD);
    offset += BYTES_PER_WORD;
  }

  // Write pending word
  if (byteArray.pendingWordLen > 0) {
    bigIntToBytes(byteArray.pendingWord, result, offset, byteArray.pendingWordLen);
  }

  return result;
}

/**
 * Write bigint to byte array (big-endian)
 * @param {bigint} value
 * @param {Uint8Array} out
 * @param {number} offset
 * @param {number} len
 */
function bigIntToBytes(value, out, offset, len) {
  for (let i = len - 1; i >= 0; i--) {
    out[offset + i] = Number(value & 0xffn);
    value >>= 8n;
  }
}
