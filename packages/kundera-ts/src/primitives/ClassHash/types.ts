import type { FeltMethods } from '../Felt252/types.js';

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * ClassHash - Contract class identifier
 */
export type ClassHashType = Brand<Uint8Array, 'ClassHash'> & FeltMethods;
