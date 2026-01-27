/**
 * Account Factory Helpers
 *
 * Factory functions for creating account instances.
 * Re-exports existing factory functions and adds wallet integration helpers.
 *
 * @module account/factory
 */

import type { Provider } from '../provider/Provider.js';
import type { SignerInterface } from './Signer.js';
import { Account } from './Account.js';
import { WalletAccount, type StarknetWalletProvider, WalletRequestType } from './WalletAccount.js';
import { type Result, ok, err, type AbiError, abiError } from '../abi/types.js';

// ============ Factory Functions ============

// Note: createAccount is already exported from Account.ts
// Re-export it here for completeness in the factory module
export { createAccount } from './Account.js';

/**
 * Connect to a wallet and create a WalletAccount
 *
 * This is a convenience function that:
 * 1. Requests accounts from the wallet provider
 * 2. Creates a WalletAccount with the first account
 *
 * @param provider - JSON-RPC provider for read operations
 * @param walletProvider - Starknet wallet provider (from get-starknet)
 * @returns Result with WalletAccount instance
 *
 * @example
 * ```typescript
 * // Assuming walletProvider is from get-starknet or window.starknet
 * const { result: account, error } = await connectAccountFromWallet(provider, walletProvider);
 * if (error) {
 *   console.error('Failed to connect:', error.message);
 * } else {
 *   console.log('Connected to account:', account.address);
 * }
 * ```
 */
export async function connectAccountFromWallet(
  provider: Provider,
  walletProvider: StarknetWalletProvider
): Promise<Result<WalletAccount, AbiError>> {
  try {
    // Request accounts from wallet
    const accounts = await walletProvider.request({
      type: WalletRequestType.WALLET_REQUEST_ACCOUNTS,
    }) as string[];

    if (!accounts || accounts.length === 0) {
      return err(abiError(
        'ACCOUNT_REQUIRED',
        'No accounts available from wallet provider'
      ));
    }

    // Create WalletAccount with the first account
    const address = accounts[0];
    if (!address) {
      return err(abiError(
        'ACCOUNT_REQUIRED',
        'No accounts available from wallet provider'
      ));
    }
    const walletAccount = new WalletAccount(provider, walletProvider, address);
    return ok(walletAccount);
  } catch (e: unknown) {
    return err(abiError(
      'RPC_ERROR',
      isRpcError(e) ? e.message : String(e),
      isRpcError(e) ? { code: e.code } : undefined
    ));
  }
}

/**
 * Create an Account from a signer
 *
 * Convenience function that wraps the Account constructor.
 *
 * @param provider - JSON-RPC provider
 * @param address - Account address
 * @param signer - Signer for transaction signing
 * @returns Account instance (no error handling needed for construction)
 *
 * @example
 * ```typescript
 * import { createSigner } from '@starknet/kundera/account';
 *
 * const signer = createSigner(privateKey);
 * const account = createAccountFromSigner(provider, address, signer);
 * ```
 */
export function createAccountFromSigner(
  provider: Provider,
  address: string,
  signer: SignerInterface
): Account {
  return new Account(provider, address, signer);
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
