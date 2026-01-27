/**
 * Wallet Connector
 *
 * Browser wallet connection utilities for Starknet.
 * Supports window.starknet and get-starknet patterns.
 *
 * @module wallet/connector
 */

import type { StarknetWalletProvider } from '../account/WalletAccount.js';
import { WalletRequestType } from '../account/WalletAccount.js';
import { type Result, ok, err, type AbiError, abiError } from '../abi/types.js';
import type {
  ConnectWalletOptions,
  WalletConnection,
  WalletErrorCode,
  AccountChangeCallback,
  NetworkChangeCallback,
  UnsubscribeFn,
} from './types.js';

// ============ Error Helper ============

/**
 * Create a wallet error with the Voltaire-style pattern
 */
function walletError(
  code: WalletErrorCode,
  message: string,
  details?: unknown
): AbiError {
  // Map wallet error codes to AbiErrorCode
  // Using 'RPC_ERROR' as the closest match for wallet errors
  return abiError('RPC_ERROR', `[${code}] ${message}`, details);
}

// ============ Provider Detection ============

/**
 * Window with potential Starknet wallet provider
 */
interface StarknetWindow {
  starknet?: StarknetWalletProvider;
  starknet_braavos?: StarknetWalletProvider;
  starknet_argentX?: StarknetWalletProvider;
  getStarknet?: () => Promise<StarknetWalletProvider> | StarknetWalletProvider;
}

/**
 * Get the global window object (browser environment)
 */
function getWindow(): StarknetWindow | null {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    return globalThis as unknown as StarknetWindow;
  }
  if (typeof window !== 'undefined') {
    return window as unknown as StarknetWindow;
  }
  return null;
}

/**
 * Detect available wallet provider
 */
async function detectProvider(
  preferredProvider: 'starknet' | 'get-starknet' | 'auto' = 'auto'
): Promise<StarknetWalletProvider | null> {
  const win = getWindow();
  if (!win) {
    return null;
  }

  // Try get-starknet first if preferred or auto
  if (preferredProvider === 'get-starknet' || preferredProvider === 'auto') {
    if (typeof win.getStarknet === 'function') {
      try {
        const result = win.getStarknet();
        // Handle both sync and async getStarknet
        const provider = result instanceof Promise ? await result : result;
        if (provider) {
          return provider;
        }
      } catch {
        // Fall through to next option
      }
    }
  }

  // Try window.starknet directly
  if (preferredProvider === 'starknet' || preferredProvider === 'auto') {
    if (win.starknet) {
      return win.starknet;
    }
    // Try specific wallet providers
    if (win.starknet_argentX) {
      return win.starknet_argentX;
    }
    if (win.starknet_braavos) {
      return win.starknet_braavos;
    }
  }

  return null;
}

// ============ Connection Functions ============

/**
 * Connect to a browser wallet
 *
 * Detects injected Starknet wallet providers and requests account access.
 * Supports both window.starknet and get-starknet patterns.
 *
 * @param options - Connection options
 * @returns Result with wallet connection info or error
 *
 * @example
 * ```typescript
 * // Auto-detect wallet
 * const { result, error } = await connectWallet();
 * if (error) {
 *   console.error('Connection failed:', error.message);
 * } else {
 *   console.log('Connected accounts:', result.accounts);
 *   console.log('Chain ID:', result.chainId);
 * }
 *
 * // Silent mode (no prompt if not already connected)
 * const { result, error } = await connectWallet({ silent: true });
 *
 * // Prefer specific provider
 * const { result, error } = await connectWallet({ preferredProvider: 'get-starknet' });
 * ```
 */
