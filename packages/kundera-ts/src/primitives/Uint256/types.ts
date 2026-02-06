declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Uint256 - 256-bit unsigned integer
 * Range: 0 to 2^256 - 1
 *
 * CRITICAL: In Cairo, u256 is serialized as TWO felt252 values: [low, high]
 * where value = low + high * 2^128
 */
export type Uint256Type = Brand<bigint, "Uint256">;
