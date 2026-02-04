declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Uint32 - 32-bit unsigned integer
 * Range: 0 to 4294967295
 */
export type Uint32Type = Brand<bigint, 'Uint32'>;
