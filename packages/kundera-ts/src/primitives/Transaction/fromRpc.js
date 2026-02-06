import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import { fromHex as addressFromHex } from "../ContractAddress/fromHex.js";
import { fromHex as classHashFromHex } from "../ClassHash/fromHex.js";

/**
 * @param {import('../../jsonrpc/types.js').ResourceBounds} rpc
 * @returns {import('./types.js').ResourceBoundsType}
 */
export function resourceBoundsFromRpc(rpc) {
	return {
		max_amount: feltFromHex(rpc.max_amount),
		max_price_per_unit: feltFromHex(rpc.max_price_per_unit),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').ResourceBoundsMapping} rpc
 * @returns {import('./types.js').ResourceBoundsMappingType}
 */
export function resourceBoundsMappingFromRpc(rpc) {
	return {
		l1_gas: resourceBoundsFromRpc(rpc.l1_gas),
		l2_gas: resourceBoundsFromRpc(rpc.l2_gas),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').TxnWithHash} rpc
 * @returns {import('./types.js').TxnWithHashType}
 */
export function transactionFromRpc(rpc) {
	const base = txnFromRpc(rpc);
	return /** @type {any} */ ({
		...base,
		transaction_hash: feltFromHex(rpc.transaction_hash),
	});
}

/**
 * @param {import('../../jsonrpc/types.js').Txn} rpc
 * @returns {import('./types.js').TxnType}
 */
export function txnFromRpc(rpc) {
	switch (rpc.type) {
		case "INVOKE":
			return invokeFromRpc(
				/** @type {import('../../jsonrpc/types.js').InvokeTxn} */ (rpc),
			);
		case "L1_HANDLER":
			return l1HandlerFromRpc(
				/** @type {import('../../jsonrpc/types.js').L1HandlerTxn} */ (rpc),
			);
		case "DECLARE":
			return declareFromRpc(
				/** @type {import('../../jsonrpc/types.js').DeclareTxn} */ (rpc),
			);
		case "DEPLOY_ACCOUNT":
			return deployAccountFromRpc(
				/** @type {import('../../jsonrpc/types.js').DeployAccountTxn} */ (rpc),
			);
		default:
			throw new Error(
				`Unknown transaction type: ${/** @type {any} */ (rpc).type}`,
			);
	}
}

// ── Invoke ──

/**
 * @param {import('../../jsonrpc/types.js').InvokeTxn} rpc
 * @returns {import('./types.js').InvokeTxnType}
 */
function invokeFromRpc(rpc) {
	if (
		rpc.version === "0x0" ||
		rpc.version === "0x100000000000000000000000000000000"
	) {
		const v0 = /** @type {import('../../jsonrpc/types.js').InvokeTxnV0} */ (
			rpc
		);
		return {
			type: "INVOKE",
			version: v0.version,
			max_fee: feltFromHex(v0.max_fee),
			signature: v0.signature.map(feltFromHex),
			contract_address: addressFromHex(v0.contract_address),
			entry_point_selector: feltFromHex(v0.entry_point_selector),
			calldata: v0.calldata.map(feltFromHex),
		};
	}
	if (
		rpc.version === "0x1" ||
		rpc.version === "0x100000000000000000000000000000001"
	) {
		const v1 = /** @type {import('../../jsonrpc/types.js').InvokeTxnV1} */ (
			rpc
		);
		return {
			type: "INVOKE",
			version: v1.version,
			sender_address: addressFromHex(v1.sender_address),
			calldata: v1.calldata.map(feltFromHex),
			max_fee: feltFromHex(v1.max_fee),
			signature: v1.signature.map(feltFromHex),
			nonce: feltFromHex(v1.nonce),
		};
	}
	// V3
	const v3 = /** @type {import('../../jsonrpc/types.js').InvokeTxnV3} */ (rpc);
	return {
		type: "INVOKE",
		version: v3.version,
		sender_address: addressFromHex(v3.sender_address),
		calldata: v3.calldata.map(feltFromHex),
		signature: v3.signature.map(feltFromHex),
		nonce: feltFromHex(v3.nonce),
		resource_bounds: resourceBoundsMappingFromRpc(v3.resource_bounds),
		tip: feltFromHex(v3.tip),
		paymaster_data: v3.paymaster_data.map(feltFromHex),
		account_deployment_data: v3.account_deployment_data.map(feltFromHex),
		nonce_data_availability_mode: v3.nonce_data_availability_mode,
		fee_data_availability_mode: v3.fee_data_availability_mode,
	};
}

// ── L1 Handler ──

/**
 * @param {import('../../jsonrpc/types.js').L1HandlerTxn} rpc
 * @returns {import('./types.js').L1HandlerTxnType}
 */
function l1HandlerFromRpc(rpc) {
	return {
		type: "L1_HANDLER",
		version: rpc.version,
		nonce: feltFromHex(rpc.nonce),
		contract_address: addressFromHex(rpc.contract_address),
		entry_point_selector: feltFromHex(rpc.entry_point_selector),
		calldata: rpc.calldata.map(feltFromHex),
	};
}

// ── Declare ──

/**
 * @param {import('../../jsonrpc/types.js').DeclareTxn} rpc
 * @returns {import('./types.js').DeclareTxnType}
 */
function declareFromRpc(rpc) {
	if (
		rpc.version === "0x0" ||
		rpc.version === "0x100000000000000000000000000000000"
	) {
		const v0 = /** @type {import('../../jsonrpc/types.js').DeclareTxnV0} */ (
			rpc
		);
		return {
			type: "DECLARE",
			version: v0.version,
			sender_address: addressFromHex(v0.sender_address),
			max_fee: feltFromHex(v0.max_fee),
			signature: v0.signature.map(feltFromHex),
			class_hash: classHashFromHex(v0.class_hash),
		};
	}
	if (
		rpc.version === "0x1" ||
		rpc.version === "0x100000000000000000000000000000001"
	) {
		const v1 = /** @type {import('../../jsonrpc/types.js').DeclareTxnV1} */ (
			rpc
		);
		return {
			type: "DECLARE",
			version: v1.version,
			sender_address: addressFromHex(v1.sender_address),
			max_fee: feltFromHex(v1.max_fee),
			signature: v1.signature.map(feltFromHex),
			nonce: feltFromHex(v1.nonce),
			class_hash: classHashFromHex(v1.class_hash),
		};
	}
	if (
		rpc.version === "0x2" ||
		rpc.version === "0x100000000000000000000000000000002"
	) {
		const v2 = /** @type {import('../../jsonrpc/types.js').DeclareTxnV2} */ (
			rpc
		);
		return {
			type: "DECLARE",
			version: v2.version,
			sender_address: addressFromHex(v2.sender_address),
			compiled_class_hash: classHashFromHex(v2.compiled_class_hash),
			max_fee: feltFromHex(v2.max_fee),
			signature: v2.signature.map(feltFromHex),
			nonce: feltFromHex(v2.nonce),
			class_hash: classHashFromHex(v2.class_hash),
		};
	}
	// V3
	const v3 = /** @type {import('../../jsonrpc/types.js').DeclareTxnV3} */ (rpc);
	return {
		type: "DECLARE",
		version: v3.version,
		sender_address: addressFromHex(v3.sender_address),
		compiled_class_hash: classHashFromHex(v3.compiled_class_hash),
		signature: v3.signature.map(feltFromHex),
		nonce: feltFromHex(v3.nonce),
		class_hash: classHashFromHex(v3.class_hash),
		resource_bounds: resourceBoundsMappingFromRpc(v3.resource_bounds),
		tip: feltFromHex(v3.tip),
		paymaster_data: v3.paymaster_data.map(feltFromHex),
		account_deployment_data: v3.account_deployment_data.map(feltFromHex),
		nonce_data_availability_mode: v3.nonce_data_availability_mode,
		fee_data_availability_mode: v3.fee_data_availability_mode,
	};
}

// ── Deploy Account ──

/**
 * @param {import('../../jsonrpc/types.js').DeployAccountTxn} rpc
 * @returns {import('./types.js').DeployAccountTxnType}
 */
function deployAccountFromRpc(rpc) {
	if (
		rpc.version === "0x1" ||
		rpc.version === "0x100000000000000000000000000000001"
	) {
		const v1 =
			/** @type {import('../../jsonrpc/types.js').DeployAccountTxnV1} */ (rpc);
		return {
			type: "DEPLOY_ACCOUNT",
			version: v1.version,
			max_fee: feltFromHex(v1.max_fee),
			signature: v1.signature.map(feltFromHex),
			nonce: feltFromHex(v1.nonce),
			contract_address_salt: feltFromHex(v1.contract_address_salt),
			constructor_calldata: v1.constructor_calldata.map(feltFromHex),
			class_hash: classHashFromHex(v1.class_hash),
		};
	}
	// V3
	const v3 =
		/** @type {import('../../jsonrpc/types.js').DeployAccountTxnV3} */ (rpc);
	return {
		type: "DEPLOY_ACCOUNT",
		version: v3.version,
		signature: v3.signature.map(feltFromHex),
		nonce: feltFromHex(v3.nonce),
		contract_address_salt: feltFromHex(v3.contract_address_salt),
		constructor_calldata: v3.constructor_calldata.map(feltFromHex),
		class_hash: classHashFromHex(v3.class_hash),
		resource_bounds: resourceBoundsMappingFromRpc(v3.resource_bounds),
		tip: feltFromHex(v3.tip),
		paymaster_data: v3.paymaster_data.map(feltFromHex),
		nonce_data_availability_mode: v3.nonce_data_availability_mode,
		fee_data_availability_mode: v3.fee_data_availability_mode,
	};
}
