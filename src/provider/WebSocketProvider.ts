/**
 * WebSocket Provider
 *
 * Starknet JSON-RPC provider using WebSocket transport for real-time
 * bidirectional communication. Supports native pub/sub for events.
 *
 * @module provider/WebSocketProvider
 */

import type { Provider } from './Provider.js';
import type {
  BlockId,
  EmittedEvent,
  EventsSubscriptionParams,
  FeeEstimate,
  FunctionCall,
  MessageFeeEstimate,
  NewHead,
  NewHeadsSubscriptionParams,
  PendingTransaction,
  PendingTransactionsSubscriptionParams,
  ProviderEvent,
  ProviderEventMap,
  ReorgData,
  RequestArguments,
  RequestOptions,
  Response,
  RpcError,
  SimulationFlag,
  StarknetProviderEvents,
  SyncingStatus,
  TransactionReceipt,
  TransactionReceiptsSubscriptionParams,
  TransactionStatusUpdate,
} from './types.js';

/**
 * WebSocket configuration options
 */
export interface WebSocketProviderOptions {
  /** WebSocket endpoint URL */
  url: string;
  /** WebSocket protocols */
  protocols?: string | string[];
  /** Reconnect automatically on disconnect */
  reconnect?: boolean;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
  /** Max reconnect attempts (0 = infinite) */
  maxReconnectAttempts?: number;
}

/**
 * WebSocket Provider implementation
 *
 * Implements Provider interface using WebSocket transport for real-time
 * communication. Supports native pub/sub subscriptions for Starknet events.
 *
 * @example
 * ```typescript
 * const provider = new WebSocketProvider({
 *   url: 'wss://starknet-mainnet.example.com',
 *   reconnect: true
 * });
 *
 * await provider.connect();
 *
 * const blockNumber = await provider.starknet_blockNumber();
 * console.log('Block:', blockNumber.result);
 *
 * // Subscribe to new heads
 * for await (const head of provider.events.newHeads()) {
 *   console.log('New block:', head.block_number);
 * }
 * ```
 */
export class WebSocketProvider implements Provider {
  private url: string;
  private protocols: string | string[] | undefined;
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pending = new Map<number, (response: unknown) => void>();
  private subscriptions = new Map<string, Set<(data: unknown) => void>>();
  private reconnect: boolean;
  private reconnectDelay: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
  private isConnected = false;
  private eventListeners: Map<ProviderEvent, Set<(...args: unknown[]) => void>> =
    new Map();

