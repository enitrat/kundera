/**
 * Account Invoke Skill
 *
 * Execute invoke transactions on Starknet.
 */

import type { Transport } from '@kundera-sn/kundera-ts/transport';
import { Rpc } from '@kundera-sn/kundera-ts/jsonrpc';
import type { AddInvokeTransactionResult, BroadcastedInvokeTxn, FeeEstimate, SimulationFlag } from '@kundera-sn/kundera-ts/jsonrpc';
import {
  computeInvokeV3Hash,
  computeSelector,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_VERSION,
  type Call,
  type UniversalDetails,
  type InvokeTransactionV3,
  type ResourceBoundsMapping,
  type SignatureArray,
} from '@kundera-sn/kundera-ts/crypto';
import { Felt252, type Felt252Input } from '@kundera-sn/kundera-ts';

/** Send a request-builder result through a transport and unwrap the response. */
async function send<T>(transport: Transport, req: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T> {
  const response = await transport.request({ jsonrpc: '2.0', id: 1, method: req.method, params: req.params ?? [] });
  if ('error' in response) throw new Error(response.error.message);
  return response.result as T;
}

export type SignTransaction = (
  hash: Felt252Input,
) => SignatureArray | Promise<SignatureArray>;

export interface AccountInvokeOptions {
  transport: Transport;
  address: string;
  signTransaction: SignTransaction;
}

export interface AccountInvoker {
  address: string;
  execute: (calls: Call | Call[], details?: UniversalDetails) => Promise<AddInvokeTransactionResult>;
  estimateFee: (calls: Call | Call[], details?: UniversalDetails) => Promise<FeeEstimate>;
}

/**
 * Create an account invoker with execute + estimateFee.
 */
export function createAccountInvoker(options: AccountInvokeOptions): AccountInvoker {
  return {
    address: options.address,
    execute: (calls, details) => invoke(options, calls, details),
    estimateFee: (calls, details) => estimateInvokeFee(options, calls, details),
  };
}

/**
 * Execute invoke calls.
 */
export async function invoke(
  options: AccountInvokeOptions,
  calls: Call | Call[],
  details?: UniversalDetails,
): Promise<AddInvokeTransactionResult> {
  const callsArray = Array.isArray(calls) ? calls : [calls];
  const chainId = await send<string>(options.transport, Rpc.ChainIdRequest());
  const nonce = details?.nonce ?? BigInt(await send<string>(options.transport, Rpc.GetNonceRequest('pending', options.address)));

  const calldata = encodeExecuteCalldata(callsArray);

  const tx: InvokeTransactionV3 = {
    version: 3,
    sender_address: options.address,
    calldata,
    nonce,
    resource_bounds: mergeResourceBounds(details?.resourceBounds),
    tip: details?.tip ?? 0n,
    paymaster_data: details?.paymasterData ?? [],
    nonce_data_availability_mode: 0,
    fee_data_availability_mode: 0,
    account_deployment_data: [],
  };

  const txHash = computeInvokeV3Hash(tx, chainId);
  const signature = await options.signTransaction(txHash);

  return send<AddInvokeTransactionResult>(options.transport, Rpc.AddInvokeTransactionRequest({
    type: 'INVOKE',
    ...formatInvokeForRpc(tx),
    signature: signature.map((s) => Felt252(s).toHex()),
  } as BroadcastedInvokeTxn));
}

/**
 * Estimate fee for invoke calls.
 */
export async function estimateInvokeFee(
  options: AccountInvokeOptions,
  calls: Call | Call[],
  details?: UniversalDetails,
): Promise<FeeEstimate> {
  const callsArray = Array.isArray(calls) ? calls : [calls];
  const nonce = details?.nonce ?? BigInt(await send<string>(options.transport, Rpc.GetNonceRequest('pending', options.address)));

  const calldata = encodeExecuteCalldata(callsArray);

  const tx: InvokeTransactionV3 = {
    version: 3,
    sender_address: options.address,
    calldata,
    nonce,
    resource_bounds: mergeResourceBounds(details?.resourceBounds),
    tip: details?.tip ?? 0n,
    paymaster_data: details?.paymasterData ?? [],
    nonce_data_availability_mode: 0,
    fee_data_availability_mode: 0,
    account_deployment_data: [],
  };

  const simulationFlags: SimulationFlag[] = details?.skipValidate ? ['SKIP_VALIDATE'] : [];
  const estimates = await send<FeeEstimate[]>(
    options.transport,
    Rpc.EstimateFeeRequest(
      [{ type: 'INVOKE', ...formatInvokeForRpc(tx), signature: [] } as unknown as BroadcastedInvokeTxn],
      simulationFlags,
      'pending',
    ),
  );

  const estimate = estimates[0];
  if (!estimate) {
    throw new Error('Fee estimate missing for invoke');
  }
  return estimate;
}

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

/**
 * Encode calls for __execute__ entry point.
 */
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
    account_deployment_data: tx.account_deployment_data.map((a) =>
      Felt252(a).toHex(),
    ),
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
    l1_data_gas: {
      max_amount: Felt252(rb.l1_data_gas.max_amount).toHex(),
      max_price_per_unit: Felt252(rb.l1_data_gas.max_price_per_unit).toHex(),
    },
  };
}
