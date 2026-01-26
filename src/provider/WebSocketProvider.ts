/**
 * WebSocket Provider
 *
 * Starknet JSON-RPC provider using WebSocket transport for real-time
 * bidirectional communication. Supports native pub/sub for events.
 * Thin adapter over webSocketTransport - delegates all request logic to transport layer.
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
import {
  webSocketTransport,
  type WebSocketTransport,
  type WebSocketTransportOptions,
  isJsonRpcError,
  createRequest,
} from '../transport/index.js';

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
  /** Keep-alive interval in ms */
  keepAlive?: number;
  /** Request timeout in ms */
  timeout?: number;
}

/**
 * WebSocket Provider implementation
 *
 * Implements Provider interface using WebSocket transport for real-time
 * communication. Supports native pub/sub subscriptions for Starknet events.
 * Thin adapter that delegates to webSocketTransport.
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
  private transport: WebSocketTransport;
  private eventListeners: Map<ProviderEvent, Set<(...args: unknown[]) => void>> =
    new Map();
  private subscriptionParams = new Map<string, { name: string; params: unknown[] }>();

  constructor(options: WebSocketProviderOptions | string) {
    const opts: WebSocketProviderOptions =
      typeof options === 'string' ? { url: options } : options;

    // Create transport with mapped options
    const transportOpts: WebSocketTransportOptions = {
      protocols: opts.protocols,
      reconnect: opts.reconnect ?? true,
      reconnectDelay: opts.reconnectDelay ?? 5000,
      maxReconnectAttempts: opts.maxReconnectAttempts ?? 0,
      keepAlive: opts.keepAlive ?? 30000,
      timeout: opts.timeout ?? 30000,
    };

    this.transport = webSocketTransport(opts.url, transportOpts);

    // Forward transport events to provider events
    this.transport.on('connect', () => {
      // Get chain ID and emit connect event
      this._request<string>('starknet_chainId')
        .then((response) => {
          if (response.result) {
            this.emit('connect', { chainId: response.result });
          }
        })
        .catch(() => {});

      // Resubscribe to all previous subscriptions
      this.resubscribeAll();
    });

    this.transport.on('disconnect', () => {
      this.emit('disconnect', {
        code: 4900,
        message: 'WebSocket connection closed',
      });
    });
  }

  /**
   * Get the underlying transport (for advanced use)
   */
  getTransport(): WebSocketTransport {
    return this.transport;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return this.transport.connect();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.transport.close();
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
    const request = createRequest(method, params);
    const response = await this.transport.request<T>(request, {
      timeout: options?.timeout,
    });

    if (isJsonRpcError(response)) {
      return { error: response.error };
    }

    return { result: response.result };
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
    const subscriptionId = response.result!;

    // Store subscription params for resubscription after reconnect
    this.subscriptionParams.set(subscriptionId, {
      name: subscriptionName,
      params,
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from a subscription
   */
  private async unsubscribe(subscriptionId: string): Promise<void> {
    await this._request('starknet_unsubscribe', [subscriptionId]);
    this.subscriptionParams.delete(subscriptionId);
    this.transport.unsubscribe(subscriptionId);
  }

  /**
   * Resubscribe to all subscriptions after reconnect
   */
  private async resubscribeAll(): Promise<void> {
    const oldSubscriptions = new Map(this.subscriptionParams);
    this.subscriptionParams.clear();

    for (const [oldId, { name, params }] of oldSubscriptions) {
      try {
        // Get new subscription ID
        const method = `starknet_subscribe${name}`;
        const response = await this._request<string>(method, params);
        if (response.result) {
          // Migrate callbacks to new subscription ID
          const newId = response.result;
          this.subscriptionParams.set(newId, { name, params });
          // Note: callbacks are stored in transport, need to re-register
        }
      } catch {
        // Failed to resubscribe, subscription is lost
      }
    }
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

      this.transport.subscribe(subscriptionId, callback);

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

    events: async function* (
      this: WebSocketProvider,
      params?: EventsSubscriptionParams,
    ) {
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

      this.transport.subscribe(subscriptionId, callback);

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

      this.transport.subscribe(subscriptionId, callback);

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

    pendingTransactions: async function* (
      this: WebSocketProvider,
      params?: PendingTransactionsSubscriptionParams,
    ) {
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

      this.transport.subscribe(subscriptionId, callback);

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

    newTransactionReceipts: async function* (
      this: WebSocketProvider,
      params?: TransactionReceiptsSubscriptionParams,
    ) {
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

      this.transport.subscribe(subscriptionId, callback);

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

    reorg: async function* (this: WebSocketProvider) {
      const subscriptionId = await this.subscribe('NewHeads');
      const queue: ReorgData[] = [];
      let resolve: ((value: ReorgData) => void) | null = null;

      const callback = (data: unknown) => {
        const reorg = data as ReorgData;
        if ('starting_block_hash' in reorg) {
          if (resolve) {
            resolve(reorg);
            resolve = null;
          } else {
            queue.push(reorg);
          }
        }
      };

      this.transport.subscribe(subscriptionId, callback);

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
