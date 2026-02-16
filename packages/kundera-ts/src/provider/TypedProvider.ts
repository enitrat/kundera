/**
 * Typed Provider Interface
 *
 * Generic, strongly-typed provider interface with RpcSchema support.
 *
 * @module provider/TypedProvider
 */

import type { RpcSchema } from "./RpcSchema.js";
import type { RequestFn } from "./request/RequestFn.js";
import type { ProviderEventMap } from "./types.js";

export interface TypedProvider<
	TRpcSchema extends RpcSchema = RpcSchema,
	TEventMap extends Record<
		string,
		(...args: unknown[]) => void
	> = ProviderEventMap,
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
