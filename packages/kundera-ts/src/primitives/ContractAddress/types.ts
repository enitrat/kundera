import type { FeltMethods } from '../Felt252/types.js';

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * ContractAddress - Starknet contract address
 * Must be < 2^251
 */
export type ContractAddressType = Brand<Uint8Array, 'ContractAddress'> & FeltMethods;
