import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, BroadcastedTxn, FeeEstimate, SimulationFlag } from '../types.js';

/**
 * Estimate fee for a transaction.
 */
export async function starknet_estimateFee(
  transport: Transport,
  transactions: BroadcastedTxn[],
  simulationFlags: SimulationFlag[] = [],
  blockId: BlockId = 'latest',
): Promise<FeeEstimate[]> {
  const response = await transport.request<FeeEstimate[]>(
    buildRequest('starknet_estimateFee', [transactions, simulationFlags, blockId]),
  );
  return unwrapResponse(response);
}
