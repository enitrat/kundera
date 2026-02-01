/**
 * Viem-Style Contract Skill
 *
 * Tree-shakeable contract helpers using Kundera transport + rpc primitives.
 */

import type { Transport } from 'kundera/transport';
import {
  starknet_call,
  starknet_estimateFee,
  starknet_getEvents,
  starknet_blockNumber,
  starknet_getNonce,
} from 'kundera/rpc';
import type { BlockId, BroadcastedInvokeTxn, EventsFilter, FeeEstimate as RpcFeeEstimate, SimulationFlag } from 'kundera/rpc';
import {
  encodeCalldata,
  decodeOutput,
  decodeEvents,
  getFunctionSelectorHex,
  type Abi,
} from 'kundera/abi';
import { Felt252 } from 'kundera/primitives';
import {
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_VERSION,
  computeSelector,
  type Call,
  type InvokeTransactionV3,
  type ResourceBoundsMapping,
  type UniversalDetails,
} from 'kundera/crypto';

// ============================================================================
// Types
// ============================================================================

export interface ContractCallParams {
  abi: Abi;
  address: string;
  functionName: string;
  args?: unknown[];
  blockId?: BlockId;
}

export interface ReadContractParams extends ContractCallParams {}

export interface AccountLike {
  address: string;
  execute?: (calls: Call | Call[], details?: UniversalDetails) => Promise<{ transaction_hash: string }>;
}

export interface WriteContractParams extends ContractCallParams {
  account: AccountLike;
  details?: UniversalDetails;
}

export interface SimulateContractParams extends ContractCallParams {
  account: AccountLike;
  details?: UniversalDetails;
}

export interface EstimateFeeParams extends ContractCallParams {
  account: AccountLike;
  details?: UniversalDetails;
}

