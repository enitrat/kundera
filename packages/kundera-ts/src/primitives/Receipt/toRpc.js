import { eventToRpc } from "../Event/toRpc.js";

/**
 * @param {import('../Felt252/types.js').Felt252Type} f
 * @returns {string}
 */
function feltToHex(f) {
	return f.toHex();
}

/**
 * @param {{ toHex(): string }} addr
 * @returns {string}
 */
function addressToHex(addr) {
	return addr.toHex();
}

/**
 * @param {import('./types.js').FeePaymentType} rich
 * @returns {import('../../jsonrpc/types.js').FeePayment}
 */
export function feePaymentToRpc(rich) {
	return {
		amount: feltToHex(rich.amount),
		unit: rich.unit,
	};
}

/**
 * @param {import('./types.js').MsgToL1Type} rich
 * @returns {import('../../jsonrpc/types.js').MsgToL1}
 */
export function msgToL1ToRpc(rich) {
	return {
		from_address: addressToHex(rich.from_address),
		to_address: feltToHex(rich.to_address),
		payload: rich.payload.map((f) => f.toHex()),
	};
}

/**
 * @param {import('./types.js').TxnReceiptType} rich
 * @returns {import('../../jsonrpc/types.js').TxnReceipt}
 */
export function receiptToRpc(rich) {
	const common = {
		transaction_hash: feltToHex(rich.transaction_hash),
		actual_fee: feePaymentToRpc(rich.actual_fee),
		finality_status: rich.finality_status,
		messages_sent: rich.messages_sent.map(msgToL1ToRpc),
		events: rich.events.map(eventToRpc),
		execution_resources: rich.execution_resources,
		execution_status: rich.execution_status,
		...(rich.revert_reason !== undefined
			? { revert_reason: rich.revert_reason }
			: {}),
	};

	switch (rich.type) {
		case "INVOKE":
			return /** @type {any} */ ({ ...common, type: "INVOKE" });
		case "L1_HANDLER":
			return /** @type {any} */ ({
				...common,
				type: "L1_HANDLER",
				message_hash:
					/** @type {import('./types.js').L1HandlerTxnReceiptType} */ (rich)
						.message_hash,
			});
		case "DECLARE":
			return /** @type {any} */ ({ ...common, type: "DECLARE" });
		case "DEPLOY_ACCOUNT":
			return /** @type {any} */ ({
				...common,
				type: "DEPLOY_ACCOUNT",
				contract_address: addressToHex(
					/** @type {import('./types.js').DeployAccountTxnReceiptType} */ (rich)
						.contract_address,
				),
			});
		default:
			throw new Error(
				`Unknown receipt type: ${/** @type {any} */ (rich).type}`,
			);
	}
}

/**
 * @param {import('./types.js').TxnReceiptWithBlockInfoType} rich
 * @returns {import('../../jsonrpc/types.js').TxnReceiptWithBlockInfo}
 */
export function receiptWithBlockInfoToRpc(rich) {
	const base = receiptToRpc(rich);
	return /** @type {any} */ ({
		...base,
		...(rich.block_hash !== undefined
			? { block_hash: feltToHex(rich.block_hash) }
			: {}),
		...(rich.block_number !== undefined
			? { block_number: rich.block_number }
			: {}),
	});
}
