/**
 * HTTP Provider
 *
 * Starknet JSON-RPC provider using HTTP transport.
 * Thin adapter over httpTransport - delegates all request logic to transport layer.
 *
 * @module provider/HttpProvider
 */

import type { Provider } from './Provider.js';
import type {
  BlockId,
  FeeEstimate,
  FunctionCall,
  MessageFeeEstimate,
  ProviderEvent,
  ProviderEventListener,
  ProviderEventMap,
  RequestArguments,
  RequestOptions,
  Response,
  SimulationFlag,
  SyncingStatus,
} from './types.js';
import {
  httpTransport,
  type Transport,
  type HttpTransportOptions,
  isJsonRpcError,
  createRequest,
} from '../transport/index.js';

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
  /** Enable request batching */
  batch?: boolean | { batchWait?: number; batchSize?: number };
}

/**
 * HTTP Provider implementation
 *
 * Starknet JSON-RPC provider using HTTP transport.
 * Thin adapter that delegates to httpTransport.
 *
 * @example
 * ```typescript
 * const provider = new HttpProvider({
 *   url: 'https://starknet-mainnet.example.com',
 *   timeout: 30000
 * });
 *
 * const blockNumber = await provider.request({
 *   method: 'starknet_blockNumber',
 *   params: []
 * });
 * ```
 */
export class HttpProvider implements Provider {
  private transport: Transport;
  private eventListeners: Map<ProviderEvent, Set<ProviderEventListener>> =
    new Map();

  constructor(options: HttpProviderOptions | string) {
    const opts: HttpProviderOptions =
      typeof options === 'string' ? { url: options } : options;

    // Create transport with mapped options
    const transportOpts: HttpTransportOptions = {
      timeout: opts.timeout ?? 30000,
      retries: opts.retry ?? 3,
      retryDelay: opts.retryDelay ?? 1000,
      batch: opts.batch,
      fetchOptions: opts.headers
        ? { headers: opts.headers }
        : undefined,
    };

    this.transport = httpTransport(opts.url, transportOpts);
  }

  /**
   * Get the underlying transport (for advanced use)
   */
  getTransport(): Transport {
    return this.transport;
  }

  /**
   * EIP-1193-like request method (throws on error)
   */
  async request(args: RequestArguments): Promise<unknown> {
    const request = createRequest(
      args.method,
      args.params as unknown[] | undefined,
    );
    const response = await this.transport.request(request);

    if (isJsonRpcError(response)) {
      throw response.error;
    }

    return response.result;
  }

  /**
   * Internal request method that returns Response<T> (non-throwing)
   */
  private async _request<T>(
    method: string,
    params: unknown[] = [],
    options?: RequestOptions,
  ): Promise<Response<T>> {
    const request = createRequest(method, params);
    const response = await this.transport.request<T>(request, {
      timeout: options?.timeout,
      retries: options?.retry,
      retryDelay: options?.retryDelay,
    });

    if (isJsonRpcError(response)) {
      return { error: response.error };
    }

    return { result: response.result };
  }

