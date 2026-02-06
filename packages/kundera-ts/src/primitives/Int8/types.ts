declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Int8 - 8-bit signed integer
 *
 * Represents signed integers in the range [-128, 127].
 * Internally stores the signed value as a bigint.
 *
 * IMPORTANT: Cairo uses prime field encoding for negative values,
 * NOT two's complement. Use toFelt() for Cairo-compatible encoding.
 */
export type Int8Type = Brand<bigint, "Int8">;

/**
 * Input types that can be converted to Int8
 */
export type Int8Input = Int8Type | bigint | number | string;