export async function connectWallet(
  options: ConnectWalletOptions = {}
): Promise<Result<WalletConnection, AbiError>> {
  const { preferredProvider = 'auto', silent = false, allowMultiple = false } = options;

  // Detect provider
  const provider = await detectProvider(preferredProvider);
  if (!provider) {
    return err(walletError(
      'NO_WALLET',
      'No Starknet wallet detected. Please install a wallet extension (e.g., Argent X, Braavos).'
    ));
  }

  try {
    let accounts: string[];

    if (silent) {
      // Silent mode: check if already connected without prompting
      try {
        const permissions = await provider.request({
          type: WalletRequestType.WALLET_GET_PERMISSIONS,
        }) as string[];

        if (!permissions || permissions.length === 0) {
          return err(walletError(
            'NOT_CONNECTED',
            'Wallet is not connected. Set silent=false to prompt user.'
          ));
        }

        // Get accounts without prompting
        accounts = await provider.request({
          type: WalletRequestType.WALLET_REQUEST_ACCOUNTS,
        }) as string[];
      } catch {
        return err(walletError(
          'NOT_CONNECTED',
          'Failed to get connected accounts in silent mode.'
        ));
      }
    } else {
      // Normal mode: request accounts (may prompt user)
      accounts = await provider.request({
        type: WalletRequestType.WALLET_REQUEST_ACCOUNTS,
      }) as string[];
    }

    if (!accounts || accounts.length === 0) {
      return err(walletError(
        'NO_ACCOUNTS',
        'No accounts available from wallet.'
      ));
    }

    // Get chain ID
    const chainId = await provider.request({
      type: WalletRequestType.WALLET_REQUEST_CHAIN_ID,
    }) as string;

    // Return single or multiple accounts based on option
    const first = accounts[0];
    if (!first) {
      return err(walletError('NO_ACCOUNTS', 'No accounts available from wallet.'));
    }
    const resultAccounts = allowMultiple
      ? accounts.filter((a): a is string => typeof a === 'string')
      : [first];

    return ok({
      provider,
      accounts: resultAccounts,
      chainId,
    });
  } catch (e: unknown) {
    // Check for user rejection
    if (isUserRejection(e)) {
      return err(walletError(
        'USER_REJECTED',
        'User rejected the connection request.'
      ));
    }

    return err(walletError(
      'UNKNOWN_ERROR',
      e instanceof Error ? e.message : String(e),
      e
    ));
  }
}

/**
 * Disconnect from wallet
 *
 * Attempts to disconnect from the wallet if supported.
 * Some wallets may not support explicit disconnection.
 *
 * @returns Result with true if successful (or if no-op)
 *
 * @example
 * ```typescript
 * const { result, error } = await disconnectWallet();
 * if (error) {
 *   console.error('Disconnect failed:', error.message);
 * } else {
 *   console.log('Disconnected successfully');
 * }
 * ```
 */
export async function disconnectWallet(): Promise<Result<boolean, AbiError>> {
  // Most Starknet wallets don't have a disconnect method
  // This is a no-op that always succeeds for compatibility
  return ok(true);
}

// ============ Event Subscriptions ============

/**
 * Subscribe to account changes
 *
 * Called when the user switches accounts in their wallet.
 *
 * @param provider - Wallet provider instance
 * @param callback - Function called when accounts change
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = onAccountChange(provider, ({ accounts }) => {
 *   console.log('Accounts changed:', accounts);
 * });
 *
 * // Later, to unsubscribe:
 * unsubscribe();
 * ```
 */
export function onAccountChange(
  provider: StarknetWalletProvider,
  callback: AccountChangeCallback
): UnsubscribeFn {
  const handler = (accounts: unknown) => {
    callback({ accounts: accounts as string[] });
  };

  provider.on('accountsChanged', handler);

  return () => {
    provider.off('accountsChanged', handler);
  };
}

/**
 * Subscribe to network changes
 *
 * Called when the user switches networks in their wallet.
 *
 * @param provider - Wallet provider instance
 * @param callback - Function called when network changes
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = onNetworkChanged(provider, ({ chainId }) => {
 *   console.log('Network changed to:', chainId);
 * });
 *
 * // Later, to unsubscribe:
 * unsubscribe();
 * ```
 */
export function onNetworkChanged(
  provider: StarknetWalletProvider,
  callback: NetworkChangeCallback
): UnsubscribeFn {
  const handler = (chainId: unknown) => {
    callback({ chainId: chainId as string });
  };

  provider.on('networkChanged', handler);

  return () => {
    provider.off('networkChanged', handler);
  };
}

// ============ Helpers ============

/**
 * Check if error is a user rejection
 */
function isUserRejection(e: unknown): boolean {
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    return (
      msg.includes('user rejected') ||
      msg.includes('user denied') ||
      msg.includes('user cancelled') ||
      msg.includes('user canceled')
    );
  }
  return false;
}
