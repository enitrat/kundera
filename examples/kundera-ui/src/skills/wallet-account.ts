/**
 * Wallet Account Skill
 *
 * Execute transactions through a browser wallet (ArgentX, Braavos).
 * Reads go to an RPC node. Writes delegate to the wallet via WalletProvider.
 *
 * Composes kundera primitives:
 * - walletTransport (transport/wallet) — SWO → Transport adapter
 * - WalletProvider (provider/WalletProvider) — typed wallet_* RPC
 * - WalletRpc.* request builders (jsonrpc/wallet)
 * - AccountExecutor interface from contract-write skill
 */

import { walletTransport } from '@kundera-sn/kundera-ts/transport';
import { WalletProvider } from '@kundera-sn/kundera-ts/provider';
import { Rpc, WalletRpc } from '@kundera-sn/kundera-ts/jsonrpc';
import type { Transport } from '@kundera-sn/kundera-ts/transport';
import type { BlockId, FunctionCall } from '@kundera-sn/kundera-ts/jsonrpc';
import type {
  StarknetWindowObject,
  WalletTypedData,
} from '@kundera-sn/kundera-ts/provider';
import type { Call, UniversalDetails } from '@kundera-sn/kundera-ts/crypto';
import type { AccountExecutor } from './contract-write';

// ============================================================================
// Types
// ============================================================================

export interface WalletAccountOptions {
  /** The StarknetWindowObject from get-starknet or window.starknet_* */
  swo: StarknetWindowObject;
  /** Transport for read-only RPC calls (reads go to the node, not the wallet) */
  transport: Transport;
}

export interface WalletAccount extends AccountExecutor {
  /** Connected account address */
  address: string;
  /** Request accounts from the wallet */
  connect(options?: { silent_mode?: boolean }): Promise<string[]>;
  /** Get chain ID from the wallet */
  chainId(): Promise<string>;
  /** Execute invoke transaction through the wallet */
  execute(calls: Call | Call[], details?: UniversalDetails): Promise<{ transaction_hash: string }>;
  /** Sign SNIP-12 typed data through the wallet */
  signTypedData(typedData: WalletTypedData): Promise<string[]>;
  /** Read-only: call a contract via the RPC node */
  call(fnCall: FunctionCall, blockId?: BlockId): Promise<string[]>;
  /** The typed wallet provider (for advanced use) */
  walletProvider: WalletProvider;
  /** The node transport (for use with readContract / getContract) */
  nodeTransport: Transport;
}

// ============================================================================
// Node Transport Helper
// ============================================================================

/** Send a request-builder result through a transport and unwrap the response. */
async function send<T>(transport: Transport, req: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T> {
  const response = await transport.request({ jsonrpc: '2.0', id: 1, method: req.method, params: req.params ?? [] });
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
 * The returned object implements `AccountExecutor`, so it composes directly
 * with `writeContract()` and `getContract()` from other skills.
 *
 * @example
 * ```ts
 * import { createWalletAccount } from './skills/wallet-account';
 * import { readContract } from './skills/contract-read';
 * import { writeContract } from './skills/contract-write';
 * import { httpTransport } from '@kundera-sn/kundera-ts/transport';
 *
 * // swo comes from get-starknet, starknetkit, or window.starknet_argentX
 * const account = createWalletAccount({
 *   swo,
 *   transport: httpTransport('https://api.zan.top/public/starknet-mainnet'),
 * });
 *
 * await account.connect();
 *
 * // Direct usage
 * const { transaction_hash } = await account.execute({
 *   contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
 *   entrypoint: 'transfer',
 *   calldata: ['0x123', '0x456', '0x0'],
 * });
 *
 * // Compose with contract skills (account satisfies AccountExecutor)
 * await writeContract({
 *   abi: ERC20_ABI,
 *   address: '0x049d...',
 *   functionName: 'transfer',
 *   args: [recipient, amount],
 *   account, // works because WalletAccount extends AccountExecutor
 * });
 *
 * // Reads go through the node transport
 * const balance = await readContract(account.nodeTransport, {
 *   abi: ERC20_ABI,
 *   address: '0x049d...',
 *   functionName: 'balance_of',
 *   args: [account.address],
 * });
 * ```
 */
export function createWalletAccount(options: WalletAccountOptions): WalletAccount {
  const { swo, transport } = options;

  // Wallet provider for typed wallet_* RPC calls
  const wp = new WalletProvider({
    transport: walletTransport(swo),
    swo,
  });

  let connectedAddress = '';

  return {
    get address() {
      return connectedAddress;
    },

    walletProvider: wp,
    nodeTransport: transport,

    async connect(connectOptions) {
      const accounts = await wp.request(
        WalletRpc.RequestAccountsRequest(connectOptions),
      );
      connectedAddress = accounts[0] ?? '';
      return accounts;
    },

    async chainId() {
      return wp.request(WalletRpc.RequestChainIdRequest());
    },

    async execute(calls, _details?) {
      const callsArray = Array.isArray(calls) ? calls : [calls];

      // Translate camelCase dapp format → snake_case wallet API format
      const walletCalls = callsArray.map((c) => ({
        contract_address: c.contractAddress,
        entry_point: c.entrypoint,
        calldata: (c.calldata ?? []).map(String),
      }));

      return wp.request(WalletRpc.AddInvokeTransactionRequest(walletCalls));
    },

    async signTypedData(typedData) {
      return wp.request(WalletRpc.SignTypedDataRequest(typedData));
    },

    async call(fnCall, blockId) {
      return send<string[]>(transport, Rpc.CallRequest(fnCall, blockId));
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
