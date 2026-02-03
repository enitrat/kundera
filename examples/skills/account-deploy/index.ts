/**
 * Account Deploy Skill
 *
 * Deploy account contracts with a signer.
 */

import type { Transport } from 'kundera-sn/transport';
import {
  starknet_chainId,
  starknet_addDeployAccountTransaction,
  starknet_estimateFee,
} from 'kundera-sn/jsonrpc';
import type { AddDeployAccountTransactionResult, BroadcastedDeployAccountTxn, FeeEstimate, SimulationFlag } from 'kundera-sn/jsonrpc';
import {
  computeContractAddress,
  computeDeployAccountV3Hash,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_VERSION,
  type DeployAccountPayload,
  type DeployAccountTransactionV3,
  type ResourceBoundsMapping,
  type SignatureArray,
  type UniversalDetails,
} from 'kundera-sn/crypto';
import { Felt252, type Felt252Input } from 'kundera-sn';

export type SignTransaction = (
  hash: Felt252Input,
) => SignatureArray | Promise<SignatureArray>;

export interface AccountDeployOptions {
  transport: Transport;
  signTransaction: SignTransaction;
}

export interface AccountDeployer {
  deployAccount: (payload: DeployAccountPayload, details?: UniversalDetails) => Promise<AddDeployAccountTransactionResult>;
  estimateFee: (payload: DeployAccountPayload, details?: UniversalDetails) => Promise<FeeEstimate>;
}

export function createAccountDeployer(options: AccountDeployOptions): AccountDeployer {
  return {
    deployAccount: (payload, details) => deployAccount(options, payload, details),
    estimateFee: (payload, details) => estimateDeployAccountFee(options, payload, details),
  };
}

export async function deployAccount(
  options: AccountDeployOptions,
  payload: DeployAccountPayload,
  details?: UniversalDetails,
): Promise<AddDeployAccountTransactionResult> {
  const chainId = await starknet_chainId(options.transport);
  const nonce = details?.nonce ?? 0n;

  const constructorCalldata = (payload.constructorCalldata ?? []).map((c) =>
    Felt252(c).toBigInt(),
  );
  const salt = payload.addressSalt ?? generateSalt();

  const tx: DeployAccountTransactionV3 = {
    version: 3,
    class_hash: payload.classHash,
    constructor_calldata: constructorCalldata,
    contract_address_salt: salt,
    nonce,
    resource_bounds: mergeResourceBounds(details?.resourceBounds),
    tip: details?.tip ?? 0n,
    paymaster_data: details?.paymasterData ?? [],
    nonce_data_availability_mode: 0,
    fee_data_availability_mode: 0,
  };

  const contractAddress = computeContractAddress(
    tx.class_hash,
    tx.contract_address_salt,
    tx.constructor_calldata,
  );

  const txHash = computeDeployAccountV3Hash(tx, contractAddress, chainId);
  const signature = await options.signTransaction(txHash);

  return starknet_addDeployAccountTransaction(options.transport, {
    type: 'DEPLOY_ACCOUNT',
    ...formatDeployAccountForRpc(tx),
    signature: signature.map((s) => Felt252(s).toHex()),
  } as BroadcastedDeployAccountTxn);
}

export async function estimateDeployAccountFee(
  options: AccountDeployOptions,
  payload: DeployAccountPayload,
  details?: UniversalDetails,
): Promise<FeeEstimate> {
  const constructorCalldata = (payload.constructorCalldata ?? []).map((c) =>
    Felt252(c).toBigInt(),
  );
  const salt = payload.addressSalt ?? generateSalt();

  const tx: DeployAccountTransactionV3 = {
    version: 3,
    class_hash: payload.classHash,
    constructor_calldata: constructorCalldata,
    contract_address_salt: salt,
    nonce: details?.nonce ?? 0n,
    resource_bounds: mergeResourceBounds(details?.resourceBounds),
    tip: details?.tip ?? 0n,
    paymaster_data: details?.paymasterData ?? [],
    nonce_data_availability_mode: 0,
    fee_data_availability_mode: 0,
  };

  const simulationFlags: SimulationFlag[] = details?.skipValidate ? ['SKIP_VALIDATE'] : [];
  const estimates = await starknet_estimateFee(
    options.transport,
    [{ type: 'DEPLOY_ACCOUNT', ...formatDeployAccountForRpc(tx), signature: [] } as unknown as BroadcastedDeployAccountTxn],
    simulationFlags,
    'pending',
  );

  const estimate = estimates[0];
  if (!estimate) {
    throw new Error('Fee estimate missing for deploy account');
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

function formatDeployAccountForRpc(
  tx: DeployAccountTransactionV3,
): Record<string, unknown> {
  return {
    version: Felt252(TRANSACTION_VERSION.V3).toHex(),
    class_hash: tx.class_hash,
    constructor_calldata: tx.constructor_calldata.map((c) => Felt252(c).toHex()),
    contract_address_salt: tx.contract_address_salt,
    nonce: Felt252(tx.nonce).toHex(),
    resource_bounds: formatResourceBoundsForRpc(tx.resource_bounds),
    tip: Felt252(tx.tip).toHex(),
    paymaster_data: tx.paymaster_data.map((p) => Felt252(p).toHex()),
    nonce_data_availability_mode: 'L1',
    fee_data_availability_mode: 'L1',
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

function generateSalt(): string {
  const bytes = new Uint8Array(32);
  if (typeof globalThis.crypto !== 'undefined') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Felt252(bytes).toHex();
}
