import type { FeltMethods } from '../Felt252/types.js';

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * StorageKey - Storage slot address
 */
export type StorageKeyType = Brand<Uint8Array, 'StorageKey'> & FeltMethods;
