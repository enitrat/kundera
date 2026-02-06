import { Felt252 } from "../Felt252/index.js";
import { MAX_ETH_ADDRESS } from "./constants.js";

/**
 * Check if a value is a valid EthAddress (< 2^160)
 * @param {import('../Felt252/types.js').Felt252Input} felt
 * @returns {boolean}
 */
export function isValid(felt) {
	return Felt252(felt).toBigInt() < MAX_ETH_ADDRESS;
}
