/**
 * WebSocket Provider
 *
 * Starknet JSON-RPC provider using WebSocket transport with native subscriptions.
 *
 * @module provider/WebSocketProvider
 */

import type { Provider } from './Provider.js';
import type { ProviderEvent, ProviderEventMap, ProviderEvents, RequestArguments, RequestOptions, Response, RpcError } from './types.js';
import type {
  AddDeclareTransactionResult,
  AddDeployAccountTransactionResult,
  AddInvokeTransactionResult,
  BlockHashAndNumber,
  BlockId,
  BlockTransactionTrace,
  BlockWithReceipts,
  BlockWithTxHashes,
  BlockWithTxs,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  BroadcastedInvokeTxn,
  BroadcastedTxn,
  ContractClass,
  EventsFilter,
  EventsResponse,
  FeeEstimate,
  FunctionCall,
  MessageFeeEstimate,
  MessagesStatusResponse,
  MsgFromL1,
  NewHeadsSubscriptionParams,
  EventsSubscriptionParams,
  PendingTransactionsSubscriptionParams,
  PreConfirmedBlockWithReceipts,
  PreConfirmedBlockWithTxHashes,
  PreConfirmedBlockWithTxs,
  PreConfirmedStateUpdate,
  SimulatedTransaction,
  SimulationFlag,
  StateUpdate,
  StorageProof,
  SyncingStatus,
  TransactionReceiptsSubscriptionParams,
  TransactionStatus,
  TransactionTrace,
  TxnWithHash,
  TxnReceiptWithBlockInfo,
} from '../jsonrpc/types.js';
import { isJsonRpcError } from '../transport/types.js';
import { nextRequestId } from '../jsonrpc/utils.js';
import type { JsonRpcRequest } from '../transport/types.js';
import { webSocketTransport, type WebSocketTransport, type WebSocketTransportOptions } from '../transport/websocket.js';

/**
 * WebSocket configuration options
 */
export interface WebSocketProviderOptions extends WebSocketTransportOptions {
  /** WebSocket endpoint URL */
  url: string;
  /** Default retry attempts */
  retry?: number;
  /** Default retry delay in ms */
  retryDelay?: number;
}

export class WebSocketProvider implements Provider {
  private transport: WebSocketTransport;
  private defaultTimeout: number;
  private defaultRetryCount: number;
  private defaultRetryDelay: number;
  private eventListeners: Map<ProviderEvent, Set<ProviderEventMap[ProviderEvent]>> = new Map();

  constructor(options: WebSocketProviderOptions | string) {
    if (typeof options === 'string') {
      this.transport = webSocketTransport(options);
      this.defaultTimeout = 30000;
      this.defaultRetryCount = 3;
      this.defaultRetryDelay = 1000;
    } else {
      const { url, retry, retryDelay, ...transportOptions } = options;
      this.transport = webSocketTransport(url, transportOptions);
      this.defaultTimeout = transportOptions.timeout ?? 30000;
      this.defaultRetryCount = retry ?? 3;
      this.defaultRetryDelay = retryDelay ?? 1000;
    }

    this.transport.on('connect', () => {
      this.executeRequest<string>('starknet_chainId', [])
        .then((response) => {
          if (response.result) {
            this.emit('connect', { chainId: response.result });
          }
        })
        .catch(() => {
          // Ignore chainId errors on connect
        });
    });

    this.transport.on('disconnect', (error) => {
      this.emit('disconnect', {
        code: -32603,
        message: error?.message ?? 'WebSocket disconnected',
      });
    });

    this.transport.on('message', (data) => {
      this.emit('message', { type: 'starknet_subscription', data });
    });
  }

  async connect(): Promise<void> {
    await this.transport.connect();
  }

  disconnect(): void {
    this.transport.close();
  }

  private async executeRequest<T>(
    method: string,
    params?: unknown[] | Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<Response<T>> {
    const retryCount = options?.retryCount ?? this.defaultRetryCount;
    const retryDelay = options?.retryDelay ?? this.defaultRetryDelay;
    const timeout = options?.timeout ?? this.defaultTimeout;

    let lastError: RpcError | undefined;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const request: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: nextRequestId(),
          method,
        };
        if (params !== undefined) {
          request.params = params;
        }
        const response = await this.transport.request<T>(request, { timeout });
        if (isJsonRpcError(response)) {
          lastError = response.error;
        } else {
          return { result: response.result };
        }
      } catch (error) {
        lastError = {
          code: -32603,
          message: error instanceof Error ? error.message : 'Request failed',
        };
      }

