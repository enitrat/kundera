/**
 * Compute Declare V3 Hash
 *
 * Poseidon-based hash computation for DECLARE_V3 transactions.
 */

import {
	Felt252,
	type Felt252Type,
	type Felt252Input,
} from "../../primitives/index.js";
import { poseidonHashMany } from "../hash.js";
import {
	TRANSACTION_HASH_PREFIX,
	type DeclareTransactionV3,
} from "../account-types.js";
import { hashTipAndResourceBounds } from "./hashTipAndResourceBounds.js";
import { encodeDAModes } from "./encodeDAModes.js";
import { hashCalldata } from "./hashCalldata.js";

/**
 * Compute transaction hash for DECLARE_V3
 *
 * Hash structure (Poseidon) per starknet-specs v0.10.0:
 * [
 *   "declare" prefix,
 *   version,
 *   sender_address,
 *   h(tip, l1_gas_bounds, l2_gas_bounds),  // Note: L1_DATA omitted per starknet.js v6
 *   h(paymaster_data),
 *   chain_id,
 *   nonce,
 *   da_modes,
 *   h(account_deployment_data),
 *   class_hash,
 *   compiled_class_hash
 * ]
 */
export function computeDeclareV3Hash(
	tx: DeclareTransactionV3,
	chainId: Felt252Input,
): Felt252Type {
	const tipAndResourceBoundsHash = hashTipAndResourceBounds(
		tx.tip,
		tx.resource_bounds,
	);
	const paymasterDataHash = hashCalldata(tx.paymaster_data);
	const accountDeploymentDataHash = hashCalldata(tx.account_deployment_data);
	const daModes = encodeDAModes(
		tx.nonce_data_availability_mode,
		tx.fee_data_availability_mode,
	);

	const elements: Felt252Input[] = [
		TRANSACTION_HASH_PREFIX.DECLARE,
		BigInt(tx.version),
		tx.sender_address,
		tipAndResourceBoundsHash,
		paymasterDataHash,
		chainId,
		tx.nonce,
		daModes,
		accountDeploymentDataHash,
		tx.class_hash,
		tx.compiled_class_hash,
	];

	return poseidonHashMany(elements.map((e) => Felt252(e)));
}
