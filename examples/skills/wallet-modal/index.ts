/**
 * Wallet Modal Skill
 *
 * Minimal adapter for StarknetKit/get-starknet modal integrations.
 * Uses peer dependencies + dynamic imports to avoid bundling wallet SDKs.
 */

import { httpTransport, type Transport } from '@kundera-sn/kundera-ts/transport';

// ============================================================================
// Types
// ============================================================================

export interface StarknetWalletProvider {
  id?: string;
  name?: string;
  account?: { address: string };
  selectedAddress?: string;
  request: (args: { type: string; params?: unknown }) => Promise<unknown>;
  enable?: () => Promise<void>;
}

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
  /** Wallet provider instance */
  walletProvider: StarknetWalletProvider;
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
    // @ts-expect-error - Optional peer dependency
    return await import('@starknet-io/starknet-kit');
  } catch {
    return null;
  }
}

async function loadGetStarknet(): Promise<any | null> {
  try {
    // @ts-expect-error - Optional peer dependency
    return await import('get-starknet');
  } catch {
    return null;
  }
}

function resolveAddress(provider: StarknetWalletProvider): string | null {
  return provider.account?.address ?? provider.selectedAddress ?? null;
}

// ============================================================================
// Main API
// ============================================================================

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
      ? 'https://starknet-mainnet.public.blastapi.io'
      : 'https://starknet-sepolia.public.blastapi.io');

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
      'StarknetKit is not installed. Run: npm install @starknet-io/starknet-kit',
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

    const walletProvider = connection.wallet as StarknetWalletProvider;
    const address = resolveAddress(walletProvider);
    if (!address) {
      return err('NO_WALLET_FOUND', 'No account found in wallet');
    }

    return ok({
      walletProvider,
      transport: httpTransport(options.rpcUrl),
      walletId: walletProvider.id ?? 'unknown',
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

    const wallet = (await connect({
      modalMode: 'alwaysAsk',
      ...(options.walletIds ? { include: options.walletIds } : {}),
    })) as StarknetWalletProvider | null;

    if (!wallet) {
      return err('USER_REJECTED', 'User rejected the connection request');
    }

    if (wallet.enable) {
      await wallet.enable();
    }

    const address = resolveAddress(wallet);
    if (!address) {
      return err('NO_WALLET_FOUND', 'No account found in wallet');
    }

    return ok({
      walletProvider: wallet,
      transport: httpTransport(options.rpcUrl),
      walletId: wallet.id ?? 'unknown',
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
