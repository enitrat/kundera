/**
 * Compute Invoke V3 Hash
 *
 * Poseidon-based hash computation for INVOKE_V3 transactions.
 */

import {
	Felt252,
	type Felt252Input,
	type Felt252Type,
} from "../../primitives/index.js";
import {
	type InvokeTransactionV3,
	TRANSACTION_HASH_PREFIX,
} from "../account-types.js";
import { poseidonHashMany } from "../hash.js";
import { encodeDAModes } from "./encodeDAModes.js";
import { hashCalldata } from "./hashCalldata.js";
import { hashTipAndResourceBounds } from "./hashTipAndResourceBounds.js";

/**
 * Compute transaction hash for INVOKE_V3
 *
 * Hash structure (Poseidon) per starknet-specs v0.10.0:
 * [
 *   "invoke" prefix,
 *   version,
 *   sender_address,
 *   h(tip, l1_gas_bounds, l2_gas_bounds),  // Note: L1_DATA omitted per starknet.js v6
 *   h(paymaster_data),
 *   chain_id,
 *   nonce,
 *   da_modes,
 *   h(account_deployment_data),
 *   h(calldata)
 * ]
 */
export function computeInvokeV3Hash(
	tx: InvokeTransactionV3,
	chainId: Felt252Input,
): Felt252Type {
	const tipAndResourceBoundsHash = hashTipAndResourceBounds(
		tx.tip,
		tx.resource_bounds,
	);
	const paymasterDataHash = hashCalldata(tx.paymaster_data);
	const accountDeploymentDataHash = hashCalldata(tx.account_deployment_data);
	const calldataHash = hashCalldata(tx.calldata);
	const daModes = encodeDAModes(
		tx.nonce_data_availability_mode,
		tx.fee_data_availability_mode,
	);

	const elements: Felt252Input[] = [
		TRANSACTION_HASH_PREFIX.INVOKE,
		BigInt(tx.version),
		tx.sender_address,
		tipAndResourceBoundsHash,
		paymasterDataHash,
		chainId,
		tx.nonce,
		daModes,
		accountDeploymentDataHash,
		calldataHash,
	];

	return poseidonHashMany(elements.map((e) => Felt252(e)));
}
