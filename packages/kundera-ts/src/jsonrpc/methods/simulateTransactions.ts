import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, BroadcastedTxn, SimulatedTransaction, SimulationFlag } from '../types.js';

/**
 * Simulate transactions against a block.
 */
export async function starknet_simulateTransactions(
  transport: Transport,
  blockId: BlockId,
  transactions: BroadcastedTxn[],
  simulationFlags: SimulationFlag[] = [],
): Promise<SimulatedTransaction[]> {
  const response = await transport.request<SimulatedTransaction[]>(
    buildRequest('starknet_simulateTransactions', [
      blockId,
      transactions,
      simulationFlags,
    ]),
  );
  return unwrapResponse(response);
}
