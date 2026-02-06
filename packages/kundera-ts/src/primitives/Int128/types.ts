declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Int128 - 128-bit signed integer
 *
 * Represents signed integers in the range [-2^127, 2^127 - 1].
 * Internally stores the signed value as a bigint.
 *
 * IMPORTANT: Cairo uses prime field encoding for negative values,
 * NOT two's complement. Use toFelt() for Cairo-compatible encoding.
 */
export type Int128Type = Brand<bigint, "Int128">;

/**
 * Input types that can be converted to Int128
 */
export type Int128Input = Int128Type | bigint | number | string;
