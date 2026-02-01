import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { TxnReceiptWithBlockInfo } from '../types.js';

/**
 * Get transaction receipt.
 */
export async function starknet_getTransactionReceipt(
  transport: Transport,
  transactionHash: string,
): Promise<TxnReceiptWithBlockInfo> {
  const response = await transport.request<TxnReceiptWithBlockInfo>(
    buildRequest('starknet_getTransactionReceipt', [transactionHash]),
  );
  return unwrapResponse(response);
}