  /**
   * Register event listener
   */
  on<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void,
  ): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(listener as ProviderEventListener);
    return this;
  }

  /**
   * Remove event listener
   */
  removeListener<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void,
  ): this {
    this.eventListeners.get(event)?.delete(listener as ProviderEventListener);
    return this;
  }

  /**
   * Emit event to all listeners (internal use)
   */
  protected emit<E extends ProviderEvent>(
    event: E,
    ...args: ProviderEventMap[E]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }

  // ============================================================================
  // Read Methods (starknet_api_openrpc.json)
  // ============================================================================

  starknet_specVersion(options?: RequestOptions) {
    return this._request<string>('starknet_specVersion', [], options);
  }

  starknet_getBlockWithTxHashes(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getBlockWithTxHashes',
      [blockId],
      options,
    );
  }

  starknet_getBlockWithTxs(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getBlockWithTxs',
      [blockId],
      options,
    );
  }

  starknet_getBlockWithReceipts(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getBlockWithReceipts',
      [blockId],
      options,
    );
  }

  starknet_getStateUpdate(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getStateUpdate',
      [blockId],
      options,
    );
  }

  starknet_getStorageAt(
    contractAddress: string,
    key: string,
    blockId: BlockId,
    options?: RequestOptions,
  ) {
    return this._request<string>(
      'starknet_getStorageAt',
      [contractAddress, key, blockId],
      options,
    );
  }

  starknet_getTransactionStatus(txHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getTransactionStatus',
      [txHash],
      options,
    );
  }

  starknet_getMessagesStatus(l1TxHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getMessagesStatus',
      [l1TxHash],
      options,
    );
  }

  starknet_getTransactionByHash(txHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getTransactionByHash',
      [txHash],
      options,
    );
  }

  starknet_getTransactionByBlockIdAndIndex(
    blockId: BlockId,
    index: number,
    options?: RequestOptions,
  ) {
    return this._request<unknown>(
      'starknet_getTransactionByBlockIdAndIndex',
      [blockId, index],
      options,
    );
  }

  starknet_getTransactionReceipt(txHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getTransactionReceipt',
      [txHash],
      options,
    );
  }

  starknet_getClass(blockId: BlockId, classHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getClass',
      [blockId, classHash],
      options,
    );
  }

  starknet_getClassHashAt(
    blockId: BlockId,
    contractAddress: string,
    options?: RequestOptions,
  ) {
    return this._request<string>(
      'starknet_getClassHashAt',
      [blockId, contractAddress],
      options,
    );
  }

  starknet_getClassAt(
    blockId: BlockId,
    contractAddress: string,
    options?: RequestOptions,
  ) {
    return this._request<unknown>(
      'starknet_getClassAt',
      [blockId, contractAddress],
      options,
    );
  }

  starknet_getBlockTransactionCount(blockId: BlockId, options?: RequestOptions) {
    return this._request<number>(
      'starknet_getBlockTransactionCount',
      [blockId],
      options,
    );
  }

  starknet_call(
    request: FunctionCall,
    blockId: BlockId,
    options?: RequestOptions,
  ) {
    return this._request<string[]>('starknet_call', [request, blockId], options);
  }

  starknet_estimateFee(
    request: unknown[],
    simulationFlags: SimulationFlag[],
    blockId: BlockId,
    options?: RequestOptions,
  ) {
    return this._request<FeeEstimate[]>(
      'starknet_estimateFee',
      [request, simulationFlags, blockId],
      options,
    );
  }

  starknet_estimateMessageFee(
    message: unknown,
    blockId: BlockId,
    options?: RequestOptions,
  ) {
    return this._request<MessageFeeEstimate>(
      'starknet_estimateMessageFee',
      [message, blockId],
      options,
    );
  }

  starknet_blockNumber(options?: RequestOptions) {
    return this._request<number>('starknet_blockNumber', [], options);
  }

  starknet_blockHashAndNumber(options?: RequestOptions) {
    return this._request<{ block_hash: string; block_number: number }>(
      'starknet_blockHashAndNumber',
      [],
      options,
    );
  }

  starknet_chainId(options?: RequestOptions) {
    return this._request<string>('starknet_chainId', [], options);
  }

  starknet_syncing(options?: RequestOptions) {
    return this._request<SyncingStatus>('starknet_syncing', [], options);
  }

  starknet_getEvents(
    filter: {
      from_block?: BlockId;
      to_block?: BlockId;
      address?: string;
      keys?: string[][];
      continuation_token?: string;
      chunk_size: number;
    },
    options?: RequestOptions,
  ) {
    return this._request<{
      events: unknown[];
      continuation_token?: string;
    }>('starknet_getEvents', [filter], options);
  }

  starknet_getNonce(
    blockId: BlockId,
    contractAddress: string,
    options?: RequestOptions,
  ) {
    return this._request<string>(
      'starknet_getNonce',
      [blockId, contractAddress],
      options,
    );
  }

  starknet_getStorageProof(
    blockId: BlockId,
    classHashes: string[],
    contractAddresses: string[],
    contractStorageKeys: { contract_address: string; storage_keys: string[] }[],
    options?: RequestOptions,
  ) {
    return this._request<unknown>(
      'starknet_getStorageProof',
      [blockId, classHashes, contractAddresses, contractStorageKeys],
      options,
    );
  }

  // ============================================================================
  // Write Methods (starknet_write_api.json)
  // ============================================================================

  starknet_addInvokeTransaction(
    invokeTransaction: unknown,
    options?: RequestOptions,
  ) {
    return this._request<{ transaction_hash: string }>(
      'starknet_addInvokeTransaction',
      [invokeTransaction],
      options,
    );
  }

  starknet_addDeclareTransaction(
    declareTransaction: unknown,
    options?: RequestOptions,
  ) {
    return this._request<{ transaction_hash: string; class_hash: string }>(
      'starknet_addDeclareTransaction',
      [declareTransaction],
      options,
    );
  }

  starknet_addDeployAccountTransaction(
    deployAccountTransaction: unknown,
    options?: RequestOptions,
  ) {
    return this._request<{ transaction_hash: string; contract_address: string }>(
      'starknet_addDeployAccountTransaction',
      [deployAccountTransaction],
      options,
    );
  }

  // ============================================================================
  // Trace Methods (starknet_trace_api_openrpc.json)
  // ============================================================================

  starknet_traceTransaction(txHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_traceTransaction',
      [txHash],
      options,
    );
  }

  starknet_simulateTransactions(
    blockId: BlockId,
    transactions: unknown[],
    simulationFlags: SimulationFlag[],
    options?: RequestOptions,
  ) {
    return this._request<unknown[]>(
      'starknet_simulateTransactions',
      [blockId, transactions, simulationFlags],
      options,
    );
  }

  starknet_traceBlockTransactions(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown[]>(
      'starknet_traceBlockTransactions',
      [blockId],
      options,
    );
  }
}
