/** @import { Uint256Type } from './types.js' */

/** Minimum Uint256 value: 0
 * @type {Uint256Type}
 */
export const MIN = /** @type {Uint256Type} */ (0n);

/** Maximum Uint256 value: 2^256 - 1
 * @type {Uint256Type}
 */
export const MAX = /** @type {Uint256Type} */ (2n ** 256n - 1n);

/** Size in bits */
export const SIZE = 256;

/** Mask for extracting low 128 bits */
export const LOW_MASK = 2n ** 128n - 1n;
