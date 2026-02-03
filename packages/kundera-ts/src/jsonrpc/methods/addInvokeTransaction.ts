import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { AddInvokeTransactionResult, BroadcastedInvokeTxn } from '../types.js';

/**
 * Submit an invoke transaction.
 */
export async function starknet_addInvokeTransaction(
  transport: Transport,
  transaction: BroadcastedInvokeTxn,
): Promise<AddInvokeTransactionResult> {
  const response = await transport.request<AddInvokeTransactionResult>(
    buildRequest('starknet_addInvokeTransaction', [transaction]),
  );
  return unwrapResponse(response);
}
