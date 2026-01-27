/**
 * Typed Provider
 *
 * A type-safe wrapper around any Provider that uses RpcSchema
 * for compile-time type checking of method calls.
 *
 * @module provider/TypedProvider
 */

import type { Provider } from './Provider.js';
import type {
  RpcSchema,
  RpcMethodNames,
  RpcMethodParameters,
  RpcMethodReturnType,
} from './RpcSchema.js';
import type { StarknetRpcSchema } from './StarknetRpcSchema.js';
import type { ProviderEvent, ProviderEventMap, RequestArguments } from './types.js';

/**
 * Typed Provider wraps a base provider with compile-time type safety
 *
 * @example
 * ```typescript
 * const provider = new HttpProvider('https://starknet-mainnet.example.com');
 * const typed = new TypedProvider<StarknetRpcSchema>(provider);
 *
 * // Fully typed - params and return type inferred from schema
 * const blockNumber = await typed.request({
 *   method: 'starknet_blockNumber',
 *   params: []
 * });
 * // blockNumber is typed as number
 *
 * // Type error if params don't match
 * await typed.request({
 *   method: 'starknet_getStorageAt',
 *   params: ['0x1'] // Error: missing key and blockId params
 * });
 * ```
 */
export class TypedProvider<TSchema extends RpcSchema = StarknetRpcSchema>
  implements Provider
{
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  /**
   * Type-safe request method
   *
   * Infers parameter and return types from the schema based on method name.
   * Also compatible with generic Provider.request<T> signature.
   */
  request<TMethod extends RpcMethodNames<TSchema>>(args: {
    method: TMethod;
    params?: RpcMethodParameters<TSchema, TMethod>;
  }): Promise<RpcMethodReturnType<TSchema, TMethod>>;
  request<T>(args: RequestArguments): Promise<T>;
  async request<T>(args: RequestArguments): Promise<T> {
    return this.provider.request<T>(args);
  }

  /**
   * Register event listener
   */
  on<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void,
  ): this {
    this.provider.on(event, listener);
    return this;
  }

  /**
   * Remove event listener
   */
  removeListener<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void,
  ): this {
    this.provider.removeListener(event, listener);
    return this;
  }

  /**
   * Get the underlying provider
   */
  getProvider(): Provider {
    return this.provider;
  }
}

/**
 * Create a typed provider with Starknet RPC schema
 */
export function createTypedProvider(
  provider: Provider,
): TypedProvider<StarknetRpcSchema> {
  return new TypedProvider<StarknetRpcSchema>(provider);
}
