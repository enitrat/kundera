/**
 * Account Discovery Helpers
 *
 * Utilities for discovering account state on-chain.
 * Uses Voltaire-style {result, error} pattern for public APIs.
 *
 * @module account/discovery
 */

import type { Provider } from '../provider/Provider.js';
import { type Result, ok, err, type AbiError, abiError } from '../abi/types.js';

// ============ Discovery Functions ============

/**
 * Check if an account is deployed on-chain
 *
 * Uses `starknet_getClassHashAt` to determine if the account contract
 * is deployed. Returns true if the account has a class hash, false otherwise.
 *
 * @param provider - JSON-RPC provider
 * @param address - Account address to check
 * @param blockId - Block identifier (default: 'pending')
 * @returns Result with boolean indicating deployment status
 *
 * @example
 * ```typescript
 * const { result, error } = await isAccountDeployed(provider, accountAddress);
 * if (error) {
 *   console.error('Failed to check deployment:', error.message);
 * } else if (result) {
 *   console.log('Account is deployed');
 * } else {
 *   console.log('Account is not deployed');
 * }
 * ```
 */
export async function isAccountDeployed(
  provider: Provider,
  address: string,
  blockId: string | { block_number: number } | { block_hash: string } = 'pending'
): Promise<Result<boolean, AbiError>> {
  try {
    await provider.request({
      method: 'starknet_getClassHashAt',
      params: [blockId, address],
    });
    // If we get here, the account is deployed
    return ok(true);
  } catch (e: unknown) {
    // Check if it's a "contract not found" error (code 20)
    if (isRpcError(e) && e.code === 20) {
      return ok(false);
    }
    // Other errors are actual failures
    return err(abiError(
      'RPC_ERROR',
      isRpcError(e) ? e.message : String(e),
      isRpcError(e) ? { code: e.code } : undefined
    ));
  }
}

/**
 * Get the nonce for an account
 *
 * @param provider - JSON-RPC provider
 * @param address - Account address
 * @param blockId - Block identifier (default: 'pending')
 * @returns Result with account nonce as bigint
 *
 * @example
 * ```typescript
 * const { result: nonce, error } = await getAccountNonce(provider, address);
 * if (error) {
 *   console.error('Failed to get nonce:', error.message);
 * } else {
 *   console.log('Account nonce:', nonce);
 * }
 * ```
 */
export async function getAccountNonce(
  provider: Provider,
  address: string,
  blockId: string | { block_number: number } | { block_hash: string } = 'pending'
): Promise<Result<bigint, AbiError>> {
  try {
    const result = await provider.request({
      method: 'starknet_getNonce',
      params: [blockId, address],
    });
    return ok(BigInt(result as string));
  } catch (e: unknown) {
    return err(abiError(
      'RPC_ERROR',
      isRpcError(e) ? e.message : String(e),
      isRpcError(e) ? { code: e.code } : undefined
    ));
  }
}

/**
 * Get the class hash for a deployed account
 *
 * @param provider - JSON-RPC provider
 * @param address - Account address
 * @param blockId - Block identifier (default: 'pending')
 * @returns Result with class hash as hex string, or error if not deployed
 *
 * @example
 * ```typescript
 * const { result: classHash, error } = await getAccountClassHash(provider, address);
 * if (error) {
 *   if (error.details?.code === 20) {
 *     console.log('Account not deployed');
 *   } else {
 *     console.error('Failed to get class hash:', error.message);
 *   }
 * } else {
 *   console.log('Account class hash:', classHash);
 * }
 * ```
 */
export async function getAccountClassHash(
  provider: Provider,
  address: string,
  blockId: string | { block_number: number } | { block_hash: string } = 'pending'
): Promise<Result<string, AbiError>> {
  try {
    const result = await provider.request({
      method: 'starknet_getClassHashAt',
      params: [blockId, address],
    });
    return ok(result as string);
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
