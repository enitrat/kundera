/**
 * Wallet Transport
 *
 * Adapts a Starknet Window Object (SWO) into a JSON-RPC Transport.
 * The SWO uses `{ type, params }` instead of `{ method, params }`.
 * This transport translates between the two conventions.
 *
 * @module transport/wallet
 */

import type { StarknetWindowObject } from "../provider/wallet/types.js";
import type {
	Transport,
	JsonRpcRequest,
	JsonRpcResponse,
	TransportRequestOptions,
} from "./types.js";
import { JsonRpcErrorCode, createErrorResponse } from "./types.js";

const withTimeout = async <T>(
	promise: Promise<T>,
	timeoutMs: number | undefined,
): Promise<T> => {
	if (timeoutMs === undefined) {
		return promise;
	}

	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	return await new Promise<T>((resolve, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`Request timeout after ${timeoutMs}ms`));
		}, timeoutMs);

		promise.then(resolve, reject);
	}).finally(() => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
	});
};

/**
 * Create a wallet transport that routes JSON-RPC requests through a
 * Starknet Window Object (browser wallet extension).
 *
 * Translates standard JSON-RPC `{ method, params }` into the SWO's
 * `{ type, params }` convention and wraps the response back into
 * a JSON-RPC 2.0 envelope.
 *
 * @example
 * ```ts
 * import { walletTransport } from '@kundera-sn/kundera-ts/transport';
 * import { WalletRpc } from '@kundera-sn/kundera-ts/jsonrpc';
 *
 * const transport = walletTransport(swo);
 * const response = await transport.request({
 *   jsonrpc: '2.0',
 *   id: 1,
 *   method: 'wallet_requestAccounts',
 *   params: [],
 * });
 * ```
 */
export function walletTransport(swo: StarknetWindowObject): Transport {
	return {
		type: "custom",

		async request<T>(
			request: JsonRpcRequest,
			options?: TransportRequestOptions,
		): Promise<JsonRpcResponse<T>> {
			const id = request.id ?? null;

			try {
				// SWO expects { type, params } — flatten single-element arrays
				// since wallet methods take a single object param, not an array.
				const params = Array.isArray(request.params) && request.params.length === 1
					? request.params[0]
					: Array.isArray(request.params) && request.params.length === 0
						? undefined
						: request.params;

				const result = await withTimeout(
					swo.request({
						type: request.method,
						params,
					}),
					options?.timeout,
				);

				return {
					jsonrpc: "2.0",
					id,
					result: result as T,
				};
			} catch (error) {
				return createErrorResponse(
					id,
					JsonRpcErrorCode.InternalError,
					error instanceof Error ? error.message : "Wallet request failed",
					error,
				) as JsonRpcResponse<T>;
			}
		},

		async requestBatch<T>(
			requests: JsonRpcRequest[],
			options?: TransportRequestOptions,
		): Promise<JsonRpcResponse<T>[]> {
			// Wallets don't support batch — execute sequentially
			return Promise.all(
				requests.map((req) => this.request<T>(req, options)),
			);
		},
	};
}
