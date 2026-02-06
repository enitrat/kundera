declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Uint128 - 128-bit unsigned integer
 * Range: 0 to 2^128 - 1
 */
export type Uint128Type = Brand<bigint, "Uint128">;
