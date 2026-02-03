import type { FeltMethods } from '../Felt252/types.js';

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * EthAddress - L1 Ethereum address used in L1-L2 messaging
 * Must be < 2^160
 */
export type EthAddressType = Brand<Uint8Array, 'EthAddress'> & FeltMethods;
