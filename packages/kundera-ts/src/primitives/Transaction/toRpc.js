/**
 * @param {import('./types.js').ResourceBoundsType} rb
 * @returns {import('../../jsonrpc/types.js').ResourceBounds}
 */
export function resourceBoundsToRpc(rb) {
	return {
		max_amount: rb.max_amount.toHex(),
		max_price_per_unit: rb.max_price_per_unit.toHex(),
	};
}

/**
 * @param {import('./types.js').ResourceBoundsMappingType} rbm
 * @returns {import('../../jsonrpc/types.js').ResourceBoundsMapping}
 */
export function resourceBoundsMappingToRpc(rbm) {
	return {
		l1_gas: resourceBoundsToRpc(rbm.l1_gas),
		l2_gas: resourceBoundsToRpc(rbm.l2_gas),
	};
}

/**
 * @param {import('../Felt252/types.js').Felt252Type} f
 * @returns {string}
 */
function feltToHex(f) {
	return f.toHex();
}

/**
 * @param {import('../Felt252/types.js').Felt252Type[]} arr
 * @returns {string[]}
 */
function feltsToHex(arr) {
	return arr.map((f) => f.toHex());
}

/**
 * @param {{ toHex(): string }} addr
 * @returns {string}
 */
function addressToHex(addr) {
	return addr.toHex();
}

/**
 * @param {{ toHex(): string }} hash
 * @returns {string}
 */
function classHashToHex(hash) {
	return hash.toHex();
}

/**
 * @param {import('./types.js').TxnWithHashType} rich
 * @returns {import('../../jsonrpc/types.js').TxnWithHash}
 */
export function transactionToRpc(rich) {
	const base = txnToRpc(rich);
	return /** @type {any} */ ({
		...base,
		transaction_hash: feltToHex(rich.transaction_hash),
	});
}

/**
 * @param {import('./types.js').TxnType} rich
 * @returns {import('../../jsonrpc/types.js').Txn}
 */
export function txnToRpc(rich) {
	switch (rich.type) {
		case "INVOKE":
			return invokeToRpc(
				/** @type {import('./types.js').InvokeTxnType} */ (rich),
			);
		case "L1_HANDLER":
			return l1HandlerToRpc(
				/** @type {import('./types.js').L1HandlerTxnType} */ (rich),
			);
		case "DECLARE":
			return declareToRpc(
				/** @type {import('./types.js').DeclareTxnType} */ (rich),
			);
		case "DEPLOY_ACCOUNT":
			return deployAccountToRpc(
				/** @type {import('./types.js').DeployAccountTxnType} */ (rich),
			);
		default:
			throw new Error(
				`Unknown transaction type: ${/** @type {any} */ (rich).type}`,
			);
	}
}

// ── Invoke ──

/**
 * @param {import('./types.js').InvokeTxnType} rich
 * @returns {import('../../jsonrpc/types.js').InvokeTxn}
 */
function invokeToRpc(rich) {
	if (
		rich.version === "0x0" ||
		rich.version === "0x100000000000000000000000000000000"
	) {
		const v0 = /** @type {import('./types.js').InvokeTxnV0Type} */ (rich);
		return {
			type: "INVOKE",
			version: v0.version,
			max_fee: feltToHex(v0.max_fee),
			signature: feltsToHex(v0.signature),
			contract_address: addressToHex(v0.contract_address),
			entry_point_selector: feltToHex(v0.entry_point_selector),
			calldata: feltsToHex(v0.calldata),
		};
	}
	if (
		rich.version === "0x1" ||
		rich.version === "0x100000000000000000000000000000001"
	) {
		const v1 = /** @type {import('./types.js').InvokeTxnV1Type} */ (rich);
		return {
			type: "INVOKE",
			version: v1.version,
			sender_address: addressToHex(v1.sender_address),
			calldata: feltsToHex(v1.calldata),
			max_fee: feltToHex(v1.max_fee),
			signature: feltsToHex(v1.signature),
			nonce: feltToHex(v1.nonce),
		};
	}
	const v3 = /** @type {import('./types.js').InvokeTxnV3Type} */ (rich);
	return {
		type: "INVOKE",
		version: v3.version,
		sender_address: addressToHex(v3.sender_address),
		calldata: feltsToHex(v3.calldata),
		signature: feltsToHex(v3.signature),
		nonce: feltToHex(v3.nonce),
		resource_bounds: resourceBoundsMappingToRpc(v3.resource_bounds),
		tip: feltToHex(v3.tip),
		paymaster_data: feltsToHex(v3.paymaster_data),
		account_deployment_data: feltsToHex(v3.account_deployment_data),
		nonce_data_availability_mode: v3.nonce_data_availability_mode,
		fee_data_availability_mode: v3.fee_data_availability_mode,
	};
}

// ── L1 Handler ──

