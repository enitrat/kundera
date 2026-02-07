/**
 * Wallet Modal — StarknetKit
 *
 * Connect to browser wallets using StarknetKit's modal.
 * Requires: `npm install starknetkit`
 */

import { httpTransport, type Transport } from '@kundera-sn/kundera-ts/transport';
import type { StarknetWindowObject } from '@kundera-sn/kundera-ts/provider';

// ============================================================================
// Types
// ============================================================================

export interface WalletModalOptions {
  /** Allowed wallet IDs. If not specified, all wallets are allowed. */
  walletIds?: string[];
  /** Custom RPC URL for the transport. */
  rpcUrl?: string;
  /**
   * Chain ID to connect to.
   * @default 'SN_MAIN'
   */
  chainId?: 'SN_MAIN' | 'SN_SEPOLIA';
}

export interface WalletModalConnection {
  /** The StarknetWindowObject — pass directly to createWalletAccount() */
  swo: StarknetWindowObject;
  /** Transport for read-only RPC calls */
  transport: Transport;
  /** Connected wallet ID */
  walletId: string;
  /** Connected address */
  address: string;
  /** Chain ID */
  chainId: string;
}

export interface WalletModalError {
  code: WalletModalErrorCode;
  message: string;
}

export type WalletModalErrorCode =
  | 'MODAL_NOT_AVAILABLE'
  | 'USER_REJECTED'
  | 'NO_WALLET_FOUND'
  | 'CONNECTION_FAILED';

export interface WalletModalResult {
  result: WalletModalConnection | null;
  error: WalletModalError | null;
}

// ============================================================================
// Helpers
// ============================================================================

function err(code: WalletModalErrorCode, message: string): WalletModalResult {
  return { result: null, error: { code, message } };
}

function ok(connection: WalletModalConnection): WalletModalResult {
  return { result: connection, error: null };
}

function resolveAddress(swo: any): string | null {
  return swo.account?.address ?? swo.selectedAddress ?? null;
}

function resolveRpcUrl(rpcUrl: string | undefined, chainId: string): string {
  return rpcUrl ?? (chainId === 'SN_MAIN'
    ? 'https://api.zan.top/public/starknet-mainnet'
    : 'https://api.zan.top/public/starknet-sepolia');
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Open StarknetKit's wallet connection modal.
 *
 * Returns a `StarknetWindowObject` that can be passed directly to
 * `createWalletAccount()` from the wallet-account skill.
 *
 * @example
 * ```ts
 * import { connectWallet, disconnectWallet } from './skills/wallet-modal-starknetkit';
 * import { createWalletAccount } from './skills/wallet-account';
 *
 * const { result, error } = await connectWallet({ chainId: 'SN_MAIN' });
 * if (result) {
 *   const account = createWalletAccount({ swo: result.swo, transport: result.transport });
 *   await account.connect();
 * }
 * ```
 */
export async function connectWallet(
  options: WalletModalOptions = {},
): Promise<WalletModalResult> {
  const { walletIds, rpcUrl, chainId = 'SN_MAIN' } = options;
  const resolvedRpcUrl = resolveRpcUrl(rpcUrl, chainId);


  const starknetKit = await import('starknetkit').catch(() => null);

  if (!starknetKit) {
    return err(
      'MODAL_NOT_AVAILABLE',
      'starknetkit is not installed. Run: npm install starknetkit',
    );
  }

  try {
    const connection = await starknetKit.connect({
      modalMode: 'alwaysAsk',
      ...(walletIds ? { include: walletIds } : {}),
    });

    if (!connection?.wallet) {
      return err('USER_REJECTED', 'User rejected the connection request');
    }

    const swo = connection.wallet as StarknetWindowObject;

    // Try reading the address from the SWO first, then fall back to
    // wallet_requestAccounts — StarknetKit doesn't always populate
    // swo.account.address immediately after connect().
    let address = resolveAddress(swo);
    if (!address) {
      try {
        const accounts = await swo.request({ type: 'wallet_requestAccounts' }) as string[];
        address = accounts?.[0] ?? null;
      } catch {
        // wallet_requestAccounts failed — no account available
      }
    }
    if (!address) {
      return err('NO_WALLET_FOUND', 'No account found in wallet');
    }

    return ok({
      swo,
      transport: httpTransport(resolvedRpcUrl),
      walletId: swo.id ?? 'unknown',
      address,
      chainId,
    });
  } catch (e) {
    return err('CONNECTION_FAILED', e instanceof Error ? e.message : 'Unknown error');
  }
}

/**
 * Disconnect the StarknetKit modal session.
 */
export async function disconnectWallet(): Promise<void> {
  const starknetKit = await import('starknetkit').catch(() => null);
  if (starknetKit?.disconnect) {
    await starknetKit.disconnect();
  }
}
