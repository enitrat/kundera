import { MAX_CONTRACT_ADDRESS } from "./constants.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { isValid } from "./isValid.js";

/**
 * ContractAddress namespace with constructor and utilities
 * @type {import('./from.js').from & {
 *   from: typeof from,
 *   fromHex: typeof fromHex,
 *   isValid: typeof isValid,
 *   MAX: bigint
 * }}
 */
export const ContractAddress = Object.assign(from, {
	from,
	fromHex,
	isValid,
	MAX: MAX_CONTRACT_ADDRESS,
});
