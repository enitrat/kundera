declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Uint8 - 8-bit unsigned integer
 * Range: 0 to 255
 */
export type Uint8Type = Brand<bigint, "Uint8">;
