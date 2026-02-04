declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Int32 - 32-bit signed integer
 *
 * Represents signed integers in the range [-2147483648, 2147483647].
 * Internally stores the signed value as a bigint.
 *
 * IMPORTANT: Cairo uses prime field encoding for negative values,
 * NOT two's complement. Use toFelt() for Cairo-compatible encoding.
 */
export type Int32Type = Brand<bigint, 'Int32'>;

/**
 * Input types that can be converted to Int32
 */
export type Int32Input = Int32Type | bigint | number | string;
