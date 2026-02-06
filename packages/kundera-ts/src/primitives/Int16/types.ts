declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Int16 - 16-bit signed integer
 *
 * Represents signed integers in the range [-32768, 32767].
 * Internally stores the signed value as a bigint.
 *
 * IMPORTANT: Cairo uses prime field encoding for negative values,
 * NOT two's complement. Use toFelt() for Cairo-compatible encoding.
 */
export type Int16Type = Brand<bigint, "Int16">;

/**
 * Input types that can be converted to Int16
 */
export type Int16Input = Int16Type | bigint | number | string;
