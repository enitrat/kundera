/**
 * Provider Request Function
 *
 * Type-safe request function type for JSON-RPC method calls.
 *
 * @module provider/request/RequestFn
 */

import type { RpcMethodNames, RpcMethodReturnType, RpcSchema } from '../RpcSchema.js';
import type { RequestOptions } from './RequestOptions.js';
import type { RequestArguments } from './RequestArguments.js';

export type RequestFn<TRpcSchema extends RpcSchema> = <
  TMethod extends RpcMethodNames<TRpcSchema>,
>(
  args: RequestArguments<TRpcSchema, TMethod>,
  options?: RequestOptions,
) => Promise<RpcMethodReturnType<TRpcSchema, TMethod>>;
