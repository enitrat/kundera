/**
 * Provider Interface
 *
 * Starknet JSON-RPC provider interface, similar to EIP-1193 pattern.
 * Provides single request() method and EventEmitter capabilities.
 *
 * @module provider/Provider
 */

import type {
  ProviderEvent,
  ProviderEventMap,
  RequestArguments,
} from './types.js';

/**
 * Starknet Provider interface for JSON-RPC communication
 *
 * Follows EIP-1193-like pattern:
 * - Single request() method for all RPC calls
 * - EventEmitter for provider events (connect, disconnect, message)
 * - Throws RpcError on failures (does not return error objects)
 *
 * @example
 * ```typescript
 * const provider: Provider = new HttpProvider('https://starknet-mainnet.example.com');
 *
 * // Make requests
 * const blockNumber = await provider.request({
 *   method: 'starknet_blockNumber',
 *   params: []
 * });
 *
 * // Listen to events
 * provider.on('connect', (info) => {
 *   console.log('Connected to chain:', info.chainId);
 * });
 * ```
 */
export interface Provider {
  /**
   * Submit JSON-RPC request to provider
   *
   * @param args - Request arguments containing method and params
   * @returns Promise resolving to the result
   * @throws RpcError on failure
   */
  request(args: RequestArguments): Promise<unknown>;

  /**
   * Register event listener
   *
   * @param event - Event name
   * @param listener - Event listener callback
   * @returns Provider instance for chaining
   */
  on<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void,
  ): this;

  /**
   * Remove event listener
   *
   * @param event - Event name
   * @param listener - Event listener callback to remove
   * @returns Provider instance for chaining
   */
  removeListener<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void,
  ): this;
}