export interface WatchContractEventParams {
  abi: Abi;
  address: string;
  eventName: string;
  onEvent: (event: DecodedEvent) => void;
  onError?: (error: Error) => void;
  pollingInterval?: number;
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
// Helpers
// ============================================================================

function err<T>(code: ContractErrorCode, message: string): ContractResult<T> {
  return { result: null, error: { code, message } };
}

function ok<T>(result: T): ContractResult<T> {
  return { result, error: null };
}

function toRpcFee(fee: RpcFeeEstimate): FeeEstimate {
  return {
    gasConsumed: BigInt(fee.gas_consumed),
    gasPrice: BigInt(fee.gas_price),
    overallFee: BigInt(fee.overall_fee),
  };
}

// ============================================================================
// Read Operations
// ============================================================================

export async function readContract(
  transport: Transport,
  params: ReadContractParams,
): Promise<ContractResult<unknown[]>> {
  const { abi, address, functionName, args = [], blockId } = params;

  const calldataResult = encodeCalldata(abi, functionName, args as any);
  if (calldataResult.error) {
    return err('ENCODE_ERROR', calldataResult.error.message);
  }

  try {
    const selector = getFunctionSelectorHex(functionName);
    const calldata = calldataResult.result.map((value) => Felt252(value).toHex());
    const response = await starknet_call(
      transport,
      {
        contract_address: address,
        entry_point_selector: selector,
        calldata: calldata as any,
      },
      blockId,
    ) as string[];

    const outputFelts = response.map((value) => BigInt(value));
    const decoded = decodeOutput(abi, functionName, outputFelts);
    if (decoded.error) {
      return err('DECODE_ERROR', decoded.error.message);
    }

    return ok(decoded.result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('NETWORK_ERROR', message);
  }
}

// ============================================================================
// Write Operations
// ============================================================================

export async function writeContract(
  _transport: Transport,
  params: WriteContractParams,
): Promise<ContractResult<WriteResult>> {
  const { abi, address, functionName, args = [], account, details } = params;

  if (!account.execute) {
    return err('ACCOUNT_REQUIRED', 'Account executor is required');
  }

  const calldataResult = encodeCalldata(abi, functionName, args as any);
  if (calldataResult.error) {
    return err('ENCODE_ERROR', calldataResult.error.message);
  }

  try {
    const call: Call = {
      contractAddress: address,
      entrypoint: functionName,
      calldata: calldataResult.result as any,
    };

    const result = await account.execute(call, details);
    return ok({ transactionHash: result.transaction_hash });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('NETWORK_ERROR', message);
  }
}

// ============================================================================
// Simulation
// ============================================================================

export async function simulateContract(
  transport: Transport,
  params: SimulateContractParams,
): Promise<ContractResult<SimulateResult>> {
  const estimate = await estimateContractFee(transport, params);
  if (estimate.error) {
    return err('EXECUTION_REVERTED', estimate.error.message);
  }
  return ok({ success: true, returnData: [] });
}

// ============================================================================
// Fee Estimation
// ============================================================================

export async function estimateContractFee(
  transport: Transport,
  params: EstimateFeeParams,
): Promise<ContractResult<FeeEstimate>> {
  const { abi, address, functionName, args = [], account, details } = params;

  const calldataResult = encodeCalldata(abi, functionName, args as any);
  if (calldataResult.error) {
    return err('ENCODE_ERROR', calldataResult.error.message);
  }

  try {
    const nonce = details?.nonce ?? BigInt(await starknet_getNonce(transport, account.address));
    const call: Call = {
      contractAddress: address,
      entrypoint: functionName,
      calldata: calldataResult.result as any,
    };

    const tx: InvokeTransactionV3 = {
      version: 3,
      sender_address: account.address,
      calldata: encodeExecuteCalldata([call]),
      nonce,
      resource_bounds: mergeResourceBounds(details?.resourceBounds),
      tip: details?.tip ?? 0n,
      paymaster_data: details?.paymasterData ?? [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    const simulationFlags: SimulationFlag[] = details?.skipValidate ? ['SKIP_VALIDATE'] : [];
    const estimates = await starknet_estimateFee(
      transport,
      [{ type: 'INVOKE', ...formatInvokeForRpc(tx), signature: [] } as unknown as BroadcastedInvokeTxn],
      simulationFlags,
      'pending',
    );

    const estimate = estimates[0];
    if (!estimate) {
      return err('NETWORK_ERROR', 'Fee estimate missing');
    }

    return ok(toRpcFee(estimate));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('NETWORK_ERROR', message);
  }
}

// ============================================================================
// Event Watching
// ============================================================================

export function watchContractEvent(
  transport: Transport,
  params: WatchContractEventParams,
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
      if (lastBlock === 0) {
        lastBlock = await starknet_blockNumber(transport);
      }

      const currentBlock = await starknet_blockNumber(transport);
      if (currentBlock <= lastBlock) {
        return;
      }

      const filter: EventsFilter = {
        from_block: { block_number: lastBlock + 1 },
        to_block: { block_number: currentBlock },
        address,
        chunk_size: 100,
      };

      const eventsResult = await starknet_getEvents(transport, filter);
      if (eventsResult.events) {
        const decoded = decodeEvents(
          { events: eventsResult.events },
          abi,
          { event: eventName },
        );

        if (decoded.result) {
          for (const event of decoded.result) {
            onEvent({
              name: event.name,
              args: event.args as Record<string, unknown>,
              blockNumber: currentBlock,
              transactionHash: '',
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

  const interval = setInterval(poll, pollingInterval);
  poll();

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

export async function multicallRead(
  transport: Transport,
  calls: ReadContractParams[],
): Promise<ContractResult<unknown[]>[]> {
  return Promise.all(calls.map((params) => readContract(transport, params)));
}

// ============================================================================
// Internal helpers for fee estimation
// ============================================================================

function mergeResourceBounds(
  partial?: Partial<ResourceBoundsMapping>,
): ResourceBoundsMapping {
  if (!partial) return DEFAULT_RESOURCE_BOUNDS;

  return {
    l1_gas: { ...DEFAULT_RESOURCE_BOUNDS.l1_gas, ...partial.l1_gas },
    l2_gas: { ...DEFAULT_RESOURCE_BOUNDS.l2_gas, ...partial.l2_gas },
    l1_data_gas: {
      ...DEFAULT_RESOURCE_BOUNDS.l1_data_gas,
      ...partial.l1_data_gas,
    },
  };
}

function encodeExecuteCalldata(calls: Call[]): bigint[] {
  const callArray: bigint[] = [];
  const calldataFlat: bigint[] = [];

  let offset = 0;
  for (const call of calls) {
    const selector = computeSelector(call.entrypoint);
    const calldata = call.calldata.map((c) => Felt252(c).toBigInt());

    callArray.push(
      Felt252(call.contractAddress).toBigInt(),
      selector.toBigInt(),
      BigInt(offset),
      BigInt(calldata.length),
    );

    calldataFlat.push(...calldata);
    offset += calldata.length;
  }

  return [
    BigInt(calls.length),
    ...callArray,
    BigInt(calldataFlat.length),
    ...calldataFlat,
  ];
}

function formatInvokeForRpc(tx: InvokeTransactionV3): Record<string, unknown> {
  return {
    version: Felt252(TRANSACTION_VERSION.V3).toHex(),
    sender_address: tx.sender_address,
    calldata: tx.calldata.map((c) => Felt252(c).toHex()),
    nonce: Felt252(tx.nonce).toHex(),
    resource_bounds: formatResourceBoundsForRpc(tx.resource_bounds),
    tip: Felt252(tx.tip).toHex(),
    paymaster_data: tx.paymaster_data.map((p) => Felt252(p).toHex()),
    nonce_data_availability_mode: 'L1',
    fee_data_availability_mode: 'L1',
    account_deployment_data: tx.account_deployment_data.map((a) => Felt252(a).toHex()),
  };
}

function formatResourceBoundsForRpc(
  rb: ResourceBoundsMapping,
): Record<string, Record<string, string>> {
  return {
    l1_gas: {
      max_amount: Felt252(rb.l1_gas.max_amount).toHex(),
      max_price_per_unit: Felt252(rb.l1_gas.max_price_per_unit).toHex(),
    },
    l2_gas: {
      max_amount: Felt252(rb.l2_gas.max_amount).toHex(),
      max_price_per_unit: Felt252(rb.l2_gas.max_price_per_unit).toHex(),
    },
    l1_data: {
      max_amount: Felt252(rb.l1_data_gas.max_amount).toHex(),
      max_price_per_unit: Felt252(rb.l1_data_gas.max_price_per_unit).toHex(),
    },
  };
}
