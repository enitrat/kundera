import { fromHex as classHashFromHex } from "../ClassHash/fromHex.js";
import { fromHex as addressFromHex } from "../ContractAddress/fromHex.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import { stateDiffFromRpc } from "../StateUpdate/fromRpc.js";

/**
 * @param {import('../../jsonrpc/types.js').OrderedEvent} rpc
 * @returns {import('./types.js').OrderedEventType}
 */
export function orderedEventFromRpc(rpc) {
	return {
		order: rpc.order,
		keys: rpc.keys.map(feltFromHex),
		data: rpc.data.map(feltFromHex),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').OrderedMessage} rpc
 * @returns {import('./types.js').OrderedMessageType}
 */
export function orderedMessageFromRpc(rpc) {
	return {
		order: rpc.order,
		to_address: feltFromHex(rpc.to_address),
		payload: rpc.payload.map(feltFromHex),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').FunctionInvocation} rpc
 * @returns {import('./types.js').FunctionInvocationType}
 */
export function functionInvocationFromRpc(rpc) {
	return {
		contract_address: addressFromHex(rpc.contract_address),
		entry_point_selector: feltFromHex(rpc.entry_point_selector),
		calldata: rpc.calldata.map(feltFromHex),
		caller_address: addressFromHex(rpc.caller_address),
		class_hash: classHashFromHex(rpc.class_hash),
		entry_point_type: rpc.entry_point_type,
		call_type: rpc.call_type,
		result: rpc.result.map(feltFromHex),
		calls: rpc.calls.map(functionInvocationFromRpc),
		events: rpc.events.map(orderedEventFromRpc),
		messages: rpc.messages.map(orderedMessageFromRpc),
		execution_resources: rpc.execution_resources,
	};
}

/**
 * @param {import('../../jsonrpc/types.js').RevertibleFunctionInvocation} rpc
 * @returns {import('./types.js').RevertibleFunctionInvocationType}
 */
export function revertibleFunctionInvocationFromRpc(rpc) {
	if ("revert_reason" in rpc) {
		return { revert_reason: rpc.revert_reason };
	}
	return functionInvocationFromRpc(rpc);
}

/**
 * @param {import('../../jsonrpc/types.js').TransactionTrace} rpc
 * @returns {import('./types.js').TransactionTraceType}
 */
export function transactionTraceFromRpc(rpc) {
	switch (rpc.type) {
		case "INVOKE": {
			const t = /** @type {import('../../jsonrpc/types.js').InvokeTxnTrace} */ (
				rpc
			);
			return {
				type: "INVOKE",
				...(t.validate_invocation
					? {
							validate_invocation: functionInvocationFromRpc(
								t.validate_invocation,
							),
						}
					: {}),
				execute_invocation: revertibleFunctionInvocationFromRpc(
					t.execute_invocation,
				),
				...(t.fee_transfer_invocation
					? {
							fee_transfer_invocation: functionInvocationFromRpc(
								t.fee_transfer_invocation,
							),
						}
					: {}),
				...(t.state_diff ? { state_diff: stateDiffFromRpc(t.state_diff) } : {}),
				execution_resources: t.execution_resources,
			};
		}
		case "DECLARE": {
			const t =
				/** @type {import('../../jsonrpc/types.js').DeclareTxnTrace} */ (rpc);
			return {
				type: "DECLARE",
				...(t.validate_invocation
					? {
							validate_invocation: functionInvocationFromRpc(
								t.validate_invocation,
							),
						}
					: {}),
				...(t.fee_transfer_invocation
					? {
							fee_transfer_invocation: functionInvocationFromRpc(
								t.fee_transfer_invocation,
							),
						}
					: {}),
				...(t.state_diff ? { state_diff: stateDiffFromRpc(t.state_diff) } : {}),
				execution_resources: t.execution_resources,
			};
		}
		case "DEPLOY_ACCOUNT": {
			const t =
				/** @type {import('../../jsonrpc/types.js').DeployAccountTxnTrace} */ (
					rpc
				);
			return {
				type: "DEPLOY_ACCOUNT",
				...(t.validate_invocation
					? {
							validate_invocation: functionInvocationFromRpc(
								t.validate_invocation,
							),
						}
					: {}),
				constructor_invocation: functionInvocationFromRpc(
					t.constructor_invocation,
				),
				...(t.fee_transfer_invocation
					? {
							fee_transfer_invocation: functionInvocationFromRpc(
								t.fee_transfer_invocation,
							),
						}
					: {}),
				...(t.state_diff ? { state_diff: stateDiffFromRpc(t.state_diff) } : {}),
				execution_resources: t.execution_resources,
			};
		}
		case "L1_HANDLER": {
			const t =
				/** @type {import('../../jsonrpc/types.js').L1HandlerTxnTrace} */ (rpc);
			return {
				type: "L1_HANDLER",
				function_invocation: revertibleFunctionInvocationFromRpc(
					t.function_invocation,
				),
				...(t.state_diff ? { state_diff: stateDiffFromRpc(t.state_diff) } : {}),
				execution_resources: t.execution_resources,
			};
		}
		default:
			throw new Error(`Unknown trace type: ${/** @type {any} */ (rpc).type}`);
	}
}
