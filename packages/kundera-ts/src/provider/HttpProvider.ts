/**
 * HTTP Provider
 *
 * Starknet JSON-RPC provider using HTTP transport.
 *
 * @module provider/HttpProvider
 */

import { httpTransport } from "../transport/http.js";
import type { JsonRpcRequest, Transport } from "../transport/types.js";
let _requestId = 0;
function nextRequestId(): number {
	return ++_requestId;
}
import { isJsonRpcError } from "../transport/types.js";
import type { TypedProvider } from "./TypedProvider.js";
import type { StarknetRpcSchema } from "./schemas/StarknetRpcSchema.js";
import type {
	ProviderEvent,
	ProviderEventMap,
	RequestOptions,
	Response,
	RpcError,
} from "./types.js";

/**
 * HTTP configuration options
 */
export interface HttpProviderOptions {
	/** JSON-RPC endpoint URL */
	url: string;
	/** Optional HTTP headers */
	headers?: Record<string, string>;
	/** Default request timeout in ms */
	timeout?: number;
	/** Default retry attempts */
	retry?: number;
	/** Default retry delay in ms */
	retryDelay?: number;
}

export class HttpProvider implements TypedProvider<StarknetRpcSchema> {
	private transport: Transport;
	private defaultTimeout: number;
	private defaultRetryCount: number;
	private defaultRetryDelay: number;
	private eventListeners: Map<
		ProviderEvent,
		Set<ProviderEventMap[ProviderEvent]>
	> = new Map();

	constructor(options: HttpProviderOptions | string) {
		if (typeof options === "string") {
			this.transport = httpTransport(options, { timeout: 30000 });
			this.defaultTimeout = 30000;
			this.defaultRetryCount = 3;
			this.defaultRetryDelay = 1000;
		} else {
			const transportOptions: { timeout: number; fetchOptions?: RequestInit } =
				{
					timeout: options.timeout ?? 30000,
				};
			if (options.headers) {
				transportOptions.fetchOptions = { headers: options.headers };
			}
			this.transport = httpTransport(options.url, transportOptions);
			this.defaultTimeout = options.timeout ?? 30000;
			this.defaultRetryCount = options.retry ?? 3;
			this.defaultRetryDelay = options.retryDelay ?? 1000;
		}
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

	request: TypedProvider<StarknetRpcSchema>["request"] = async (args) => {
		const { method, params } = args;
		const normalizedParams: unknown[] | Record<string, unknown> | undefined =
			Array.isArray(params) ? [...params] : params;
		const response = await this.executeRequest(method, normalizedParams);
		if (response.error) {
			throw response.error;
		}
		return response.result as never;
	};

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
}
