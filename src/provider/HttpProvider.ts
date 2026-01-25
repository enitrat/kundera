/**
 * HTTP Provider
 *
 * Starknet JSON-RPC provider using HTTP transport with fetch API.
 * Supports configurable timeout and retries.
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
  RpcError,
  SimulationFlag,
  SyncingStatus,
} from './types.js';

/**
 * JSON-RPC response structure
 */
interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: RpcError;
}

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
}

/**
 * HTTP Provider implementation
 *
 * Starknet JSON-RPC provider using HTTP transport via fetch API.
 * Throws RpcError on failures.
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
  private url: string;
  private headers: Record<string, string>;
  private defaultTimeout: number;
  private defaultRetry: number;
  private defaultRetryDelay: number;
  private requestIdCounter = 0;
  private eventListeners: Map<ProviderEvent, Set<ProviderEventListener>> =
    new Map();

  constructor(options: HttpProviderOptions | string) {
    if (typeof options === 'string') {
      this.url = options;
      this.headers = { 'Content-Type': 'application/json' };
      this.defaultTimeout = 30000;
      this.defaultRetry = 3;
      this.defaultRetryDelay = 1000;
    } else {
      this.url = options.url;
      this.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      this.defaultTimeout = options.timeout ?? 30000;
      this.defaultRetry = options.retry ?? 3;
      this.defaultRetryDelay = options.retryDelay ?? 1000;
    }
  }

  /**
   * Execute single fetch attempt with timeout
   */
  private async executeRequest(
    body: string,
    timeout: number,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error: RpcError = {
          code: -32603,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
        throw error;
      }

      const json = (await response.json()) as JsonRpcResponse;
      if (json.error) {
        throw json.error;
      }
      return json.result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle request error and determine if retry is needed
   */
  private handleRequestError(error: Error, timeout: number): boolean {
    if (error.name === 'AbortError') {
      const timeoutError: RpcError = {
        code: -32603,
        message: `Request timeout after ${timeout}ms`,
      };
      throw timeoutError;
    }
    if ('code' in error && 'message' in error) {
      throw error;
    }
    return true;
  }

  /**
   * EIP-1193-like request method (throws on error)
   */
  async request(args: RequestArguments): Promise<unknown> {
    const { method, params } = args;
    const paramsValue = params ?? [];
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: ++this.requestIdCounter,
      method,
      params: paramsValue,
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.defaultRetry; attempt++) {
      try {
        return await this.executeRequest(body, this.defaultTimeout);
      } catch (error) {
        lastError = error as Error;
        const shouldRetry = this.handleRequestError(
          lastError,
          this.defaultTimeout,
        );
        if (shouldRetry && attempt < this.defaultRetry) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.defaultRetryDelay),
          );
        }
      }
    }

    const networkError: RpcError = {
      code: -32603,
      message: lastError?.message ?? 'Request failed',
    };
    throw networkError;
  }

  /**
   * Internal request method that returns Response<T> (non-throwing)
   */
  private async _request<T>(
    method: string,
    params: unknown[] = [],
    options?: RequestOptions,
  ): Promise<Response<T>> {
    const timeout = options?.timeout ?? this.defaultTimeout;
    const retry = options?.retry ?? this.defaultRetry;
    const retryDelay = options?.retryDelay ?? this.defaultRetryDelay;

    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: ++this.requestIdCounter,
      method,
      params,
    });

    let lastError: RpcError | null = null;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const result = await this.executeRequest(body, timeout);
        return { result: result as T };
      } catch (error) {
        if ('code' in (error as RpcError)) {
          lastError = error as RpcError;
          // Don't retry RPC errors
          break;
        }
        lastError = {
          code: -32603,
          message: (error as Error).message ?? 'Request failed',
        };
        if (attempt < retry) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    return { error: lastError! };
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

  /**
   * Returns the version of the Starknet JSON-RPC specification
   */
  starknet_specVersion(options?: RequestOptions) {
    return this._request<string>('starknet_specVersion', [], options);
  }

  /**
   * Get block with transaction hashes
   */
  starknet_getBlockWithTxHashes(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getBlockWithTxHashes',
      [blockId],
      options,
    );
  }

  /**
   * Get block with full transactions
   */
  starknet_getBlockWithTxs(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getBlockWithTxs',
      [blockId],
      options,
    );
  }

  /**
   * Get block with transaction receipts
   */
  starknet_getBlockWithReceipts(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getBlockWithReceipts',
      [blockId],
      options,
    );
  }

  /**
   * Get state update for a block
   */
  starknet_getStateUpdate(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getStateUpdate',
      [blockId],
      options,
    );
  }

  /**
   * Get storage value at a given key
   */
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

  /**
   * Get the status of a transaction
   */
  starknet_getTransactionStatus(txHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getTransactionStatus',
      [txHash],
      options,
    );
  }

  /**
   * Get the status of L1 to L2 messages
   */
  starknet_getMessagesStatus(l1TxHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getMessagesStatus',
      [l1TxHash],
      options,
    );
  }

  /**
   * Get transaction by hash
   */
  starknet_getTransactionByHash(txHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getTransactionByHash',
      [txHash],
      options,
    );
  }

  /**
   * Get transaction by block ID and index
   */
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

  /**
   * Get transaction receipt
   */
  starknet_getTransactionReceipt(txHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getTransactionReceipt',
      [txHash],
      options,
    );
  }

  /**
   * Get contract class
   */
  starknet_getClass(blockId: BlockId, classHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_getClass',
      [blockId, classHash],
      options,
    );
  }

  /**
   * Get class hash at contract address
   */
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

  /**
   * Get class at contract address
   */
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

  /**
   * Get block transaction count
   */
  starknet_getBlockTransactionCount(blockId: BlockId, options?: RequestOptions) {
    return this._request<number>(
      'starknet_getBlockTransactionCount',
      [blockId],
      options,
    );
  }

  /**
   * Call a contract (read-only)
   */
  starknet_call(
    request: FunctionCall,
    blockId: BlockId,
    options?: RequestOptions,
  ) {
    return this._request<string[]>('starknet_call', [request, blockId], options);
  }

  /**
   * Estimate fee for transactions
   */
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

  /**
   * Estimate fee for L1 to L2 message
   */
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

  /**
   * Get current block number
   */
  starknet_blockNumber(options?: RequestOptions) {
    return this._request<number>('starknet_blockNumber', [], options);
  }

  /**
   * Get block hash and number
   */
  starknet_blockHashAndNumber(options?: RequestOptions) {
    return this._request<{ block_hash: string; block_number: number }>(
      'starknet_blockHashAndNumber',
      [],
      options,
    );
  }

  /**
   * Get chain ID
   */
  starknet_chainId(options?: RequestOptions) {
    return this._request<string>('starknet_chainId', [], options);
  }

  /**
   * Get syncing status
   */
  starknet_syncing(options?: RequestOptions) {
    return this._request<SyncingStatus>('starknet_syncing', [], options);
  }

  /**
   * Get events matching filter
   */
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

  /**
   * Get nonce at address
   */
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

  /**
   * Get storage proof
   */
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

  /**
   * Add invoke transaction
   */
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

  /**
   * Add declare transaction
   */
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

  /**
   * Add deploy account transaction
   */
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

  /**
   * Trace a transaction
   */
  starknet_traceTransaction(txHash: string, options?: RequestOptions) {
    return this._request<unknown>(
      'starknet_traceTransaction',
      [txHash],
      options,
    );
  }

  /**
   * Simulate transactions
   */
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

  /**
   * Trace all transactions in a block
   */
  starknet_traceBlockTransactions(blockId: BlockId, options?: RequestOptions) {
    return this._request<unknown[]>(
      'starknet_traceBlockTransactions',
      [blockId],
      options,
    );
  }
}
