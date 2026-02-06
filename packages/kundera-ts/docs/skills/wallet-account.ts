/**
 * Wallet Account Skill
 *
 * Execute transactions through a browser wallet (ArgentX, Braavos).
 * Reads go to an RPC node. Writes delegate to the wallet via wallet_* RPC.
 *
 * Uses kundera's wallet primitives:
 * - StarknetWindowObject (provider/wallet/types)
 * - WalletRpc.* request builders (jsonrpc/wallet)
 * - WalletRpcSchema (provider/schemas)
 */

import { WalletRpc } from '@kundera-sn/kundera-ts/jsonrpc';
import type { Transport } from '@kundera-sn/kundera-ts/transport';
import type {
  StarknetWindowObject,
  WalletRequestArguments,
  WalletTypedData,
  WalletCall,
} from '@kundera-sn/kundera-ts/provider';

// ============================================================================
// Types
// ============================================================================

/** A call in the dapp's format (camelCase). */
export interface Call {
  contractAddress: string;
  entrypoint: string;
  calldata?: string[];
}

export interface WalletAccountOptions {
  /** The StarknetWindowObject from get-starknet or window.starknet_* */
  swo: StarknetWindowObject;
  /** Transport for read-only RPC calls (reads go to the node, not the wallet) */
  transport: Transport;
}

export interface WalletAccount {
  /** Connected account address */
  address: string | null;
  /** Request accounts from the wallet */
  connect(options?: { silent_mode?: boolean }): Promise<string[]>;
  /** Get chain ID from the wallet */
  chainId(): Promise<string>;
  /** Execute invoke transaction through the wallet */
  execute(calls: Call | Call[]): Promise<{ transaction_hash: string }>;
  /** Sign SNIP-12 typed data through the wallet */
  signTypedData(typedData: WalletTypedData): Promise<string[]>;
  /** Read-only: call a contract via the RPC node */
  call(fnCall: { contract_address: string; entry_point_selector: string; calldata: string[] }, blockId?: string): Promise<string[]>;
}

// ============================================================================
// SWO Adapter
// ============================================================================

/**
 * Translate a `{ method, params }` request builder result into
 * the SWO's `{ type, params }` format and send it.
 */
async function swoRequest<T>(swo: StarknetWindowObject, req: { method: string; params?: unknown[] | unknown }): Promise<T> {
  // SWO expects { type, params } — flatten the params array for non-array params
  const args: WalletRequestArguments = {
    type: req.method,
    params: Array.isArray(req.params) ? req.params[0] : req.params,
  };
  return swo.request(args) as Promise<T>;
}

/** Send a read request through the transport (RPC node). */
async function nodeRequest<T>(transport: Transport, req: { method: string; params?: unknown[] }): Promise<T> {
  const response = await transport.request({
    jsonrpc: '2.0',
    id: 1,
    method: req.method,
    params: req.params ?? [],
  });
  if ('error' in response) throw new Error(response.error.message);
  return response.result as T;
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Create a wallet account that delegates write operations to the wallet
 * and read operations to an RPC node.
 *
 * @example
 * ```ts
 * import { createWalletAccount } from './skills/wallet-account';
 * import { httpTransport } from '@kundera-sn/kundera-ts/transport';
 *
 * // swo comes from get-starknet, starknetkit, or window.starknet_argentX
 * const account = createWalletAccount({
 *   swo,
 *   transport: httpTransport('https://starknet-mainnet.public.blastapi.io'),
 * });
 *
 * const accounts = await account.connect();
 * const { transaction_hash } = await account.execute({
 *   contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
 *   entrypoint: 'transfer',
 *   calldata: ['0x123', '0x456', '0x0'],
 * });
 * ```
 */
export function createWalletAccount(options: WalletAccountOptions): WalletAccount {
  const { swo, transport } = options;
  let connectedAddress: string | null = null;

  return {
    get address() {
      return connectedAddress;
    },

    async connect(connectOptions) {
      const accounts = await swoRequest<string[]>(
        swo,
        WalletRpc.RequestAccountsRequest(connectOptions),
      );
      connectedAddress = accounts[0] ?? null;
      return accounts;
    },

    async chainId() {
      return swoRequest<string>(swo, WalletRpc.RequestChainIdRequest());
    },

    async execute(calls) {
      const callsArray = Array.isArray(calls) ? calls : [calls];

      // Translate camelCase dapp format → snake_case wallet API format
      const walletCalls: WalletCall[] = callsArray.map((c) => ({
        contract_address: c.contractAddress,
        entry_point: c.entrypoint,
        calldata: c.calldata ?? [],
      }));

      return swoRequest<{ transaction_hash: string }>(
        swo,
        WalletRpc.AddInvokeTransactionRequest(walletCalls),
      );
    },

    async signTypedData(typedData) {
      return swoRequest<string[]>(
        swo,
        WalletRpc.SignTypedDataRequest(typedData),
      );
    },

    async call(fnCall, blockId = 'pending') {
      return nodeRequest<string[]>(transport, {
        method: 'starknet_call',
        params: [fnCall, blockId],
      });
    },
  };
}

// ============================================================================
// Event Helpers
// ============================================================================

/**
 * Subscribe to account changes from the wallet.
 * Returns an unsubscribe function.
 */
export function onAccountsChanged(
  swo: StarknetWindowObject,
  handler: (accounts: string[]) => void,
): () => void {
  swo.on('accountsChanged', handler);
  return () => swo.off('accountsChanged', handler);
}

/**
 * Subscribe to network changes from the wallet.
 * Returns an unsubscribe function.
 */
export function onNetworkChanged(
  swo: StarknetWindowObject,
  handler: (chainId: string) => void,
): () => void {
  swo.on('networkChanged', handler);
  return () => swo.off('networkChanged', handler);
}
