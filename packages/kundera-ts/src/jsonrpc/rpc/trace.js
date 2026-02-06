import {
  hexToFelt,
  hexToFelts,
  hexToAddress,
  hexToClassHash,
  feltToHex,
  feltsToHex,
  addressToHex,
  classHashToHex,
} from './helpers.js';
import { stateDiffFromRpc, stateDiffToRpc } from './stateUpdate.js';

/**
 * @param {import('../types.js').OrderedEvent} rpc
 * @returns {import('../rich.js').RichOrderedEvent}
 */
export function orderedEventFromRpc(rpc) {
  return {
    order: rpc.order,
    keys: hexToFelts(rpc.keys),
    data: hexToFelts(rpc.data),
  };
}

/**
 * @param {import('../rich.js').RichOrderedEvent} rich
 * @returns {import('../types.js').OrderedEvent}
 */
export function orderedEventToRpc(rich) {
  return {
    order: rich.order,
    keys: feltsToHex(rich.keys),
    data: feltsToHex(rich.data),
  };
}

/**
 * @param {import('../types.js').OrderedMessage} rpc
 * @returns {import('../rich.js').RichOrderedMessage}
 */
export function orderedMessageFromRpc(rpc) {
  return {
    order: rpc.order,
    to_address: hexToFelt(rpc.to_address),
    payload: hexToFelts(rpc.payload),
  };
}

/**
 * @param {import('../rich.js').RichOrderedMessage} rich
 * @returns {import('../types.js').OrderedMessage}
 */
export function orderedMessageToRpc(rich) {
  return {
    order: rich.order,
    to_address: feltToHex(rich.to_address),
    payload: feltsToHex(rich.payload),
  };
}

/**
 * @param {import('../types.js').FunctionInvocation} rpc
 * @returns {import('../rich.js').RichFunctionInvocation}
 */
export function functionInvocationFromRpc(rpc) {
  return {
    contract_address: hexToAddress(rpc.contract_address),
    entry_point_selector: hexToFelt(rpc.entry_point_selector),
    calldata: hexToFelts(rpc.calldata),
    caller_address: hexToAddress(rpc.caller_address),
    class_hash: hexToClassHash(rpc.class_hash),
    entry_point_type: rpc.entry_point_type,
    call_type: rpc.call_type,
    result: hexToFelts(rpc.result),
    calls: rpc.calls.map(functionInvocationFromRpc),
    events: rpc.events.map(orderedEventFromRpc),
    messages: rpc.messages.map(orderedMessageFromRpc),
    execution_resources: rpc.execution_resources,
  };
}

/**
 * @param {import('../rich.js').RichFunctionInvocation} rich
 * @returns {import('../types.js').FunctionInvocation}
 */
export function functionInvocationToRpc(rich) {
  return {
    contract_address: addressToHex(rich.contract_address),
    entry_point_selector: feltToHex(rich.entry_point_selector),
    calldata: feltsToHex(rich.calldata),
    caller_address: addressToHex(rich.caller_address),
    class_hash: classHashToHex(rich.class_hash),
    entry_point_type: rich.entry_point_type,
    call_type: rich.call_type,
    result: feltsToHex(rich.result),
    calls: rich.calls.map(functionInvocationToRpc),
    events: rich.events.map(orderedEventToRpc),
    messages: rich.messages.map(orderedMessageToRpc),
    execution_resources: rich.execution_resources,
  };
}

/**
 * @param {import('../types.js').RevertibleFunctionInvocation} rpc
 * @returns {import('../rich.js').RichRevertibleFunctionInvocation}
 */
export function revertibleFunctionInvocationFromRpc(rpc) {
  if ('revert_reason' in rpc) {
    return { revert_reason: rpc.revert_reason };
  }
  return functionInvocationFromRpc(rpc);
}

/**
 * @param {import('../rich.js').RichRevertibleFunctionInvocation} rich
 * @returns {import('../types.js').RevertibleFunctionInvocation}
 */
export function revertibleFunctionInvocationToRpc(rich) {
  if ('revert_reason' in rich) {
    return { revert_reason: rich.revert_reason };
  }
  return functionInvocationToRpc(rich);
}

/**
 * @param {import('../types.js').TransactionTrace} rpc
 * @returns {import('../rich.js').RichTransactionTrace}
 */
