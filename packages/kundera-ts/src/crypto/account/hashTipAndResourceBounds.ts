/**
 * Hash Tip and Resource Bounds
 *
 * Encode and hash tip + resource bounds for V3 transactions.
 */

import { Felt252, type Felt252Type } from "../../primitives/index.js";
import { poseidonHashMany } from "../hash.js";
import { RESOURCE_TYPE } from "./constants.js";
import type { ResourceBoundsMapping } from "../account-types.js";

/**
 * Encode a single resource bound into a felt
 *
 * Layout per Starknet spec:
 *   60 bits (resource_type) | 64 bits (max_amount) | 128 bits (max_price_per_unit)
 * Total: 252 bits
 *
 * @param resourceType - Resource type identifier
 * @param maxAmount - Maximum amount (64 bits)
 * @param maxPricePerUnit - Maximum price per unit in fri (128 bits)
 */
function encodeResourceBound(
	resourceType: bigint,
	maxAmount: bigint,
	maxPricePerUnit: bigint,
): bigint {
	const RESOURCE_TYPE_BITS = 60n;
	const MAX_AMOUNT_BITS = 64n;
	const MAX_PRICE_BITS = 128n;

	if (resourceType >= 1n << RESOURCE_TYPE_BITS) {
		throw new Error("resource_type exceeds 60 bits");
	}
	if (maxAmount >= 1n << MAX_AMOUNT_BITS) {
		throw new Error("max_amount exceeds 64 bits");
	}
	if (maxPricePerUnit >= 1n << MAX_PRICE_BITS) {
		throw new Error("max_price_per_unit exceeds 128 bits");
	}

	// Layout: resource_type (60) | max_amount (64) | max_price_per_unit (128)
	return (
		(resourceType << (MAX_AMOUNT_BITS + MAX_PRICE_BITS)) |
		(maxAmount << MAX_PRICE_BITS) |
		maxPricePerUnit
	);
}

/**
 * Hash tip and resource bounds together for V3 transactions
 * Per starknet.js v6: h(tip, l1_gas_bounds, l2_gas_bounds)
 * Note: L1_DATA is NOT included in the fee field hash per current implementations
 *
 * @param tip - Transaction tip
 * @param resourceBounds - Resource bounds mapping
 */
export function hashTipAndResourceBounds(
	tip: bigint,
	resourceBounds: ResourceBoundsMapping,
): Felt252Type {
	const l1Gas = encodeResourceBound(
		RESOURCE_TYPE.L1_GAS,
		resourceBounds.l1_gas.max_amount,
		resourceBounds.l1_gas.max_price_per_unit,
	);
	const l2Gas = encodeResourceBound(
		RESOURCE_TYPE.L2_GAS,
		resourceBounds.l2_gas.max_amount,
		resourceBounds.l2_gas.max_price_per_unit,
	);
	// Note: L1_DATA is NOT included per starknet.js/starknet-jvm implementations
	return poseidonHashMany([Felt252(tip), Felt252(l1Gas), Felt252(l2Gas)]);
}
