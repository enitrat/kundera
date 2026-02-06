/**
 * WebSocket Provider
 *
 * Starknet JSON-RPC provider using WebSocket transport with native subscriptions.
 *
 * @module provider/WebSocketProvider
 */

import type { Provider } from "./Provider.js";
import type {
	ProviderEvent,
	ProviderEventMap,
	ProviderEvents,
	RequestArguments,
	RequestOptions,
	Response,
	RpcError,
} from "./types.js";
import type {
	NewHeadsSubscriptionParams,
	EventsSubscriptionParams,
	PendingTransactionsSubscriptionParams,
	TransactionReceiptsSubscriptionParams,
} from "../jsonrpc/types.js";
import { isJsonRpcError } from "../transport/types.js";
let _requestId = 0;
function nextRequestId(): number {
	return ++_requestId;
}
import type { JsonRpcRequest } from "../transport/types.js";
import {
	webSocketTransport,
	type WebSocketTransport,
	type WebSocketTransportOptions,
} from "../transport/websocket.js";

/**
 * WebSocket configuration options
 */
export interface WebSocketProviderOptions extends WebSocketTransportOptions {
	/** WebSocket endpoint URL */
	url: string;
	/** Default retry attempts */
	retry?: number;
	/** Default retry delay in ms */
	retryDelay?: number;
}

export class WebSocketProvider implements Provider {
	private transport: WebSocketTransport;
	private defaultTimeout: number;
	private defaultRetryCount: number;
	private defaultRetryDelay: number;
	private eventListeners: Map<
		ProviderEvent,
		Set<ProviderEventMap[ProviderEvent]>
	> = new Map();

	constructor(options: WebSocketProviderOptions | string) {
		if (typeof options === "string") {
			this.transport = webSocketTransport(options);
			this.defaultTimeout = 30000;
			this.defaultRetryCount = 3;
			this.defaultRetryDelay = 1000;
		} else {
			const { url, retry, retryDelay, ...transportOptions } = options;
			this.transport = webSocketTransport(url, transportOptions);
			this.defaultTimeout = transportOptions.timeout ?? 30000;
			this.defaultRetryCount = retry ?? 3;
			this.defaultRetryDelay = retryDelay ?? 1000;
		}

		this.transport.on("connect", () => {
			this.executeRequest<string>("starknet_chainId", [])
				.then((response) => {
					if (response.result) {
						this.emit("connect", { chainId: response.result });
					}
				})
				.catch(() => {
					// Ignore chainId errors on connect
				});
		});

		this.transport.on("disconnect", (error) => {
			this.emit("disconnect", {
				code: -32603,
				message: error?.message ?? "WebSocket disconnected",
			});
		});

		this.transport.on("message", (data) => {
			this.emit("message", { type: "starknet_subscription", data });
		});
	}

	async connect(): Promise<void> {
		await this.transport.connect();
	}

	disconnect(): void {
		this.transport.close();
	}

	private async executeRequest<T>(
		method: string,
		params?: unknown[] | Record<string, unknown>,
		options?: RequestOptions,
	): Promise<Response<T>> {
		const retryCount = options?.retryCount ?? this.defaultRetryCount;
		const retryDelay = options?.retryDelay ?? this.defaultRetryDelay;
		const timeout = options?.timeout ?? this.defaultTimeout;

		let lastError: RpcError | undefined;

		for (let attempt = 0; attempt <= retryCount; attempt++) {
			try {
				const request: JsonRpcRequest = {
					jsonrpc: "2.0",
					id: nextRequestId(),
					method,
				};
				if (params !== undefined) {
					request.params = params;
				}
				const response = await this.transport.request<T>(request, { timeout });
				if (isJsonRpcError(response)) {
					lastError = response.error;
				} else {
					return { result: response.result };
				}
			} catch (error) {
				lastError = {
					code: -32603,
					message: error instanceof Error ? error.message : "Request failed",
				};
			}

			if (attempt < retryCount) {
				await new Promise((resolve) => setTimeout(resolve, retryDelay));
			}
		}

		return { error: lastError ?? { code: -32603, message: "Request failed" } };
	}

