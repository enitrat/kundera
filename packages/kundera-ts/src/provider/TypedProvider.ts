/**
 * Typed Provider Interface
 *
 * Generic, strongly-typed provider interface with RpcSchema support.
 *
 * @module provider/TypedProvider
 */

import type { ProviderEventMap } from "./types.js";
import type { RpcSchema } from "./RpcSchema.js";
import type { RequestFn } from "./request/RequestFn.js";

export interface TypedProvider<
	TRpcSchema extends RpcSchema = RpcSchema,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	TEventMap extends Record<string, (...args: any[]) => void> = ProviderEventMap,
> {
	request: RequestFn<TRpcSchema>;

	on<TEvent extends keyof TEventMap>(
		event: TEvent,
		listener: TEventMap[TEvent],
	): this;

	removeListener<TEvent extends keyof TEventMap>(
		event: TEvent,
		listener: TEventMap[TEvent],
	): this;
}

export type StarknetProvider = TypedProvider<RpcSchema, ProviderEventMap>;
