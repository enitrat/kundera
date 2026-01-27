/**
 * Account Deployment Helpers
 *
 * Utilities for deploying account contracts.
 * Uses Voltaire-style {result, error} pattern for public APIs.
 *
 * @module account/deploy
 */

import type { Provider } from '../provider/Provider.js';
import type { Account } from './Account.js';
import type {
  DeployAccountPayload,
  DeployAccountResult,
  UniversalDetails,
  FeeEstimate,
} from './types.js';
import { isAccountDeployed } from './discovery.js';
import { type Result, ok, err, type AbiError, abiError } from '../abi/types.js';
import { Felt252, toBigInt, toHex } from '../primitives/index.js';
import { computeContractAddress } from './hash.js';

// ============ Result Types ============

/**
 * Result of deployAccountIfNeeded
 */
export interface DeployIfNeededResult {
  /** Whether the account was already deployed */
  alreadyDeployed: boolean;
  /** Deployment result (only present if account was deployed) */
  deployResult?: DeployAccountResult;
}

// ============ Fee Estimation ============

/**
 * Estimate fee for deploying an account
 *
 * @param provider - JSON-RPC provider
 * @param payload - Deploy account payload
 * @param details - Optional transaction details
 * @returns Result with fee estimate
 *
 * @example
 * ```typescript
 * const { result: fee, error } = await estimateDeployAccount(provider, {
 *   classHash: '0x...',
 *   constructorCalldata: ['0x...'],
 *   addressSalt: '0x...',
 * });
 * if (error) {
 *   console.error('Estimation failed:', error.message);
 * } else {
 *   console.log('Estimated fee:', fee.overall_fee);
 * }
 * ```
 */
export async function estimateDeployAccount(
  provider: Provider,
  payload: DeployAccountPayload,
  details?: UniversalDetails
): Promise<Result<FeeEstimate, AbiError>> {
  try {
    // Encode constructor calldata
    const constructorCalldata = (payload.constructorCalldata ?? []).map((c) =>
      toHex(Felt252(c))
    );

    // Generate salt if not provided
    const salt = payload.addressSalt ?? generateSalt();

    // Build transaction for estimation
    const tx = {
      type: 'DEPLOY_ACCOUNT' as const,
      version: '0x3',
      class_hash: payload.classHash,
      constructor_calldata: constructorCalldata,
      contract_address_salt: salt,
      nonce: '0x0', // Deploy account always uses nonce 0
      resource_bounds: formatResourceBoundsForRpc(details?.resourceBounds),
      tip: toHex(Felt252(details?.tip ?? 0n)),
      paymaster_data: (details?.paymasterData ?? []).map((d) => toHex(Felt252(d))),
      nonce_data_availability_mode: 'L1',
      fee_data_availability_mode: 'L1',
      signature: [], // Empty signature for estimation
    };

    const simulationFlags = details?.skipValidate ? ['SKIP_VALIDATE'] : [];

    const result = await provider.request({
      method: 'starknet_estimateFee',
      params: [[tx], simulationFlags, 'pending'],
    });

    const fees = result as FeeEstimate[];
    const fee = fees[0];
    if (!fee) {
      return err(abiError('RPC_ERROR', 'Fee estimate missing for deploy account'));
    }
    return ok(fee);
  } catch (e: unknown) {
    return err(abiError(
      'RPC_ERROR',
      isRpcError(e) ? e.message : String(e),
      isRpcError(e) ? { code: e.code } : undefined
    ));
  }
}

/**
 * Deploy an account if it's not already deployed
 *
 * Checks if the account is deployed first, and only deploys if needed.
 *
 * @param account - Account instance (must have signer for signing)
 * @param payload - Deploy account payload
 * @param details - Optional transaction details
 * @returns Result indicating if deployment was needed and the result
 *
 * @example
 * ```typescript
 * const { result, error } = await deployAccountIfNeeded(account, {
 *   classHash: '0x...',
 *   constructorCalldata: ['0x...'],
 * });
 * if (error) {
 *   console.error('Deployment failed:', error.message);
 * } else if (result.alreadyDeployed) {
 *   console.log('Account was already deployed');
 * } else {
 *   console.log('Account deployed:', result.deployResult?.transaction_hash);
 * }
 * ```
 */
export async function deployAccountIfNeeded(
  account: Account,
  payload: DeployAccountPayload,
  details?: UniversalDetails
): Promise<Result<DeployIfNeededResult, AbiError>> {
  // First check if already deployed
  const { result: deployed, error: checkError } = await isAccountDeployed(
    account.provider,
    account.address
  );

  if (checkError) {
    return err(checkError);
  }

  if (deployed) {
    return ok({ alreadyDeployed: true });
  }

  // Not deployed, deploy now
  try {
    const deployResult = await account.deployAccount(payload, details);
    return ok({
      alreadyDeployed: false,
      deployResult,
    });
  } catch (e: unknown) {
    return err(abiError(
      'RPC_ERROR',
      isRpcError(e) ? e.message : String(e),
      isRpcError(e) ? { code: e.code } : undefined
    ));
  }
}

// ============ Helpers ============

/**
 * Generate a random salt for contract deployment
 */
function generateSalt(): string {
  const bytes = new Uint8Array(32);
  if (typeof globalThis.crypto !== 'undefined') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(Felt252(bytes));
}

/**
 * Format resource bounds for RPC
 */
function formatResourceBoundsForRpc(
  resourceBounds?: Partial<{
    l1_gas: { max_amount: bigint; max_price_per_unit: bigint };
    l2_gas: { max_amount: bigint; max_price_per_unit: bigint };
    l1_data_gas: { max_amount: bigint; max_price_per_unit: bigint };
  }>
): {
  l1_gas: { max_amount: string; max_price_per_unit: string };
  l2_gas: { max_amount: string; max_price_per_unit: string };
  l1_data_gas: { max_amount: string; max_price_per_unit: string };
} {
  const defaultBounds = {
    max_amount: '0x0',
    max_price_per_unit: '0x0',
  };

  return {
    l1_gas: resourceBounds?.l1_gas
      ? {
          max_amount: toHex(Felt252(resourceBounds.l1_gas.max_amount)),
          max_price_per_unit: toHex(Felt252(resourceBounds.l1_gas.max_price_per_unit)),
        }
      : defaultBounds,
    l2_gas: resourceBounds?.l2_gas
      ? {
          max_amount: toHex(Felt252(resourceBounds.l2_gas.max_amount)),
          max_price_per_unit: toHex(Felt252(resourceBounds.l2_gas.max_price_per_unit)),
        }
      : defaultBounds,
    l1_data_gas: resourceBounds?.l1_data_gas
      ? {
          max_amount: toHex(Felt252(resourceBounds.l1_data_gas.max_amount)),
          max_price_per_unit: toHex(Felt252(resourceBounds.l1_data_gas.max_price_per_unit)),
        }
      : defaultBounds,
  };
}

/**
 * Type guard for RPC errors
 */
interface RpcErrorLike {
  code: number;
  message: string;
}

function isRpcError(e: unknown): e is RpcErrorLike {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    'message' in e &&
    typeof (e as RpcErrorLike).code === 'number' &&
    typeof (e as RpcErrorLike).message === 'string'
  );
}
