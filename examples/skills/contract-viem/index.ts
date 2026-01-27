/**
 * Viem-Style Contract Skill
 *
 * Provides viem-style contract interaction wrappers using Kundera core APIs.
 * Functions are tree-shakeable and follow the { result, error } pattern.
 *
 * @example
 * ```typescript
 * import { readContract, writeContract } from './contract-viem';
 *
 * const { result } = await readContract(client, {
 *   abi: ERC20_ABI,
 *   address: tokenAddress,
 *   functionName: 'balance_of',
 *   args: [accountAddress],
 * });
 * ```
 */

import { getContract } from 'kundera/contract';
import { encodeCalldata, decodeEvents, compileEventFilter } from 'kundera/abi';
import type { StarknetRpcClient } from 'kundera/rpc';
import type { Account } from 'kundera/account';
import type { Abi } from 'kundera/abi';

// ============================================================================
// Types
// ============================================================================

export interface ContractCallParams {
  /** Contract ABI */
  abi: Abi;
  /** Contract address */
  address: string;
  /** Function name to call */
  functionName: string;
  /** Function arguments */
  args?: unknown[];
}

export interface ReadContractParams extends ContractCallParams {}

export interface WriteContractParams extends ContractCallParams {
  /** Account for signing (required) */
  account: Account;
}

export interface SimulateContractParams extends ContractCallParams {
  /** Account for simulation */
  account: Account;
}

export interface EstimateFeeParams extends ContractCallParams {
  /** Account for fee estimation */
  account: Account;
}

export interface WatchContractEventParams {
  /** Contract ABI */
  abi: Abi;
  /** Contract address */
  address: string;
  /** Event name to watch */
  eventName: string;
  /** Callback for each event */
  onEvent: (event: DecodedEvent) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Polling interval in ms (default: 5000) */
  pollingInterval?: number;
  /** Starting block number (default: latest) */
  fromBlock?: number;
}

export interface DecodedEvent {
  name: string;
  args: Record<string, unknown>;
  blockNumber: number;
  transactionHash: string;
}

export interface ContractResult<T> {
  result: T | null;
  error: ContractError | null;
}

export interface ContractError {
  code: ContractErrorCode;
  message: string;
}

export type ContractErrorCode =
  | 'FUNCTION_NOT_FOUND'
  | 'ENCODE_ERROR'
  | 'DECODE_ERROR'
  | 'ACCOUNT_REQUIRED'
  | 'EXECUTION_REVERTED'
  | 'NETWORK_ERROR';

export interface FeeEstimate {
  gasConsumed: bigint;
  gasPrice: bigint;
  overallFee: bigint;
}

export interface WriteResult {
  transactionHash: string;
}

export interface SimulateResult {
  success: boolean;
  returnData: unknown[];
}

// ============================================================================
// Internal Helpers
// ============================================================================

function err<T>(code: ContractErrorCode, message: string): ContractResult<T> {
  return { result: null, error: { code, message } };
}

