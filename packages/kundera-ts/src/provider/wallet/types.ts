/**
 * Starknet Window Object (SWO)
 *
 * The interface that browser wallet extensions (ArgentX, Braavos)
 * inject into the page. This is the contract between a dapp and a wallet.
 *
 * Wallets inject as `window.starknet_<id>` (e.g. `window.starknet_argentX`).
 * Discovery libraries like get-starknet scan these objects.
 *
 * NOTE: The SWO uses `type` (not `method`) in its request interface.
 * This differs from standard JSON-RPC. Adapters that wrap SWO into a
 * TypedProvider must translate `method` ↔ `type`.
 *
 * @module provider/wallet/types
 */

/**
 * Wallet icon — either a single data URI or separate dark/light variants.
 */
export type WalletIcon = string | { dark: string; light: string };

/**
 * Wallet event types emitted by the SWO.
 */
export type WalletEvent = "accountsChanged" | "networkChanged";

/**
 * Wallet event handler map.
 */
export interface WalletEventMap {
	accountsChanged(accounts: string[]): void;
	networkChanged(chainId: string): void;
}

/**
 * Request argument shape for the SWO.
 *
 * Note: uses `type` field, not `method`.
 * The `type` value is the wallet_* method name (e.g. "wallet_requestAccounts").
 */
export interface WalletRequestArguments {
	readonly type: string;
	readonly params?: unknown;
}

/**
 * Starknet Window Object — the interface wallets must implement.
 *
 * @example
 * ```typescript
 * // Discovery (get-starknet handles this, shown for illustration)
 * const swo = window.starknet_argentX as StarknetWindowObject;
 *
 * // Connect
 * const accounts = await swo.request({ type: "wallet_requestAccounts" });
 *
 * // Execute
 * const result = await swo.request({
 *   type: "wallet_addInvokeTransaction",
 *   params: { calls: [{ contract_address: "0x...", entry_point: "transfer", calldata: ["0x1", "0x2"] }] },
 * });
 * ```
 */
export interface StarknetWindowObject {
	/** Unique wallet identifier (e.g. "argentX", "braavos") */
	id: string;
	/** Human-readable wallet name */
	name: string;
	/** Wallet version string */
	version: string;
	/** Wallet icon (data URI or dark/light pair) */
	icon: WalletIcon;
	/** Send a wallet RPC request */
	request(args: WalletRequestArguments): Promise<unknown>;
	/** Subscribe to wallet events */
	on<E extends WalletEvent>(event: E, handler: WalletEventMap[E]): void;
	/** Unsubscribe from wallet events */
	off<E extends WalletEvent>(event: E, handler: WalletEventMap[E]): void;
}
