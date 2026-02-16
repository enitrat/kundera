import { fromHex as addressFromHex } from "../ContractAddress/fromHex.js";
import { eventFromRpc } from "../Event/fromRpc.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";

/**
 * @param {import('../../jsonrpc/types.js').FeePayment} rpc
 * @returns {import('./types.js').FeePaymentType}
 */
export function feePaymentFromRpc(rpc) {
	return {
		amount: feltFromHex(rpc.amount),
		unit: rpc.unit,
	};
}

/**
 * @param {import('../../jsonrpc/types.js').MsgToL1} rpc
 * @returns {import('./types.js').MsgToL1Type}
 */
export function msgToL1FromRpc(rpc) {
	return {
		from_address: addressFromHex(rpc.from_address),
		to_address: feltFromHex(rpc.to_address),
		payload: rpc.payload.map(feltFromHex),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').TxnReceipt} rpc
 * @returns {import('./types.js').TxnReceiptType}
 */
export function receiptFromRpc(rpc) {
	const common = {
		transaction_hash: feltFromHex(rpc.transaction_hash),
		actual_fee: feePaymentFromRpc(rpc.actual_fee),
		finality_status: rpc.finality_status,
		messages_sent: rpc.messages_sent.map(msgToL1FromRpc),
		events: rpc.events.map(eventFromRpc),
		execution_resources: rpc.execution_resources,
		execution_status: rpc.execution_status,
		...(rpc.revert_reason !== undefined
			? { revert_reason: rpc.revert_reason }
			: {}),
	};

	switch (rpc.type) {
		case "INVOKE":
			return { ...common, type: "INVOKE" };
		case "L1_HANDLER":
			return {
				...common,
				type: "L1_HANDLER",
				message_hash:
					/** @type {import('../../jsonrpc/types.js').L1HandlerTxnReceipt} */ (
						rpc
					).message_hash,
			};
		case "DECLARE":
			return { ...common, type: "DECLARE" };
		case "DEPLOY_ACCOUNT":
			return {
				...common,
				type: "DEPLOY_ACCOUNT",
				contract_address: addressFromHex(
					/** @type {import('../../jsonrpc/types.js').DeployAccountTxnReceipt} */ (
						rpc
					).contract_address,
				),
			};
		default:
			throw new Error(`Unknown receipt type: ${/** @type {any} */ (rpc).type}`);
	}
}

/**
 * @param {import('../../jsonrpc/types.js').TxnReceiptWithBlockInfo} rpc
 * @returns {import('./types.js').TxnReceiptWithBlockInfoType}
 */
export function receiptWithBlockInfoFromRpc(rpc) {
	const base = receiptFromRpc(rpc);
	return /** @type {any} */ ({
		...base,
		...(rpc.block_hash !== undefined
			? { block_hash: feltFromHex(rpc.block_hash) }
			: {}),
		...(rpc.block_number !== undefined
			? { block_number: rpc.block_number }
			: {}),
	});
}