function ok<T>(result: T): ContractResult<T> {
  return { result, error: null };
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Read from a contract (view function).
 *
 * @param client - Starknet RPC client
 * @param params - Contract call parameters
 * @returns Decoded return values or error
 *
 * @example
 * ```typescript
 * const { result, error } = await readContract(client, {
 *   abi: ERC20_ABI,
 *   address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
 *   functionName: 'balance_of',
 *   args: [accountAddress],
 * });
 *
 * if (!error) {
 *   console.log('Balance:', result[0]);
 * }
 * ```
 */
export async function readContract(
  client: StarknetRpcClient,
  params: ReadContractParams
): Promise<ContractResult<unknown[]>> {
  const { abi, address, functionName, args = [] } = params;

  try {
    const contract = getContract({ abi, address, client });
    const { result, error } = await contract.read(functionName, args);

    if (error) {
      return err(error.code as ContractErrorCode, error.message);
    }

    return ok(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('NETWORK_ERROR', message);
  }
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Write to a contract (state-changing function).
 *
 * @param client - Starknet RPC client
 * @param params - Contract call parameters with account
 * @returns Transaction hash or error
 *
 * @example
 * ```typescript
 * const { result, error } = await writeContract(client, {
 *   abi: ERC20_ABI,
 *   address: tokenAddress,
 *   functionName: 'transfer',
 *   args: [recipientAddress, 1000000000000000000n],
 *   account,
 * });
 *
 * if (!error) {
 *   console.log('TX:', result.transactionHash);
 * }
 * ```
 */
export async function writeContract(
  client: StarknetRpcClient,
  params: WriteContractParams
): Promise<ContractResult<WriteResult>> {
  const { abi, address, functionName, args = [], account } = params;

  try {
    const contract = getContract({ abi, address, client, account });
    const { result, error } = await contract.write(functionName, args);

    if (error) {
      return err(error.code as ContractErrorCode, error.message);
    }

    return ok(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('NETWORK_ERROR', message);
  }
}

// ============================================================================
// Simulation
// ============================================================================

/**
 * Simulate a contract call without executing.
 *
 * @param client - Starknet RPC client
 * @param params - Contract call parameters with account
 * @returns Simulation result or error
 *
 * @example
 * ```typescript
 * const { result, error } = await simulateContract(client, {
 *   abi: ERC20_ABI,
 *   address: tokenAddress,
 *   functionName: 'transfer',
 *   args: [recipient, amount],
 *   account,
 * });
 *
 * if (!error && result.success) {
 *   console.log('Simulation passed');
 * }
 * ```
 */
export async function simulateContract(
  client: StarknetRpcClient,
  params: SimulateContractParams
): Promise<ContractResult<SimulateResult>> {
  const { abi, address, functionName, args = [], account } = params;

  try {
    // Use estimateFee as a simulation proxy (will fail if tx would revert)
    const contract = getContract({ abi, address, client, account });
    const { result, error } = await contract.estimateFee(functionName, args);

    if (error) {
      return ok({ success: false, returnData: [] });
    }

    return ok({ success: true, returnData: [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('EXECUTION_REVERTED', message);
  }
}

// ============================================================================
// Fee Estimation
// ============================================================================

/**
 * Estimate fee for a contract call.
 *
 * @param client - Starknet RPC client
 * @param params - Contract call parameters with account
 * @returns Fee estimate or error
 *
 * @example
 * ```typescript
 * const { result, error } = await estimateContractFee(client, {
 *   abi: ERC20_ABI,
 *   address: tokenAddress,
 *   functionName: 'transfer',
 *   args: [recipient, amount],
 *   account,
 * });
 *
 * if (!error) {
 *   console.log('Fee:', result.overallFee);
 * }
 * ```
 */
export async function estimateContractFee(
  client: StarknetRpcClient,
  params: EstimateFeeParams
): Promise<ContractResult<FeeEstimate>> {
  const { abi, address, functionName, args = [], account } = params;

  try {
    const contract = getContract({ abi, address, client, account });
    const { result, error } = await contract.estimateFee(functionName, args);

    if (error) {
      return err(error.code as ContractErrorCode, error.message);
    }

    return ok(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('NETWORK_ERROR', message);
  }
}

// ============================================================================
// Event Watching
// ============================================================================

/**
 * Watch for contract events (polling-based).
 *
 * @param client - Starknet RPC client
 * @param params - Watch parameters
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unwatch = watchContractEvent(client, {
 *   abi: ERC20_ABI,
 *   address: tokenAddress,
 *   eventName: 'Transfer',
 *   onEvent: (event) => {
 *     console.log('Transfer:', event.args.from, '->', event.args.to);
 *   },
 *   onError: (error) => {
 *     console.error('Watch error:', error);
 *   },
 * });
 *
 * // Later: stop watching
 * unwatch();
 * ```
 */
export function watchContractEvent(
  client: StarknetRpcClient,
  params: WatchContractEventParams
): () => void {
  const {
    abi,
    address,
    eventName,
    onEvent,
    onError,
    pollingInterval = 5000,
    fromBlock,
  } = params;

  let lastBlock = fromBlock ?? 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;

    try {
      // Get current block if we don't have a starting point
      if (lastBlock === 0) {
        const { result } = await client.starknet_blockNumber();
        if (result) {
          lastBlock = result;
        }
      }

      // Get current block number
      const { result: currentBlock } = await client.starknet_blockNumber();
      if (!currentBlock || currentBlock <= lastBlock) {
        return;
      }

      // Fetch events
      const { result: eventsResult } = await client.starknet_getEvents({
        from_block: { block_number: lastBlock + 1 },
        to_block: { block_number: currentBlock },
        address,
        chunk_size: 100,
      });

      if (eventsResult?.events) {
        // Decode events
        const { result: decoded } = decodeEvents(
          { events: eventsResult.events },
          abi,
          { event: eventName }
        );

        if (decoded) {
          for (const event of decoded) {
            onEvent({
              name: event.name,
              args: event.args as Record<string, unknown>,
              blockNumber: event.blockNumber ?? currentBlock,
              transactionHash: event.transactionHash ?? '',
            });
          }
        }
      }

      lastBlock = currentBlock;
    } catch (e) {
      if (onError && e instanceof Error) {
        onError(e);
      }
    }
  };

  // Start polling
  const interval = setInterval(poll, pollingInterval);
  poll(); // Initial poll

  // Return unsubscribe function
  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Read from multiple contracts in parallel.
 *
 * @param client - Starknet RPC client
 * @param calls - Array of read parameters
 * @returns Array of results
 *
 * @example
 * ```typescript
 * const results = await multicallRead(client, [
 *   { abi, address: token1, functionName: 'balance_of', args: [account] },
 *   { abi, address: token2, functionName: 'balance_of', args: [account] },
 * ]);
 * ```
 */
export async function multicallRead(
  client: StarknetRpcClient,
  calls: ReadContractParams[]
): Promise<ContractResult<unknown[]>[]> {
  return Promise.all(calls.map((params) => readContract(client, params)));
}