	async request(args: RequestArguments): Promise<unknown> {
		const { method, params } = args;
		const normalizedParams: unknown[] | Record<string, unknown> | undefined =
			Array.isArray(params) ? [...params] : params;
		const response = await this.executeRequest(method, normalizedParams);
		if (response.error) {
			throw response.error;
		}
		return response.result;
	}

	on<E extends ProviderEvent>(event: E, listener: ProviderEventMap[E]): this {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners
			.get(event)
			?.add(listener as ProviderEventMap[ProviderEvent]);
		return this;
	}

	removeListener<E extends ProviderEvent>(
		event: E,
		listener: ProviderEventMap[E],
	): this {
		this.eventListeners
			.get(event)
			?.delete(listener as ProviderEventMap[ProviderEvent]);
		return this;
	}

	protected emit<E extends ProviderEvent>(
		event: E,
		...args: Parameters<ProviderEventMap[E]>
	): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => {
				(listener as (...eventArgs: Parameters<ProviderEventMap[E]>) => void)(
					...args,
				);
			});
		}
	}

	private async subscribeRaw(
		method: string,
		params: unknown[] = [],
	): Promise<string> {
		const response = await this.executeRequest<string>(method, params);
		if (response.error) {
			throw response.error;
		}
		return response.result as string;
	}

	private async unsubscribeRaw(subscriptionId: string): Promise<void> {
		await this.executeRequest<boolean>("starknet_unsubscribe", [
			subscriptionId,
		]);
	}

	private async *createSubscriptionStream<T>(
		subscribe: () => Promise<string>,
	): AsyncGenerator<T, void, unknown> {
		const subscriptionId = await subscribe();
		const queue: T[] = [];
		let resolve: ((value: T) => void) | null = null;

		const callback = (data: T) => {
			if (resolve) {
				resolve(data);
				resolve = null;
			} else {
				queue.push(data);
			}
		};

		this.transport.subscribe(
			subscriptionId,
			callback as (data: unknown) => void,
		);

		try {
			while (true) {
				if (queue.length > 0) {
					yield queue.shift() as T;
				} else {
					yield await new Promise<T>((r) => {
						resolve = r;
					});
				}
			}
		} finally {
			this.transport.unsubscribe(
				subscriptionId,
				callback as (data: unknown) => void,
			);
			await this.unsubscribeRaw(subscriptionId).catch(() => {});
		}
	}

	// ==========================================================================
	// Events (Native WebSocket subscriptions)
	// ==========================================================================

	events: ProviderEvents = {
		newHeads: (params?: NewHeadsSubscriptionParams) =>
			this.createSubscriptionStream(() =>
				this.subscribeRaw(
					"starknet_subscribeNewHeads",
					params?.block_id ? [params.block_id] : [],
				),
			),

		events: (params?: EventsSubscriptionParams) =>
			this.createSubscriptionStream(() => {
				const requestParams: unknown[] = [];
				if (params) {
					requestParams.push(params.from_address ?? null);
					requestParams.push(params.keys ?? null);
					requestParams.push(params.block_id ?? null);
					if (params.finality_status !== undefined) {
						requestParams.push(params.finality_status);
					}
				}
				return this.subscribeRaw("starknet_subscribeEvents", requestParams);
			}),

		pendingTransactions: (params?: PendingTransactionsSubscriptionParams) =>
			this.createSubscriptionStream(() => {
				const requestParams: unknown[] = [];
				if (params) {
					requestParams.push(params.finality_status ?? null);
					if (params.sender_address !== undefined) {
						requestParams.push(params.sender_address);
					}
				}
				return this.subscribeRaw(
					"starknet_subscribeNewTransactions",
					requestParams,
				);
			}),

		transactionReceipts: (params?: TransactionReceiptsSubscriptionParams) =>
			this.createSubscriptionStream(() => {
				const requestParams: unknown[] = [];
				if (params) {
					requestParams.push(params.finality_status ?? null);
					if (params.sender_address !== undefined) {
						requestParams.push(params.sender_address);
					}
				}
				return this.subscribeRaw(
					"starknet_subscribeNewTransactionReceipts",
					requestParams,
				);
			}),

		transactionStatus: (transactionHash: string) =>
			this.createSubscriptionStream(() =>
				this.subscribeRaw("starknet_subscribeTransactionStatus", [
					transactionHash,
				]),
			),
	};
}
