import { stateDiffToRpc } from "../StateUpdate/toRpc.js";

/**
 * @param {import('./types.js').OrderedEventType} event
 * @returns {import('../../jsonrpc/types.js').OrderedEvent}
 */
export function orderedEventToRpc(event) {
	return {
		order: event.order,
		keys: event.keys.map((k) => k.toHex()),
		data: event.data.map((d) => d.toHex()),
	};
}

/**
 * @param {import('./types.js').OrderedMessageType} msg
 * @returns {import('../../jsonrpc/types.js').OrderedMessage}
 */
export function orderedMessageToRpc(msg) {
	return {
		order: msg.order,
		to_address: msg.to_address.toHex(),
		payload: msg.payload.map((p) => p.toHex()),
	};
}

/**
 * @param {import('./types.js').FunctionInvocationType} inv
 * @returns {import('../../jsonrpc/types.js').FunctionInvocation}
 */
export function functionInvocationToRpc(inv) {
	return {
		contract_address: inv.contract_address.toHex(),
		entry_point_selector: inv.entry_point_selector.toHex(),
		calldata: inv.calldata.map((c) => c.toHex()),
		caller_address: inv.caller_address.toHex(),
		class_hash: inv.class_hash.toHex(),
		entry_point_type: inv.entry_point_type,
		call_type: inv.call_type,
		result: inv.result.map((r) => r.toHex()),
		calls: inv.calls.map(functionInvocationToRpc),
		events: inv.events.map(orderedEventToRpc),
		messages: inv.messages.map(orderedMessageToRpc),
		execution_resources: inv.execution_resources,
	};
}

/**
 * @param {import('./types.js').RevertibleFunctionInvocationType} inv
 * @returns {import('../../jsonrpc/types.js').RevertibleFunctionInvocation}
 */
export function revertibleFunctionInvocationToRpc(inv) {
	if ("revert_reason" in inv) {
		return { revert_reason: inv.revert_reason };
	}
	return functionInvocationToRpc(inv);
}

/**
 * @param {import('./types.js').TransactionTraceType} rich
 * @returns {import('../../jsonrpc/types.js').TransactionTrace}
 */
export function transactionTraceToRpc(rich) {
	switch (rich.type) {
		case "INVOKE": {
			const t = /** @type {import('./types.js').InvokeTxnTraceType} */ (rich);
			return /** @type {any} */ ({
				type: "INVOKE",
				...(t.validate_invocation
					? {
							validate_invocation: functionInvocationToRpc(
								t.validate_invocation,
							),
						}
					: {}),
				execute_invocation: revertibleFunctionInvocationToRpc(
					t.execute_invocation,
				),
				...(t.fee_transfer_invocation
					? {
							fee_transfer_invocation: functionInvocationToRpc(
								t.fee_transfer_invocation,
							),
						}
					: {}),
				...(t.state_diff ? { state_diff: stateDiffToRpc(t.state_diff) } : {}),
				execution_resources: t.execution_resources,
			});
		}
		case "DECLARE": {
			const t = /** @type {import('./types.js').DeclareTxnTraceType} */ (rich);
			return /** @type {any} */ ({
				type: "DECLARE",
				...(t.validate_invocation
					? {
							validate_invocation: functionInvocationToRpc(
								t.validate_invocation,
							),
						}
					: {}),
				...(t.fee_transfer_invocation
					? {
							fee_transfer_invocation: functionInvocationToRpc(
								t.fee_transfer_invocation,
							),
						}
					: {}),
				...(t.state_diff ? { state_diff: stateDiffToRpc(t.state_diff) } : {}),
				execution_resources: t.execution_resources,
			});
		}
		case "DEPLOY_ACCOUNT": {
			const t = /** @type {import('./types.js').DeployAccountTxnTraceType} */ (
				rich
			);
			return /** @type {any} */ ({
				type: "DEPLOY_ACCOUNT",
				...(t.validate_invocation
					? {
							validate_invocation: functionInvocationToRpc(
								t.validate_invocation,
							),
						}
					: {}),
				constructor_invocation: functionInvocationToRpc(
					t.constructor_invocation,
				),
				...(t.fee_transfer_invocation
					? {
							fee_transfer_invocation: functionInvocationToRpc(
								t.fee_transfer_invocation,
							),
						}
					: {}),
				...(t.state_diff ? { state_diff: stateDiffToRpc(t.state_diff) } : {}),
				execution_resources: t.execution_resources,
			});
		}
		case "L1_HANDLER": {
			const t = /** @type {import('./types.js').L1HandlerTxnTraceType} */ (
				rich
			);
			return /** @type {any} */ ({
				type: "L1_HANDLER",
				function_invocation: revertibleFunctionInvocationToRpc(
					t.function_invocation,
				),
				...(t.state_diff ? { state_diff: stateDiffToRpc(t.state_diff) } : {}),
				execution_resources: t.execution_resources,
			});
		}
		default:
			throw new Error(`Unknown trace type: ${/** @type {any} */ (rich).type}`);
	}
}
