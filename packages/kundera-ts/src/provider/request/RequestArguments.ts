/**
 * Provider Request Arguments
 *
 * Type-safe request arguments for JSON-RPC method calls.
 *
 * @module provider/request/RequestArguments
 */

import type {
	RpcMethodNames,
	RpcMethodParameters,
	RpcSchema,
} from "../RpcSchema.js";

export interface RequestArguments<
	TRpcSchema extends RpcSchema,
	TMethod extends RpcMethodNames<TRpcSchema> = RpcMethodNames<TRpcSchema>,
> {
	readonly method: TMethod;
	readonly params?: RpcMethodParameters<TRpcSchema, TMethod>;
}