      if (attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    return { error: lastError ?? { code: -32603, message: 'Request failed' } };
  }

  async request(args: RequestArguments): Promise<unknown> {
    const { method, params } = args;
    const normalizedParams: unknown[] | Record<string, unknown> | undefined = Array.isArray(params)
      ? [...params]
      : params;
    const response = await this.executeRequest(method, normalizedParams);
    if (response.error) {
      throw response.error;
    }
    return response.result;
  }

  on<E extends ProviderEvent>(
    event: E,
    listener: ProviderEventMap[E],
  ): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(listener as ProviderEventMap[ProviderEvent]);
    return this;
  }

  removeListener<E extends ProviderEvent>(
    event: E,
    listener: ProviderEventMap[E],
  ): this {
    this.eventListeners.get(event)?.delete(listener as ProviderEventMap[ProviderEvent]);
    return this;
  }

  protected emit<E extends ProviderEvent>(
    event: E,
    ...args: Parameters<ProviderEventMap[E]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        (listener as (...eventArgs: Parameters<ProviderEventMap[E]>) => void)(...args);
      });
    }
  }

  private async subscribeRaw(method: string, params: unknown[] = []): Promise<string> {
    const response = await this.executeRequest<string>(method, params);
    if (response.error) {
      throw response.error;
    }
    return response.result as string;
  }

  private async unsubscribeRaw(subscriptionId: string): Promise<void> {
    await this.executeRequest<boolean>('starknet_unsubscribe', [subscriptionId]);
  }

  private async *createSubscriptionStream<T>(subscribe: () => Promise<string>): AsyncGenerator<T, void, unknown> {
    const subscriptionId = await subscribe();
    const queue: T[] = [];
    let resolve: ((value: T) => void) | null = null;

    const callback = (data: T) => {
      if (resolve) {
        resolve(data);
        resolve = null;
      } else {
        queue.push(data);
      }
    };

    this.transport.subscribe(subscriptionId, callback as (data: unknown) => void);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift() as T;
        } else {
          yield await new Promise<T>((r) => {
            resolve = r;
          });
        }
      }
    } finally {
      this.transport.unsubscribe(subscriptionId, callback as (data: unknown) => void);
      await this.unsubscribeRaw(subscriptionId).catch(() => {});
    }
  }

  // ==========================================================================
  // Starknet methods (Response<T> style)
  // ==========================================================================

  starknet_specVersion(options?: RequestOptions) {
    return this.executeRequest<string>('starknet_specVersion', [], options);
  }

  starknet_getBlockWithTxHashes(blockId: BlockId = 'latest', options?: RequestOptions) {
    return this.executeRequest<BlockWithTxHashes | PreConfirmedBlockWithTxHashes>(
      'starknet_getBlockWithTxHashes',
      [blockId],
      options,
    );
  }

  starknet_getBlockWithTxs(blockId: BlockId = 'latest', options?: RequestOptions) {
    return this.executeRequest<BlockWithTxs | PreConfirmedBlockWithTxs>(
      'starknet_getBlockWithTxs',
      [blockId],
      options,
    );
  }

  starknet_getBlockWithReceipts(blockId: BlockId = 'latest', options?: RequestOptions) {
    return this.executeRequest<BlockWithReceipts | PreConfirmedBlockWithReceipts>(
      'starknet_getBlockWithReceipts',
      [blockId],
      options,
    );
  }

  starknet_getStateUpdate(blockId: BlockId = 'latest', options?: RequestOptions) {
    return this.executeRequest<StateUpdate | PreConfirmedStateUpdate>(
      'starknet_getStateUpdate',
      [blockId],
      options,
    );
  }

  starknet_getStorageAt(
    contractAddress: string,
    key: string,
    blockId: BlockId = 'latest',
    options?: RequestOptions,
  ) {
    return this.executeRequest<string>(
      'starknet_getStorageAt',
      [contractAddress, key, blockId],
      options,
    );
  }

  starknet_getTransactionStatus(transactionHash: string, options?: RequestOptions) {
    return this.executeRequest<TransactionStatus>(
      'starknet_getTransactionStatus',
      [transactionHash],
      options,
    );
  }

  starknet_getMessagesStatus(l1TransactionHash: string, options?: RequestOptions) {
    return this.executeRequest<MessagesStatusResponse>(
      'starknet_getMessagesStatus',
      [l1TransactionHash],
      options,
    );
  }

  starknet_getTransactionByHash(transactionHash: string, options?: RequestOptions) {
    return this.executeRequest<TxnWithHash>(
      'starknet_getTransactionByHash',
      [transactionHash],
      options,
    );
  }

  starknet_getTransactionByBlockIdAndIndex(
    blockId: BlockId,
    index: number,
    options?: RequestOptions,
  ) {
    return this.executeRequest<TxnWithHash>(
      'starknet_getTransactionByBlockIdAndIndex',
      [blockId, index],
      options,
    );
  }

  starknet_getTransactionReceipt(transactionHash: string, options?: RequestOptions) {
    return this.executeRequest<TxnReceiptWithBlockInfo>(
      'starknet_getTransactionReceipt',
      [transactionHash],
      options,
    );
  }

  starknet_getClass(blockId: BlockId, classHash: string, options?: RequestOptions) {
    return this.executeRequest<ContractClass>(
      'starknet_getClass',
      [blockId, classHash],
      options,
    );
  }

  starknet_getClassHashAt(blockId: BlockId, contractAddress: string, options?: RequestOptions) {
    return this.executeRequest<string>(
      'starknet_getClassHashAt',
      [blockId, contractAddress],
      options,
    );
  }

  starknet_getClassAt(blockId: BlockId, contractAddress: string, options?: RequestOptions) {
    return this.executeRequest<ContractClass>(
      'starknet_getClassAt',
      [blockId, contractAddress],
      options,
    );
  }

  starknet_getBlockTransactionCount(blockId: BlockId = 'latest', options?: RequestOptions) {
    return this.executeRequest<number>(
      'starknet_getBlockTransactionCount',
      [blockId],
      options,
    );
  }

  starknet_call(request: FunctionCall, blockId: BlockId = 'latest', options?: RequestOptions) {
    return this.executeRequest<string[]>(
      'starknet_call',
      [request, blockId],
      options,
    );
  }

  starknet_estimateFee(
    transactions: BroadcastedTxn[],
    simulationFlags: SimulationFlag[] = [],
    blockId: BlockId = 'latest',
    options?: RequestOptions,
  ) {
    return this.executeRequest<FeeEstimate[]>(
      'starknet_estimateFee',
      [transactions, simulationFlags, blockId],
      options,
    );
  }

  starknet_estimateMessageFee(message: MsgFromL1, blockId: BlockId = 'latest', options?: RequestOptions) {
    return this.executeRequest<MessageFeeEstimate>(
      'starknet_estimateMessageFee',
      [message, blockId],
      options,
    );
  }

  starknet_blockNumber(options?: RequestOptions) {
    return this.executeRequest<number>('starknet_blockNumber', [], options);
  }

  starknet_blockHashAndNumber(options?: RequestOptions) {
    return this.executeRequest<BlockHashAndNumber>('starknet_blockHashAndNumber', [], options);
  }

  starknet_chainId(options?: RequestOptions) {
    return this.executeRequest<string>('starknet_chainId', [], options);
  }

  starknet_syncing(options?: RequestOptions) {
    return this.executeRequest<SyncingStatus>('starknet_syncing', [], options);
  }

  starknet_getEvents(filter: EventsFilter, options?: RequestOptions) {
    return this.executeRequest<EventsResponse>('starknet_getEvents', [filter], options);
  }

  starknet_getNonce(blockId: BlockId, contractAddress: string, options?: RequestOptions) {
    return this.executeRequest<string>(
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
    return this.executeRequest<StorageProof>(
      'starknet_getStorageProof',
      [blockId, classHashes, contractAddresses, contractStorageKeys],
      options,
    );
  }

  starknet_addInvokeTransaction(transaction: BroadcastedInvokeTxn, options?: RequestOptions) {
    return this.executeRequest<AddInvokeTransactionResult>(
      'starknet_addInvokeTransaction',
      [transaction],
      options,
    );
  }

  starknet_addDeclareTransaction(transaction: BroadcastedDeclareTxn, options?: RequestOptions) {
    return this.executeRequest<AddDeclareTransactionResult>(
      'starknet_addDeclareTransaction',
      [transaction],
      options,
    );
  }

  starknet_addDeployAccountTransaction(transaction: BroadcastedDeployAccountTxn, options?: RequestOptions) {
    return this.executeRequest<AddDeployAccountTransactionResult>(
      'starknet_addDeployAccountTransaction',
      [transaction],
      options,
    );
  }

  starknet_traceTransaction(transactionHash: string, options?: RequestOptions) {
    return this.executeRequest<TransactionTrace>(
      'starknet_traceTransaction',
      [transactionHash],
      options,
    );
  }

  starknet_simulateTransactions(
    blockId: BlockId,
    transactions: BroadcastedTxn[],
    simulationFlags: SimulationFlag[] = [],
    options?: RequestOptions,
  ) {
    return this.executeRequest<SimulatedTransaction[]>(
      'starknet_simulateTransactions',
      [blockId, transactions, simulationFlags],
      options,
    );
  }

  starknet_traceBlockTransactions(blockId: BlockId, options?: RequestOptions) {
    return this.executeRequest<BlockTransactionTrace[]>(
      'starknet_traceBlockTransactions',
      [blockId],
      options,
    );
  }

  starknet_subscribeNewHeads(params?: NewHeadsSubscriptionParams, options?: RequestOptions) {
    const requestParams = params?.block_id ? [params.block_id] : [];
    return this.executeRequest<string>('starknet_subscribeNewHeads', requestParams, options);
  }

  starknet_subscribeEvents(params?: EventsSubscriptionParams, options?: RequestOptions) {
    const requestParams: unknown[] = [];
    if (params) {
      requestParams.push(params.from_address ?? null);
      requestParams.push(params.keys ?? null);
      requestParams.push(params.block_id ?? null);
      if (params.finality_status !== undefined) {
        requestParams.push(params.finality_status);
      }
    }
    return this.executeRequest<string>('starknet_subscribeEvents', requestParams, options);
  }

  starknet_subscribeTransactionStatus(transactionHash: string, options?: RequestOptions) {
    return this.executeRequest<string>('starknet_subscribeTransactionStatus', [transactionHash], options);
  }

  starknet_subscribeNewTransactionReceipts(
    params?: TransactionReceiptsSubscriptionParams,
    options?: RequestOptions,
  ) {
    const requestParams: unknown[] = [];
    if (params) {
      requestParams.push(params.finality_status ?? null);
      if (params.sender_address !== undefined) {
        requestParams.push(params.sender_address);
      }
    }
    return this.executeRequest<string>('starknet_subscribeNewTransactionReceipts', requestParams, options);
  }

  starknet_subscribeNewTransactions(
    params?: PendingTransactionsSubscriptionParams,
    options?: RequestOptions,
  ) {
    const requestParams: unknown[] = [];
    if (params) {
      requestParams.push(params.finality_status ?? null);
      if (params.sender_address !== undefined) {
        requestParams.push(params.sender_address);
      }
    }
    return this.executeRequest<string>('starknet_subscribeNewTransactions', requestParams, options);
  }

  starknet_unsubscribe(subscriptionId: string, options?: RequestOptions) {
    return this.executeRequest<boolean>('starknet_unsubscribe', [subscriptionId], options);
  }

  // ==========================================================================
  // Events (Native WebSocket subscriptions)
  // ==========================================================================

  events: ProviderEvents = {
    newHeads: (params?: NewHeadsSubscriptionParams) =>
      this.createSubscriptionStream(() =>
        this.subscribeRaw(
          'starknet_subscribeNewHeads',
          params?.block_id ? [params.block_id] : [],
        ),
      ),

    events: (params?: EventsSubscriptionParams) =>
      this.createSubscriptionStream(() => {
        const requestParams: unknown[] = [];
        if (params) {
          requestParams.push(params.from_address ?? null);
          requestParams.push(params.keys ?? null);
          requestParams.push(params.block_id ?? null);
          if (params.finality_status !== undefined) {
            requestParams.push(params.finality_status);
          }
        }
        return this.subscribeRaw('starknet_subscribeEvents', requestParams);
      }),

    pendingTransactions: (params?: PendingTransactionsSubscriptionParams) =>
      this.createSubscriptionStream(() => {
        const requestParams: unknown[] = [];
        if (params) {
          requestParams.push(params.finality_status ?? null);
          if (params.sender_address !== undefined) {
            requestParams.push(params.sender_address);
          }
        }
        return this.subscribeRaw('starknet_subscribeNewTransactions', requestParams);
      }),

    transactionReceipts: (params?: TransactionReceiptsSubscriptionParams) =>
      this.createSubscriptionStream(() => {
        const requestParams: unknown[] = [];
        if (params) {
          requestParams.push(params.finality_status ?? null);
          if (params.sender_address !== undefined) {
            requestParams.push(params.sender_address);
          }
        }
        return this.subscribeRaw('starknet_subscribeNewTransactionReceipts', requestParams);
      }),

    transactionStatus: (transactionHash: string) =>
      this.createSubscriptionStream(() =>
        this.subscribeRaw('starknet_subscribeTransactionStatus', [transactionHash]),
      ),
  };
}
