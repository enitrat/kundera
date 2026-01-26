/**
 * Wallet Module
 *
 * Browser wallet connection and management utilities.
 *
 * @module wallet
 */

// ============ Types ============
export type {
  WalletProviderType,
  ConnectWalletOptions,
  WalletConnection,
  WalletErrorCode,
  WalletError,
  AccountChangeEvent,
  NetworkChangeEvent,
  AccountChangeCallback,
  NetworkChangeCallback,
  UnsubscribeFn,
} from './types.js';

// ============ Connector ============
export {
  connectWallet,
  disconnectWallet,
  onAccountChange,
  onNetworkChanged,
} from './connector.js';

// ============ Re-exports from Account ============
// Re-export wallet-related types from account module for convenience
export type { StarknetWalletProvider, WalletRequest } from '../account/WalletAccount.js';
export { WalletRequestType } from '../account/WalletAccount.js';
