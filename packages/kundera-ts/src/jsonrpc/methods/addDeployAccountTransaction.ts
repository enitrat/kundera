import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { AddDeployAccountTransactionResult, BroadcastedDeployAccountTxn } from '../types.js';

/**
 * Submit a deploy account transaction.
 */
export async function starknet_addDeployAccountTransaction(
  transport: Transport,
  transaction: BroadcastedDeployAccountTxn,
): Promise<AddDeployAccountTransactionResult> {
  const response = await transport.request<AddDeployAccountTransactionResult>(
    buildRequest('starknet_addDeployAccountTransaction', [transaction]),
  );
  return unwrapResponse(response);
}
