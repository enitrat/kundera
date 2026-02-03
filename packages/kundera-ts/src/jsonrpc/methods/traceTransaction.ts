import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { TransactionTrace } from '../types.js';

/**
 * Trace a transaction.
 */
export async function starknet_traceTransaction(
  transport: Transport,
  transactionHash: string,
): Promise<TransactionTrace> {
  const response = await transport.request<TransactionTrace>(
    buildRequest('starknet_traceTransaction', [transactionHash]),
  );
  return unwrapResponse(response);
}
