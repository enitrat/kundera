import type { Uint128Type } from './types.js';

/** Minimum Uint128 value: 0 */
export const MIN = 0n as Uint128Type;

/** Maximum Uint128 value: 2^128 - 1 */
export const MAX = (2n ** 128n - 1n) as Uint128Type;

/** Size in bits */
export const SIZE = 128;
