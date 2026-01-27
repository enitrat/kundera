/**
 * Wallet Modal Skill
 *
 * Minimal adapter for StarknetKit/get-starknet modal integrations.
 * Uses peer dependencies + dynamic imports to avoid bundling wallet SDKs.
 *
 * @example
 * ```typescript
 * import { connectWalletWithModal } from './wallet-modal';
 *
 * const { result, error } = await connectWalletWithModal();
 * if (result) {
 *   console.log('Connected:', result.account.address);
 * }
 * ```
 */

import type { Account } from 'kundera/account';
import type { StarknetRpcClient } from 'kundera/rpc';

// ============================================================================
// Types
// ============================================================================

export interface WalletModalOptions {
  /**
   * Modal provider to use.
   * @default 'starknetkit'
   */
  modalProvider?: 'starknetkit' | 'get-starknet';

  /**
   * Allowed wallet IDs. If not specified, all wallets are allowed.
   */
  walletIds?: string[];

  /**
   * Custom RPC URL for the client.
   */
  rpcUrl?: string;

  /**
   * Chain ID to connect to.
   * @default 'SN_MAIN'
   */
  chainId?: 'SN_MAIN' | 'SN_SEPOLIA';
}

export interface WalletModalConnection {
  /** Connected account (ready for signing) */
  account: Account;
  /** RPC client for read operations */
  client: StarknetRpcClient;
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
  | 'CONNECTION_FAILED'
  | 'UNSUPPORTED_PROVIDER';

export interface WalletModalResult {
  result: WalletModalConnection | null;
  error: WalletModalError | null;
}

// ============================================================================
// Internal Helpers
// ============================================================================

function err(code: WalletModalErrorCode, message: string): WalletModalResult {
  return { result: null, error: { code, message } };
}

function ok(connection: WalletModalConnection): WalletModalResult {
  return { result: connection, error: null };
}

/**
 * Dynamically import StarknetKit (peer dependency).
 * Returns null if not installed.
 */
async function loadStarknetKit(): Promise<typeof import('@starknet-io/starknet-kit') | null> {
  try {
    return await import('@starknet-io/starknet-kit');
  } catch {
    return null;
  }
}

/**
 * Dynamically import get-starknet (peer dependency).
 * Returns null if not installed.
 */
async function loadGetStarknet(): Promise<typeof import('get-starknet') | null> {
  try {
    return await import('get-starknet');
  } catch {
    return null;
  }
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Connect to a wallet using a modal UI.
 *
 * This function dynamically loads the modal provider (StarknetKit or get-starknet)
 * to avoid bundling wallet SDKs in your main bundle.
 *
 * @param options - Connection options
 * @returns Connection result with account and client, or error
 *
 * @example
 * ```typescript
 * // Using StarknetKit (default)
 * const { result, error } = await connectWalletWithModal();
 *
 * // Using get-starknet
 * const { result, error } = await connectWalletWithModal({
 *   modalProvider: 'get-starknet',
 * });
 *
 * // Filter to specific wallets
 * const { result, error } = await connectWalletWithModal({
 *   walletIds: ['argentX', 'braavos'],
 * });
 * ```
 */
export async function connectWalletWithModal(
  options: WalletModalOptions = {}
): Promise<WalletModalResult> {
  const {
    modalProvider = 'starknetkit',
    walletIds,
    rpcUrl,
    chainId = 'SN_MAIN',
  } = options;

  // Determine RPC URL
  const resolvedRpcUrl =
    rpcUrl ??
    (chainId === 'SN_MAIN'
      ? 'https://starknet-mainnet.public.blastapi.io'
      : 'https://starknet-sepolia.public.blastapi.io');

  if (modalProvider === 'starknetkit') {
    return connectWithStarknetKit({ walletIds, rpcUrl: resolvedRpcUrl, chainId });
  }

  if (modalProvider === 'get-starknet') {
    return connectWithGetStarknet({ walletIds, rpcUrl: resolvedRpcUrl, chainId });
  }

  return err('UNSUPPORTED_PROVIDER', `Unknown modal provider: ${modalProvider}`);
}

/**
 * Connect using StarknetKit modal.
 */
async function connectWithStarknetKit(options: {
  walletIds?: string[];
  rpcUrl: string;
  chainId: string;
}): Promise<WalletModalResult> {
  const starknetKit = await loadStarknetKit();

  if (!starknetKit) {
    return err(
      'MODAL_NOT_AVAILABLE',
      'StarknetKit is not installed. Run: npm install @starknet-io/starknet-kit'
    );
  }

  try {
    const { connect } = starknetKit;

    const connection = await connect({
      modalMode: 'alwaysAsk',
      ...(options.walletIds && { include: options.walletIds }),
    });

    if (!connection || !connection.wallet) {
      return err('USER_REJECTED', 'User rejected the connection request');
    }

    // Dynamically import Kundera modules
    const { createClient } = await import('kundera/rpc');
    const { createAccount, createWalletSigner } = await import('kundera/account');

    const client = createClient({ url: options.rpcUrl });

    // Create account from wallet connection
    const walletAccount = connection.wallet.account;
    const signer = createWalletSigner(connection.wallet);
    const account = createAccount(client, walletAccount.address, signer);

    return ok({
      account,
      client,
      walletId: connection.wallet.id,
      address: walletAccount.address,
      chainId: options.chainId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('CONNECTION_FAILED', message);
  }
}

/**
 * Connect using get-starknet modal.
 */
async function connectWithGetStarknet(options: {
  walletIds?: string[];
  rpcUrl: string;
  chainId: string;
}): Promise<WalletModalResult> {
  const getStarknet = await loadGetStarknet();

  if (!getStarknet) {
    return err(
      'MODAL_NOT_AVAILABLE',
      'get-starknet is not installed. Run: npm install get-starknet'
    );
  }

  try {
    const { connect } = getStarknet;

    const wallet = await connect({
      modalMode: 'alwaysAsk',
      ...(options.walletIds && { include: options.walletIds }),
    });

    if (!wallet) {
      return err('USER_REJECTED', 'User rejected the connection request');
    }

    // Enable the wallet
    await wallet.enable();

    if (!wallet.account) {
      return err('NO_WALLET_FOUND', 'No account found in wallet');
    }

    // Dynamically import Kundera modules
    const { createClient } = await import('kundera/rpc');
    const { createAccount, createWalletSigner } = await import('kundera/account');

    const client = createClient({ url: options.rpcUrl });

    const signer = createWalletSigner(wallet);
    const account = createAccount(client, wallet.account.address, signer);

    return ok({
      account,
      client,
      walletId: wallet.id,
      address: wallet.account.address,
      chainId: options.chainId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('CONNECTION_FAILED', message);
  }
}

/**
 * Disconnect from the current wallet.
 *
 * @param modalProvider - The modal provider used for connection
 */
export async function disconnectWalletModal(
  modalProvider: 'starknetkit' | 'get-starknet' = 'starknetkit'
): Promise<void> {
  if (modalProvider === 'starknetkit') {
    const starknetKit = await loadStarknetKit();
    if (starknetKit?.disconnect) {
      await starknetKit.disconnect();
    }
  } else if (modalProvider === 'get-starknet') {
    const getStarknet = await loadGetStarknet();
    if (getStarknet?.disconnect) {
      await getStarknet.disconnect();
    }
  }
}
