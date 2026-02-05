declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * ByteArray - Variable-length byte sequence
 *
 * Matches Cairo's ByteArray: an array of 31-byte words plus a pending partial word.
 * Used for strings and arbitrary byte data in Starknet.
 *
 * Structure:
 * - data: Array of full 31-byte words (as Felt252)
 * - pendingWord: Partial word with < 31 bytes (as Felt252)
 * - pendingWordLen: Number of bytes in pendingWord (0-30)
 */
export interface ByteArrayData {
  /** Full 31-byte words, each stored as bigint */
  readonly data: readonly bigint[];
  /** Partial word (< 31 bytes) as bigint */
  readonly pendingWord: bigint;
  /** Number of bytes in pendingWord (0-30) */
  readonly pendingWordLen: number;
}

export type ByteArrayType = Brand<ByteArrayData, 'ByteArray'>;

/**
 * Input types that can be converted to ByteArray
 */
export type ByteArrayInput = ByteArrayType | Uint8Array | string;
