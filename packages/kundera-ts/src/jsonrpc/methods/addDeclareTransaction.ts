import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { AddDeclareTransactionResult, BroadcastedDeclareTxn } from '../types.js';

/**
 * Submit a declare transaction.
 */
export async function starknet_addDeclareTransaction(
  transport: Transport,
  transaction: BroadcastedDeclareTxn,
): Promise<AddDeclareTransactionResult> {
  const response = await transport.request<AddDeclareTransactionResult>(
    buildRequest('starknet_addDeclareTransaction', [transaction]),
  );
  return unwrapResponse(response);
}
