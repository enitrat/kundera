declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Uint16 - 16-bit unsigned integer
 * Range: 0 to 65535
 */
export type Uint16Type = Brand<bigint, "Uint16">;