  constructor(options: WebSocketProviderOptions | string) {
    if (typeof globalThis.WebSocket === 'undefined') {
      throw new Error(
        'WebSocket is not available in this environment. ' +
          "For Node.js, install a WebSocket polyfill like 'ws' or 'isomorphic-ws' and assign it to globalThis.WebSocket.",
      );
    }

    if (typeof options === 'string') {
      this.url = options;
      this.reconnect = true;
      this.reconnectDelay = 5000;
      this.maxReconnectAttempts = 0;
    } else {
      this.url = options.url;
      this.protocols = options.protocols;
      this.reconnect = options.reconnect ?? true;
      this.reconnectDelay = options.reconnectDelay ?? 5000;
      this.maxReconnectAttempts = options.maxReconnectAttempts ?? 0;
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.protocols);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = undefined;
          }
          // Emit connect event with chain ID
          this._request<string>('starknet_chainId')
            .then((response) => {
              if (response.result) {
                this.emit('connect', { chainId: response.result });
              }
            })
            .catch(() => {
              // Ignore error, just don't emit connect event
            });
          resolve();
        };

        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);

          // Handle Starknet subscription notifications
          // Spec uses subscription_id, but fallback to subscription for compatibility
          if (message.method?.startsWith('starknet_subscription')) {
            const subscriptionId =
              message.params?.subscription_id ?? message.params?.subscription;
            const callbacks = this.subscriptions.get(subscriptionId);
            if (callbacks) {
              for (const callback of callbacks) {
                callback(message.params.result);
              }
            }
            return;
          }

          // Handle RPC responses
          const callback = this.pending.get(message.id);
          if (callback) {
            callback(message);
            this.pending.delete(message.id);
          }
        };

        this.ws.onerror = (error) => {
          if (!this.isConnected) {
            reject(error);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;

          // Emit disconnect event
          this.emit('disconnect', {
            code: 4900,
            message: 'WebSocket connection closed',
          });

          // Attempt reconnection
          if (
            this.reconnect &&
            (this.maxReconnectAttempts === 0 ||
              this.reconnectAttempts < this.maxReconnectAttempts)
          ) {
            this.reconnectAttempts++;
            this.reconnectTimeout = setTimeout(() => {
              this.connect().catch(() => {
                // Reconnection failed, will try again
              });
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.reconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * EIP-1193-like request method (throws on error)
   */
  async request(args: RequestArguments): Promise<unknown> {
    const response = await this._request(args.method, args.params as unknown[]);
    if (response.error) {
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
    if (!this.isConnected || !this.ws) {
      return {
        error: {
          code: -32603,
          message: 'WebSocket not connected',
        },
      };
    }

    const timeout = options?.timeout ?? 30000;
    const id = ++this.requestId;

    const request = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    });

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id);
        resolve({
          error: {
            code: -32603,
            message: `Request timeout after ${timeout}ms`,
          },
        });
      }, timeout);

      this.pending.set(id, (response: unknown) => {
        clearTimeout(timeoutId);
        const resp = response as { error?: RpcError; result?: T };

        if (resp.error) {
          resolve({ error: resp.error });
        } else {
          resolve({ result: resp.result as T });
        }
      });

      this.ws?.send(request);
    });
  }

  /**
   * Subscribe to a Starknet subscription
   */
  private async subscribe(
    subscriptionName: string,
    params: unknown[] = [],
  ): Promise<string> {
    const method = `starknet_subscribe${subscriptionName}`;
    const response = await this._request<string>(method, params);
    if (response.error) {
      throw new Error(response.error.message);
    }
    return response.result!;
  }

  /**
   * Unsubscribe from a subscription
   */
  private async unsubscribe(subscriptionId: string): Promise<void> {
    await this._request('starknet_unsubscribe', [subscriptionId]);
    this.subscriptions.delete(subscriptionId);
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
    this.eventListeners.get(event)?.add(listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Remove event listener
   */
  removeListener<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void,
  ): this {
    this.eventListeners
      .get(event)
      ?.delete(listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Emit event to all listeners
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
  // Read Methods (same as HttpProvider)
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

  starknet_getClass(
    blockId: BlockId,
    classHash: string,
    options?: RequestOptions,
  ) {
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
  // Write Methods
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
  // Trace Methods
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

  // ============================================================================
  // WebSocket Subscription Events
  // ============================================================================

  /**
   * Native WebSocket subscription events using async generators
   */
  events: StarknetProviderEvents = {
    /**
     * Subscribe to new block headers
     */
    newHeads: async function* (
      this: WebSocketProvider,
      params?: NewHeadsSubscriptionParams,
    ) {
      const subscriptionId = await this.subscribe(
        'NewHeads',
        params?.block_id ? [params.block_id] : [],
      );
      const queue: NewHead[] = [];
      let resolve: ((value: NewHead) => void) | null = null;

      const callback = (data: unknown) => {
        const head = data as NewHead;
        if (resolve) {
          resolve(head);
          resolve = null;
        } else {
          queue.push(head);
        }
      };

      if (!this.subscriptions.has(subscriptionId)) {
        this.subscriptions.set(subscriptionId, new Set());
      }
      this.subscriptions.get(subscriptionId)?.add(callback);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            yield await new Promise<NewHead>((r) => {
              resolve = r;
            });
          }
        }
      } finally {
        await this.unsubscribe(subscriptionId);
      }
    }.bind(this),

    /**
     * Subscribe to events (logs)
     */
    events: async function* (
      this: WebSocketProvider,
      params?: EventsSubscriptionParams,
    ) {
      // Positional params: from_address?, keys?, block_id?, finality_status?
      const subscribeParams: unknown[] = [];
      if (params) {
        subscribeParams.push(params.from_address ?? null);
        subscribeParams.push(params.keys ?? null);
        subscribeParams.push(params.block_id ?? null);
        if (params.finality_status !== undefined) {
          subscribeParams.push(params.finality_status);
        }
      }
      const subscriptionId = await this.subscribe('Events', subscribeParams);
      const queue: EmittedEvent[] = [];
      let resolve: ((value: EmittedEvent) => void) | null = null;

      const callback = (data: unknown) => {
        const event = data as EmittedEvent;
        if (resolve) {
          resolve(event);
          resolve = null;
        } else {
          queue.push(event);
        }
      };

      if (!this.subscriptions.has(subscriptionId)) {
        this.subscriptions.set(subscriptionId, new Set());
      }
      this.subscriptions.get(subscriptionId)?.add(callback);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            yield await new Promise<EmittedEvent>((r) => {
              resolve = r;
            });
          }
        }
      } finally {
        await this.unsubscribe(subscriptionId);
      }
    }.bind(this),

    /**
     * Subscribe to transaction status changes
     */
    transactionStatus: async function* (
      this: WebSocketProvider,
      transactionHash: string,
    ) {
      const subscriptionId = await this.subscribe('TransactionStatus', [
        transactionHash,
      ]);
      const queue: TransactionStatusUpdate[] = [];
      let resolve: ((value: TransactionStatusUpdate) => void) | null = null;

      const callback = (data: unknown) => {
        const update = data as TransactionStatusUpdate;
        if (resolve) {
          resolve(update);
          resolve = null;
        } else {
          queue.push(update);
        }
      };

      if (!this.subscriptions.has(subscriptionId)) {
        this.subscriptions.set(subscriptionId, new Set());
      }
      this.subscriptions.get(subscriptionId)?.add(callback);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            yield await new Promise<TransactionStatusUpdate>((r) => {
              resolve = r;
            });
          }
        }
      } finally {
        await this.unsubscribe(subscriptionId);
      }
    }.bind(this),

    /**
     * Subscribe to pending transactions
     */
    pendingTransactions: async function* (
      this: WebSocketProvider,
      params?: PendingTransactionsSubscriptionParams,
    ) {
      // Positional params: finality_status?, sender_address?
      const subscribeParams: unknown[] = [];
      if (params) {
        subscribeParams.push(params.finality_status ?? null);
        if (params.sender_address !== undefined) {
          subscribeParams.push(params.sender_address);
        }
      }
      const subscriptionId = await this.subscribe(
        'NewTransactions',
        subscribeParams,
      );
      const queue: PendingTransaction[] = [];
      let resolve: ((value: PendingTransaction) => void) | null = null;

      const callback = (data: unknown) => {
        const tx = data as PendingTransaction;
        if (resolve) {
          resolve(tx);
          resolve = null;
        } else {
          queue.push(tx);
        }
      };

      if (!this.subscriptions.has(subscriptionId)) {
        this.subscriptions.set(subscriptionId, new Set());
      }
      this.subscriptions.get(subscriptionId)?.add(callback);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            yield await new Promise<PendingTransaction>((r) => {
              resolve = r;
            });
          }
        }
      } finally {
        await this.unsubscribe(subscriptionId);
      }
    }.bind(this),

    /**
     * Subscribe to new transaction receipts
     */
    newTransactionReceipts: async function* (
      this: WebSocketProvider,
      params?: TransactionReceiptsSubscriptionParams,
    ) {
      // Positional params: finality_status?, sender_address?
      const subscribeParams: unknown[] = [];
      if (params) {
        subscribeParams.push(params.finality_status ?? null);
        if (params.sender_address !== undefined) {
          subscribeParams.push(params.sender_address);
        }
      }
      const subscriptionId = await this.subscribe(
        'NewTransactionReceipts',
        subscribeParams,
      );
      const queue: TransactionReceipt[] = [];
      let resolve: ((value: TransactionReceipt) => void) | null = null;

      const callback = (data: unknown) => {
        const receipt = data as TransactionReceipt;
        if (resolve) {
          resolve(receipt);
          resolve = null;
        } else {
          queue.push(receipt);
        }
      };

      if (!this.subscriptions.has(subscriptionId)) {
        this.subscriptions.set(subscriptionId, new Set());
      }
      this.subscriptions.get(subscriptionId)?.add(callback);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            yield await new Promise<TransactionReceipt>((r) => {
              resolve = r;
            });
          }
        }
      } finally {
        await this.unsubscribe(subscriptionId);
      }
    }.bind(this),

    /**
     * Subscribe to reorg events
     */
    reorg: async function* (this: WebSocketProvider) {
      // Reorg is typically received as a notification, not a subscription
      // But we handle it the same way
      const subscriptionId = await this.subscribe('NewHeads'); // Reorg comes with newHeads
      const queue: ReorgData[] = [];
      let resolve: ((value: ReorgData) => void) | null = null;

      // For reorg, we listen to the special reorg notification
      const callback = (data: unknown) => {
        const reorg = data as ReorgData;
        // Only yield if this is actually reorg data
        if ('starting_block_hash' in reorg) {
          if (resolve) {
            resolve(reorg);
            resolve = null;
          } else {
            queue.push(reorg);
          }
        }
      };

      if (!this.subscriptions.has(subscriptionId)) {
        this.subscriptions.set(subscriptionId, new Set());
      }
      this.subscriptions.get(subscriptionId)?.add(callback);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            yield await new Promise<ReorgData>((r) => {
              resolve = r;
            });
          }
        }
      } finally {
        await this.unsubscribe(subscriptionId);
      }
    }.bind(this),
  };
}
