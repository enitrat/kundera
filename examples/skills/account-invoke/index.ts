/**
 * Account Invoke Skill
 *
 * Execute invoke transactions on Starknet.
 */

import type { Transport } from 'kundera/transport';
import {
  starknet_chainId,
  starknet_getNonce,
  starknet_addInvokeTransaction,
  starknet_estimateFee,
} from 'kundera/rpc';
import type { AddInvokeTransactionResult, FeeEstimate } from 'kundera/rpc';
import {
  computeInvokeV3Hash,
  computeSelector,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_VERSION,
  type Call,
  type UniversalDetails,
  type InvokeTransactionV3,
  type ResourceBoundsMapping,
  type SignerInterface,
} from 'kundera/crypto';
import { Felt252 } from 'kundera/primitives';

export interface AccountInvokeOptions {
  transport: Transport;
  address: string;
  signer: SignerInterface;
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
  const chainId = await starknet_chainId(options.transport);
  const nonce = details?.nonce ?? BigInt(await starknet_getNonce(options.transport, options.address));

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
  const signature = await options.signer.signTransaction(txHash);

  return starknet_addInvokeTransaction(options.transport, {
    type: 'INVOKE',
    ...formatInvokeForRpc(tx),
    signature: signature.map((s) => Felt252(s).toHex()),
  });
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
  const nonce = details?.nonce ?? BigInt(await starknet_getNonce(options.transport, options.address));

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

  const simulationFlags = details?.skipValidate ? ['SKIP_VALIDATE'] : [];
  const estimates = await starknet_estimateFee(
    options.transport,
    [{ type: 'INVOKE', ...formatInvokeForRpc(tx), signature: [] }],
    simulationFlags,
    'pending',
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
    l1_data: {
      max_amount: Felt252(rb.l1_data_gas.max_amount).toHex(),
      max_price_per_unit: Felt252(rb.l1_data_gas.max_price_per_unit).toHex(),
    },
  };
}
