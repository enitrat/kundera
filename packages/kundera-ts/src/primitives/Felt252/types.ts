declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export interface FeltMethods {
	toHex(): string;
	toBigInt(): bigint;
	isValid(): boolean;
	isZero(): boolean;
	equals(other: Felt252Type): boolean;
}

/**
 * Felt252 - 252-bit field element
 *
 * The fundamental type in Starknet. All values are elements of the
 * finite field F_p where p = 2^251 + 17*2^192 + 1.
 */
export type Felt252Type = Brand<Uint8Array, "Felt252"> & FeltMethods;

/**
 * Input types that can be converted to Felt252
 */
export type Felt252Input = Felt252Type | Uint8Array | string | bigint | number;
