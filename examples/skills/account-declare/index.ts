/**
 * Account Declare Skill
 *
 * Declare contract classes with a signer.
 */

import type { Transport } from 'kundera/transport';
import {
  starknet_chainId,
  starknet_getNonce,
  starknet_addDeclareTransaction,
  starknet_estimateFee,
} from 'kundera/rpc';
import type { AddDeclareTransactionResult, BroadcastedDeclareTxn, FeeEstimate, SimulationFlag } from 'kundera/rpc';
import {
  computeDeclareV3Hash,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_VERSION,
  type DeclarePayload,
  type DeclareTransactionV3,
  type ResourceBoundsMapping,
  type SignerInterface,
  type UniversalDetails,
} from 'kundera/crypto';
import { Felt252 } from 'kundera/primitives';

export interface AccountDeclareOptions {
  transport: Transport;
  address: string;
  signer: SignerInterface;
}

export interface AccountDeclarer {
  address: string;
  declare: (payload: DeclarePayload, details?: UniversalDetails) => Promise<AddDeclareTransactionResult>;
  estimateFee: (payload: DeclarePayload, details?: UniversalDetails) => Promise<FeeEstimate>;
}

export function createAccountDeclarer(options: AccountDeclareOptions): AccountDeclarer {
  return {
    address: options.address,
    declare: (payload, details) => declare(options, payload, details),
    estimateFee: (payload, details) => estimateDeclareFee(options, payload, details),
  };
}

export async function declare(
  options: AccountDeclareOptions,
  payload: DeclarePayload,
  details?: UniversalDetails,
): Promise<AddDeclareTransactionResult> {
  const chainId = await starknet_chainId(options.transport);
  const nonce = details?.nonce ?? BigInt(await starknet_getNonce(options.transport, options.address));

  const tx: DeclareTransactionV3 = {
    version: 3,
    sender_address: options.address,
    class_hash: payload.classHash,
    compiled_class_hash: payload.compiledClassHash,
    nonce,
    resource_bounds: mergeResourceBounds(details?.resourceBounds),
    tip: details?.tip ?? 0n,
    paymaster_data: details?.paymasterData ?? [],
    nonce_data_availability_mode: 0,
    fee_data_availability_mode: 0,
    account_deployment_data: [],
  };

  const txHash = computeDeclareV3Hash(tx, chainId);
  const signature = await options.signer.signTransaction(txHash);

  return starknet_addDeclareTransaction(options.transport, {
    type: 'DECLARE',
    ...formatDeclareForRpc(tx, payload.contract),
    signature: signature.map((s) => Felt252(s).toHex()),
  } as BroadcastedDeclareTxn);
}

export async function estimateDeclareFee(
  options: AccountDeclareOptions,
  payload: DeclarePayload,
  details?: UniversalDetails,
): Promise<FeeEstimate> {
  const nonce = details?.nonce ?? BigInt(await starknet_getNonce(options.transport, options.address));

  const tx: DeclareTransactionV3 = {
    version: 3,
    sender_address: options.address,
    class_hash: payload.classHash,
    compiled_class_hash: payload.compiledClassHash,
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
    options.transport,
    [{ type: 'DECLARE', ...formatDeclareForRpc(tx, payload.contract), signature: [] } as unknown as BroadcastedDeclareTxn],
    simulationFlags,
    'pending',
  );

  const estimate = estimates[0];
  if (!estimate) {
    throw new Error('Fee estimate missing for declare');
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

function formatDeclareForRpc(
  tx: DeclareTransactionV3,
  contract: unknown,
): Record<string, unknown> {
  return {
    version: Felt252(TRANSACTION_VERSION.V3).toHex(),
    sender_address: tx.sender_address,
    compiled_class_hash: tx.compiled_class_hash,
    contract_class: contract,
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
