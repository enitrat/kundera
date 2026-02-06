/**
 * Provider Interface
 *
 * Starknet JSON-RPC provider interface.
 * Provides request() method and EventEmitter capabilities.
 *
 * @module provider/Provider
 */

import type { ProviderEvent, ProviderEventMap } from "./types.js";
import type { RequestArguments } from "./types.js";

export interface Provider {
	/**
	 * Submit JSON-RPC request to provider
	 */
	request(args: RequestArguments): Promise<unknown>;

	/**
	 * Register event listener
	 */
	on<E extends ProviderEvent>(event: E, listener: ProviderEventMap[E]): this;

	/**
	 * Remove event listener
	 */
	removeListener<E extends ProviderEvent>(
		event: E,
		listener: ProviderEventMap[E],
	): this;
}
