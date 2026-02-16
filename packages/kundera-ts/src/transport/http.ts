/**
 * HTTP Transport
 *
 * Minimal JSON-RPC transport over HTTP.
 *
 * @module transport/http
 */

import {
	JsonRpcErrorCode,
	type JsonRpcRequest,
	type JsonRpcResponse,
	type Transport,
	type TransportRequestOptions,
	createErrorResponse,
	matchBatchResponses,
} from "./types.js";

// ============ HTTP Transport Options ============

/**
 * HTTP transport configuration
 */
export interface HttpTransportOptions {
	/** Custom fetch options (headers, credentials, etc.) */
	fetchOptions?: RequestInit;
	/** Request timeout in ms (default: 30000) */
	timeout?: number;
}

// ============ HTTP Transport Implementation ============

/**
 * Create an HTTP transport for JSON-RPC communication
 *
 * @example
 * ```ts
 * const transport = httpTransport('https://starknet.example.com');
 * ```
 */
export function httpTransport(
	url: string,
	options: HttpTransportOptions = {},
): Transport {
	const { fetchOptions = {}, timeout = 30000 } = options;
	let requestIdCounter = 0;

	/**
	 * Execute HTTP request with timeout
	 */
	async function executeRequest(
		body: string,
		requestTimeout: number,
		signal?: AbortSignal,
	): Promise<unknown> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

		// Combine external signal with timeout signal
		const combinedSignal = signal
			? AbortSignal.any([signal, controller.signal])
			: controller.signal;

		try {
			const response = await fetch(url, {
				method: "POST",
				...fetchOptions,
				headers: {
					"Content-Type": "application/json",
					...fetchOptions.headers,
				},
				body,
				signal: combinedSignal,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.json();
		} finally {
			clearTimeout(timeoutId);
		}
	}

	return {
		type: "http",

		async request<T>(
			request: JsonRpcRequest,
			options?: TransportRequestOptions,
		): Promise<JsonRpcResponse<T>> {
			// Ensure request has an id
			const requestWithId: JsonRpcRequest = {
				...request,
				id: request.id ?? ++requestIdCounter,
			};

			const body = JSON.stringify(requestWithId);
			try {
				const result = await executeRequest(
					body,
					options?.timeout ?? timeout,
					options?.signal,
				);
				return result as unknown as JsonRpcResponse<T>;
			} catch (error) {
				return createErrorResponse(
					requestWithId.id ?? null,
					JsonRpcErrorCode.InternalError,
					(error as Error).message,
				) as JsonRpcResponse<T>;
			}
		},

		async requestBatch<T>(
			requests: JsonRpcRequest[],
			options?: TransportRequestOptions,
		): Promise<JsonRpcResponse<T>[]> {
			if (requests.length === 0) return [];

			// Ensure all requests have ids
			const requestsWithIds = requests.map((req) => ({
				...req,
				id: req.id ?? ++requestIdCounter,
			}));

			const body = JSON.stringify(requestsWithIds);

			try {
				const result = await executeRequest(
					body,
					options?.timeout ?? timeout,
					options?.signal,
				);
				const responses = result as unknown as JsonRpcResponse<T>[];
				return matchBatchResponses(requestsWithIds, responses);
			} catch (error) {
				// Return error for all requests
				return requestsWithIds.map(
					(req) =>
						createErrorResponse(
							req.id ?? null,
							JsonRpcErrorCode.InternalError,
							(error as Error).message,
						) as JsonRpcResponse<T>,
				);
			}
		},
	};
}
