import {
  hexToFelt,
  hexToFelts,
  hexToAddress,
  feltToHex,
  feltsToHex,
  addressToHex,
  feePaymentFromRpc,
  feePaymentToRpc,
} from './helpers.js';
import { eventFromRpc, eventToRpc } from './event.js';

/**
 * @param {import('../types.js').MsgToL1} rpc
 * @returns {import('../rich.js').RichMsgToL1}
 */
export function msgToL1FromRpc(rpc) {
  return {
    from_address: hexToAddress(rpc.from_address),
    to_address: hexToFelt(rpc.to_address),
    payload: hexToFelts(rpc.payload),
  };
}

/**
 * @param {import('../rich.js').RichMsgToL1} rich
 * @returns {import('../types.js').MsgToL1}
 */
export function msgToL1ToRpc(rich) {
  return {
    from_address: addressToHex(rich.from_address),
    to_address: feltToHex(rich.to_address),
    payload: feltsToHex(rich.payload),
  };
}

/**
 * @param {import('../types.js').TxnReceipt} rpc
 * @returns {import('../rich.js').RichTxnReceipt}
 */
export function receiptFromRpc(rpc) {
  const common = {
    transaction_hash: hexToFelt(rpc.transaction_hash),
    actual_fee: feePaymentFromRpc(rpc.actual_fee),
    finality_status: rpc.finality_status,
    messages_sent: rpc.messages_sent.map(msgToL1FromRpc),
    events: rpc.events.map(eventFromRpc),
    execution_resources: rpc.execution_resources,
    execution_status: rpc.execution_status,
    ...(rpc.revert_reason !== undefined ? { revert_reason: rpc.revert_reason } : {}),
  };

  switch (rpc.type) {
    case 'INVOKE':
      return { ...common, type: 'INVOKE' };
    case 'L1_HANDLER':
      return {
        ...common,
        type: 'L1_HANDLER',
        message_hash: /** @type {import('../types.js').L1HandlerTxnReceipt} */ (rpc).message_hash,
      };
    case 'DECLARE':
      return { ...common, type: 'DECLARE' };
    case 'DEPLOY_ACCOUNT':
      return {
        ...common,
        type: 'DEPLOY_ACCOUNT',
        contract_address: hexToAddress(
          /** @type {import('../types.js').DeployAccountTxnReceipt} */ (rpc).contract_address,
        ),
      };
    default:
      throw new Error(`Unknown receipt type: ${/** @type {any} */ (rpc).type}`);
  }
}

/**
 * @param {import('../rich.js').RichTxnReceipt} rich
 * @returns {import('../types.js').TxnReceipt}
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
    ...(rich.revert_reason !== undefined ? { revert_reason: rich.revert_reason } : {}),
  };

  switch (rich.type) {
    case 'INVOKE':
      return /** @type {any} */ ({ ...common, type: 'INVOKE' });
    case 'L1_HANDLER':
      return /** @type {any} */ ({
        ...common,
        type: 'L1_HANDLER',
        message_hash: /** @type {import('../rich.js').RichL1HandlerTxnReceipt} */ (rich)
          .message_hash,
      });
    case 'DECLARE':
      return /** @type {any} */ ({ ...common, type: 'DECLARE' });
    case 'DEPLOY_ACCOUNT':
      return /** @type {any} */ ({
        ...common,
        type: 'DEPLOY_ACCOUNT',
        contract_address: addressToHex(
          /** @type {import('../rich.js').RichDeployAccountTxnReceipt} */ (rich).contract_address,
        ),
      });
    default:
      throw new Error(`Unknown receipt type: ${/** @type {any} */ (rich).type}`);
  }
}

/**
 * @param {import('../types.js').TxnReceiptWithBlockInfo} rpc
 * @returns {import('../rich.js').RichTxnReceiptWithBlockInfo}
 */
export function receiptWithBlockInfoFromRpc(rpc) {
  const base = receiptFromRpc(rpc);
  return /** @type {any} */ ({
    ...base,
    ...(rpc.block_hash !== undefined ? { block_hash: hexToFelt(rpc.block_hash) } : {}),
    ...(rpc.block_number !== undefined ? { block_number: rpc.block_number } : {}),
  });
}

/**
 * @param {import('../rich.js').RichTxnReceiptWithBlockInfo} rich
 * @returns {import('../types.js').TxnReceiptWithBlockInfo}
 */
export function receiptWithBlockInfoToRpc(rich) {
  const base = receiptToRpc(rich);
  return /** @type {any} */ ({
    ...base,
    ...(rich.block_hash !== undefined ? { block_hash: feltToHex(rich.block_hash) } : {}),
    ...(rich.block_number !== undefined ? { block_number: rich.block_number } : {}),
  });
}
