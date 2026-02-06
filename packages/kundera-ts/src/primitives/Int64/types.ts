declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Int64 - 64-bit signed integer
 *
 * Represents signed integers in the range [-2^63, 2^63 - 1].
 * Internally stores the signed value as a bigint.
 *
 * IMPORTANT: Cairo uses prime field encoding for negative values,
 * NOT two's complement. Use toFelt() for Cairo-compatible encoding.
 */
export type Int64Type = Brand<bigint, "Int64">;

/**
 * Input types that can be converted to Int64
 */
export type Int64Input = Int64Type | bigint | number | string;
