/**
 * Wallet Modal Skill
 *
 * Minimal adapter for StarknetKit/get-starknet modal integrations.
 * Requires `starknetkit` or `get-starknet` as a peer dependency.
 *
 * NOTE: Dynamic imports are used so the skill file itself can be imported
 * without the peer dep installed, but bundlers (Vite, webpack) will still
 * resolve and bundle the peer dep if it's in node_modules. This is NOT
 * a tree-shaking boundary — install only the modal library you use.
 *
 * VITE USERS: Vite's import analysis will fail on the uninstalled modal
 * library even though it's inside a try/catch. You need a plugin to
 * externalize it:
 *
 *   // vite.config.ts
 *   { name: 'externalize-optional-deps', enforce: 'pre',
 *     resolveId(id) { if (id === 'get-starknet') return { id, external: true } } }
 *
 * Or delete the loadGetStarknet() function if you only use starknetkit.
 */

import { httpTransport, type Transport } from '@kundera-sn/kundera-ts/transport';
import type { StarknetWindowObject } from '@kundera-sn/kundera-ts/provider';

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
   * Custom RPC URL for the transport.
   */
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

async function loadStarknetKit(): Promise<any | null> {
  try {
    // @ts-expect-error - Optional peer dependency, not in kundera-ts deps
    return await import('starknetkit');
  } catch {
    return null;
  }
}

async function loadGetStarknet(): Promise<any | null> {
  try {
    // @ts-expect-error - Optional peer dependency, may not be installed
    return await import('get-starknet');
  } catch {
    return null;
  }
}

function resolveAddress(swo: StarknetWindowObject | any): string | null {
  // StarknetKit returns connection.wallet which may have account.address or selectedAddress
  return swo.account?.address ?? swo.selectedAddress ?? null;
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Open a wallet connection modal and return a connected SWO + transport.
 *
 * The returned `swo` can be passed directly to `createWalletAccount()`.
 *
 * @example
 * ```ts
 * import { connectWalletWithModal } from './skills/wallet-modal';
 * import { createWalletAccount } from './skills/wallet-account';
 *
 * const { result, error } = await connectWalletWithModal();
 * if (result) {
 *   const account = createWalletAccount({ swo: result.swo, transport: result.transport });
 *   await account.connect();
 * }
 * ```
 */
export async function connectWalletWithModal(
  options: WalletModalOptions = {},
): Promise<WalletModalResult> {
  const {
    modalProvider = 'starknetkit',
    walletIds,
    rpcUrl,
    chainId = 'SN_MAIN',
  } = options;

  const resolvedRpcUrl =
    rpcUrl ??
    (chainId === 'SN_MAIN'
      ? 'https://api.zan.top/public/starknet-mainnet'
      : 'https://api.zan.top/public/starknet-sepolia');

  if (modalProvider === 'starknetkit') {
    const opts = { rpcUrl: resolvedRpcUrl, chainId } as any;
    if (walletIds !== undefined) opts.walletIds = walletIds;
    return connectWithStarknetKit(opts);
  }

  if (modalProvider === 'get-starknet') {
    const opts = { rpcUrl: resolvedRpcUrl, chainId } as any;
    if (walletIds !== undefined) opts.walletIds = walletIds;
    return connectWithGetStarknet(opts);
  }

  return err('UNSUPPORTED_PROVIDER', `Unknown modal provider: ${modalProvider}`);
}

async function connectWithStarknetKit(options: any): Promise<WalletModalResult> {
  const starknetKit = await loadStarknetKit();

  if (!starknetKit) {
    return err(
      'MODAL_NOT_AVAILABLE',
      'StarknetKit is not installed. Run: npm install starknetkit',
    );
  }

  try {
    const { connect } = starknetKit;

    const connection = await connect({
      modalMode: 'alwaysAsk',
      ...(options.walletIds ? { include: options.walletIds } : {}),
    });

    if (!connection?.wallet) {
      return err('USER_REJECTED', 'User rejected the connection request');
    }

    // StarknetKit's wallet object satisfies StarknetWindowObject
    const swo = connection.wallet as StarknetWindowObject;
    const address = resolveAddress(swo);
    if (!address) {
      return err('NO_WALLET_FOUND', 'No account found in wallet');
    }

    return ok({
      swo,
      transport: httpTransport(options.rpcUrl),
      walletId: swo.id ?? 'unknown',
      address,
      chainId: options.chainId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('CONNECTION_FAILED', message);
  }
}

async function connectWithGetStarknet(options: any): Promise<WalletModalResult> {
  const getStarknet = await loadGetStarknet();

  if (!getStarknet) {
    return err(
      'MODAL_NOT_AVAILABLE',
      'get-starknet is not installed. Run: npm install get-starknet',
    );
  }

  try {
    const { connect } = getStarknet;

    const swo = (await connect({
      modalMode: 'alwaysAsk',
      ...(options.walletIds ? { include: options.walletIds } : {}),
    })) as StarknetWindowObject | null;

    if (!swo) {
      return err('USER_REJECTED', 'User rejected the connection request');
    }

    // get-starknet may require explicit enable
    if ('enable' in swo && typeof (swo as any).enable === 'function') {
      await (swo as any).enable();
    }

    const address = resolveAddress(swo);
    if (!address) {
      return err('NO_WALLET_FOUND', 'No account found in wallet');
    }

    return ok({
      swo,
      transport: httpTransport(options.rpcUrl),
      walletId: swo.id ?? 'unknown',
      address,
      chainId: options.chainId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return err('CONNECTION_FAILED', message);
  }
}

export async function disconnectWalletModal(
  modalProvider: 'starknetkit' | 'get-starknet' = 'starknetkit',
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
