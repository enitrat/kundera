import type { Uint256Type } from './types.js';

/** Minimum Uint256 value: 0 */
export const MIN = 0n as Uint256Type;

/** Maximum Uint256 value: 2^256 - 1 */
export const MAX = (2n ** 256n - 1n) as Uint256Type;

/** Size in bits */
export const SIZE = 256;

/** Mask for extracting low 128 bits */
export const LOW_MASK = (2n ** 128n - 1n);
