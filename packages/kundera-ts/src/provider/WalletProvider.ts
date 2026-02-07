/**
 * Wallet Provider
 *
 * Starknet wallet provider using a wallet transport (SWO-backed).
 * Implements TypedProvider<WalletRpcSchema> for type-safe wallet RPC calls.
 *
 * @module provider/WalletProvider
 */

import type { JsonRpcRequest, Transport } from "../transport/types.js";
import { isJsonRpcError } from "../transport/types.js";
import type { TypedProvider } from "./TypedProvider.js";
import type { WalletRpcSchema } from "./schemas/WalletRpcSchema.js";
import type {
	StarknetWindowObject,
	WalletEvent,
	WalletEventMap,
} from "./wallet/types.js";

let _requestId = 0;
function nextRequestId(): number {
	return ++_requestId;
}

/**
 * Wallet provider options
 */
export interface WalletProviderOptions {
	/** The wallet transport (from walletTransport(swo)) */
	transport: Transport;
	/** The underlying SWO, for event subscriptions */
	swo: StarknetWindowObject;
}

/**
 * Provider event map for wallet — maps SWO events to provider events.
 */
export type WalletProviderEventMap = {
	accountsChanged(accounts: string[]): void;
	networkChanged(chainId: string): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: (...args: any[]) => void;
};

export class WalletProvider
	implements TypedProvider<WalletRpcSchema, WalletProviderEventMap>
{
	private transport: Transport;
	private swo: StarknetWindowObject;

	constructor(options: WalletProviderOptions) {
		this.transport = options.transport;
		this.swo = options.swo;
	}

	request: TypedProvider<WalletRpcSchema>["request"] = async (args) => {
		const { method, params } = args;
		const normalizedParams: unknown[] | undefined = Array.isArray(params)
			? [...params]
			: params !== undefined
				? [params]
				: undefined;

		const request: JsonRpcRequest = {
			jsonrpc: "2.0",
			id: nextRequestId(),
			method,
		};
		if (normalizedParams !== undefined) {
			request.params = normalizedParams;
		}

		const response = await this.transport.request(request);
		if (isJsonRpcError(response)) {
			throw response.error;
		}
		return response.result as never;
	};

	on<E extends keyof WalletProviderEventMap>(
		event: E,
		listener: WalletProviderEventMap[E],
	): this {
		this.swo.on(event as WalletEvent, listener as WalletEventMap[WalletEvent]);
		return this;
	}

	removeListener<E extends keyof WalletProviderEventMap>(
		event: E,
		listener: WalletProviderEventMap[E],
	): this {
		this.swo.off(event as WalletEvent, listener as WalletEventMap[WalletEvent]);
		return this;
	}
}
