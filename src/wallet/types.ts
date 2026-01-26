/**
 * Wallet Types
 *
 * Types for wallet connection and management.
 *
 * @module wallet/types
 */

import type { StarknetWalletProvider } from '../account/WalletAccount.js';

// ============ Provider Detection Types ============

/**
 * Preferred wallet provider type
 */
export type WalletProviderType = 'starknet' | 'get-starknet' | 'auto';

/**
 * Options for connecting to a wallet
 */
export interface ConnectWalletOptions {
  /**
   * Preferred provider detection method
   * - 'starknet': Use window.starknet directly
   * - 'get-starknet': Use getStarknet() function if available
   * - 'auto': Try get-starknet first, fallback to window.starknet
   * @default 'auto'
   */
  preferredProvider?: WalletProviderType;

  /**
   * If true, do not prompt the user for wallet connection.
   * Return error if no connected wallet is available.
   * @default false
   */
  silent?: boolean;

  /**
   * If true, allow multiple accounts to be returned.
   * Otherwise, only the first account is used.
   * @default false
   */
  allowMultiple?: boolean;
}

// ============ Connection Result Types ============

/**
 * Successful wallet connection result
 */
export interface WalletConnection {
  /** The wallet provider instance */
  provider: StarknetWalletProvider;
  /** Connected account addresses */
  accounts: string[];
  /** Chain ID as hex string */
  chainId: string;
}

/**
 * Wallet error codes
 */
export type WalletErrorCode =
  | 'NO_WALLET'
  | 'USER_REJECTED'
  | 'NO_ACCOUNTS'
  | 'ALREADY_CONNECTED'
  | 'NOT_CONNECTED'
  | 'UNSUPPORTED_OPERATION'
  | 'UNKNOWN_ERROR';

/**
 * Wallet error
 */
export interface WalletError {
  code: WalletErrorCode;
  message: string;
  details?: unknown;
}

// ============ Event Types ============

/**
 * Account change event data
 */
export interface AccountChangeEvent {
  /** New account addresses */
  accounts: string[];
}

/**
 * Network change event data
 */
export interface NetworkChangeEvent {
  /** New chain ID as hex string */
  chainId: string;
}

/**
 * Event callback types
 */
export type AccountChangeCallback = (event: AccountChangeEvent) => void;
export type NetworkChangeCallback = (event: NetworkChangeEvent) => void;

/**
 * Cleanup function returned by event subscriptions
 */
export type UnsubscribeFn = () => void;