/**
 * @param {import('./types.js').L1HandlerTxnType} rich
 * @returns {import('../../jsonrpc/types.js').L1HandlerTxn}
 */
function l1HandlerToRpc(rich) {
	return {
		type: "L1_HANDLER",
		version: rich.version,
		nonce: feltToHex(rich.nonce),
		contract_address: addressToHex(rich.contract_address),
		entry_point_selector: feltToHex(rich.entry_point_selector),
		calldata: feltsToHex(rich.calldata),
	};
}

// ── Declare ──

/**
 * @param {import('./types.js').DeclareTxnType} rich
 * @returns {import('../../jsonrpc/types.js').DeclareTxn}
 */
function declareToRpc(rich) {
	if (
		rich.version === "0x0" ||
		rich.version === "0x100000000000000000000000000000000"
	) {
		const v0 = /** @type {import('./types.js').DeclareTxnV0Type} */ (rich);
		return {
			type: "DECLARE",
			version: v0.version,
			sender_address: addressToHex(v0.sender_address),
			max_fee: feltToHex(v0.max_fee),
			signature: feltsToHex(v0.signature),
			class_hash: classHashToHex(v0.class_hash),
		};
	}
	if (
		rich.version === "0x1" ||
		rich.version === "0x100000000000000000000000000000001"
	) {
		const v1 = /** @type {import('./types.js').DeclareTxnV1Type} */ (rich);
		return {
			type: "DECLARE",
			version: v1.version,
			sender_address: addressToHex(v1.sender_address),
			max_fee: feltToHex(v1.max_fee),
			signature: feltsToHex(v1.signature),
			nonce: feltToHex(v1.nonce),
			class_hash: classHashToHex(v1.class_hash),
		};
	}
	if (
		rich.version === "0x2" ||
		rich.version === "0x100000000000000000000000000000002"
	) {
		const v2 = /** @type {import('./types.js').DeclareTxnV2Type} */ (rich);
		return {
			type: "DECLARE",
			version: v2.version,
			sender_address: addressToHex(v2.sender_address),
			compiled_class_hash: classHashToHex(v2.compiled_class_hash),
			max_fee: feltToHex(v2.max_fee),
			signature: feltsToHex(v2.signature),
			nonce: feltToHex(v2.nonce),
			class_hash: classHashToHex(v2.class_hash),
		};
	}
	const v3 = /** @type {import('./types.js').DeclareTxnV3Type} */ (rich);
	return {
		type: "DECLARE",
		version: v3.version,
		sender_address: addressToHex(v3.sender_address),
		compiled_class_hash: classHashToHex(v3.compiled_class_hash),
		signature: feltsToHex(v3.signature),
		nonce: feltToHex(v3.nonce),
		class_hash: classHashToHex(v3.class_hash),
		resource_bounds: resourceBoundsMappingToRpc(v3.resource_bounds),
		tip: feltToHex(v3.tip),
		paymaster_data: feltsToHex(v3.paymaster_data),
		account_deployment_data: feltsToHex(v3.account_deployment_data),
		nonce_data_availability_mode: v3.nonce_data_availability_mode,
		fee_data_availability_mode: v3.fee_data_availability_mode,
	};
}

// ── Deploy Account ──

/**
 * @param {import('./types.js').DeployAccountTxnType} rich
 * @returns {import('../../jsonrpc/types.js').DeployAccountTxn}
 */
function deployAccountToRpc(rich) {
	if (
		rich.version === "0x1" ||
		rich.version === "0x100000000000000000000000000000001"
	) {
		const v1 = /** @type {import('./types.js').DeployAccountTxnV1Type} */ (
			rich
		);
		return {
			type: "DEPLOY_ACCOUNT",
			version: v1.version,
			max_fee: feltToHex(v1.max_fee),
			signature: feltsToHex(v1.signature),
			nonce: feltToHex(v1.nonce),
			contract_address_salt: feltToHex(v1.contract_address_salt),
			constructor_calldata: feltsToHex(v1.constructor_calldata),
			class_hash: classHashToHex(v1.class_hash),
		};
	}
	const v3 = /** @type {import('./types.js').DeployAccountTxnV3Type} */ (rich);
	return {
		type: "DEPLOY_ACCOUNT",
		version: v3.version,
		signature: feltsToHex(v3.signature),
		nonce: feltToHex(v3.nonce),
		contract_address_salt: feltToHex(v3.contract_address_salt),
		constructor_calldata: feltsToHex(v3.constructor_calldata),
		class_hash: classHashToHex(v3.class_hash),
		resource_bounds: resourceBoundsMappingToRpc(v3.resource_bounds),
		tip: feltToHex(v3.tip),
		paymaster_data: feltsToHex(v3.paymaster_data),
		nonce_data_availability_mode: v3.nonce_data_availability_mode,
		fee_data_availability_mode: v3.fee_data_availability_mode,
	};
}
