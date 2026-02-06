declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Uint64 - 64-bit unsigned integer
 * Range: 0 to 18446744073709551615
 */
export type Uint64Type = Brand<bigint, "Uint64">;
