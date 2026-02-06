import { from } from "./from.js";
import { isValid } from "./isValid.js";
import { MAX_ETH_ADDRESS } from "./constants.js";

/**
 * EthAddress namespace with constructor and utilities
 * @type {import('./from.js').from & {
 *   from: typeof from,
 *   isValid: typeof isValid,
 *   MAX: bigint
 * }}
 */
export const EthAddress = Object.assign(from, {
	from,
	isValid,
	MAX: MAX_ETH_ADDRESS,
});