export function transactionTraceFromRpc(rpc) {
  switch (rpc.type) {
    case 'INVOKE': {
      const t = /** @type {import('../types.js').InvokeTxnTrace} */ (rpc);
      return {
        type: 'INVOKE',
        ...(t.validate_invocation
          ? { validate_invocation: functionInvocationFromRpc(t.validate_invocation) }
          : {}),
        execute_invocation: revertibleFunctionInvocationFromRpc(t.execute_invocation),
        ...(t.fee_transfer_invocation
          ? { fee_transfer_invocation: functionInvocationFromRpc(t.fee_transfer_invocation) }
          : {}),
        ...(t.state_diff ? { state_diff: stateDiffFromRpc(t.state_diff) } : {}),
        execution_resources: t.execution_resources,
      };
    }
    case 'DECLARE': {
      const t = /** @type {import('../types.js').DeclareTxnTrace} */ (rpc);
      return {
        type: 'DECLARE',
        ...(t.validate_invocation
          ? { validate_invocation: functionInvocationFromRpc(t.validate_invocation) }
          : {}),
        ...(t.fee_transfer_invocation
          ? { fee_transfer_invocation: functionInvocationFromRpc(t.fee_transfer_invocation) }
          : {}),
        ...(t.state_diff ? { state_diff: stateDiffFromRpc(t.state_diff) } : {}),
        execution_resources: t.execution_resources,
      };
    }
    case 'DEPLOY_ACCOUNT': {
      const t = /** @type {import('../types.js').DeployAccountTxnTrace} */ (rpc);
      return {
        type: 'DEPLOY_ACCOUNT',
        ...(t.validate_invocation
          ? { validate_invocation: functionInvocationFromRpc(t.validate_invocation) }
          : {}),
        constructor_invocation: functionInvocationFromRpc(t.constructor_invocation),
        ...(t.fee_transfer_invocation
          ? { fee_transfer_invocation: functionInvocationFromRpc(t.fee_transfer_invocation) }
          : {}),
        ...(t.state_diff ? { state_diff: stateDiffFromRpc(t.state_diff) } : {}),
        execution_resources: t.execution_resources,
      };
    }
    case 'L1_HANDLER': {
      const t = /** @type {import('../types.js').L1HandlerTxnTrace} */ (rpc);
      return {
        type: 'L1_HANDLER',
        function_invocation: revertibleFunctionInvocationFromRpc(t.function_invocation),
        ...(t.state_diff ? { state_diff: stateDiffFromRpc(t.state_diff) } : {}),
        execution_resources: t.execution_resources,
      };
    }
    default:
      throw new Error(`Unknown trace type: ${/** @type {any} */ (rpc).type}`);
  }
}

/**
 * @param {import('../rich.js').RichTransactionTrace} rich
 * @returns {import('../types.js').TransactionTrace}
 */
export function transactionTraceToRpc(rich) {
  switch (rich.type) {
    case 'INVOKE': {
      const t = /** @type {import('../rich.js').RichInvokeTxnTrace} */ (rich);
      return /** @type {any} */ ({
        type: 'INVOKE',
        ...(t.validate_invocation
          ? { validate_invocation: functionInvocationToRpc(t.validate_invocation) }
          : {}),
        execute_invocation: revertibleFunctionInvocationToRpc(t.execute_invocation),
        ...(t.fee_transfer_invocation
          ? { fee_transfer_invocation: functionInvocationToRpc(t.fee_transfer_invocation) }
          : {}),
        ...(t.state_diff ? { state_diff: stateDiffToRpc(t.state_diff) } : {}),
        execution_resources: t.execution_resources,
      });
    }
    case 'DECLARE': {
      const t = /** @type {import('../rich.js').RichDeclareTxnTrace} */ (rich);
      return /** @type {any} */ ({
        type: 'DECLARE',
        ...(t.validate_invocation
          ? { validate_invocation: functionInvocationToRpc(t.validate_invocation) }
          : {}),
        ...(t.fee_transfer_invocation
          ? { fee_transfer_invocation: functionInvocationToRpc(t.fee_transfer_invocation) }
          : {}),
        ...(t.state_diff ? { state_diff: stateDiffToRpc(t.state_diff) } : {}),
        execution_resources: t.execution_resources,
      });
    }
    case 'DEPLOY_ACCOUNT': {
      const t = /** @type {import('../rich.js').RichDeployAccountTxnTrace} */ (rich);
      return /** @type {any} */ ({
        type: 'DEPLOY_ACCOUNT',
        ...(t.validate_invocation
          ? { validate_invocation: functionInvocationToRpc(t.validate_invocation) }
          : {}),
        constructor_invocation: functionInvocationToRpc(t.constructor_invocation),
        ...(t.fee_transfer_invocation
          ? { fee_transfer_invocation: functionInvocationToRpc(t.fee_transfer_invocation) }
          : {}),
        ...(t.state_diff ? { state_diff: stateDiffToRpc(t.state_diff) } : {}),
        execution_resources: t.execution_resources,
      });
    }
    case 'L1_HANDLER': {
      const t = /** @type {import('../rich.js').RichL1HandlerTxnTrace} */ (rich);
      return /** @type {any} */ ({
        type: 'L1_HANDLER',
        function_invocation: revertibleFunctionInvocationToRpc(t.function_invocation),
        ...(t.state_diff ? { state_diff: stateDiffToRpc(t.state_diff) } : {}),
        execution_resources: t.execution_resources,
      });
    }
    default:
      throw new Error(`Unknown trace type: ${/** @type {any} */ (rich).type}`);
  }
}
