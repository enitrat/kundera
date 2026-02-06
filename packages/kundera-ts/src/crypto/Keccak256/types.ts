declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

/** 32-byte Keccak256 hash output */
export type Keccak256Hash = Brand<Uint8Array, "Keccak256Hash">;
