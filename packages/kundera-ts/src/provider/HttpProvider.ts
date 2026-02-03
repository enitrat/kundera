/**
 * HTTP Provider
 *
 * Starknet JSON-RPC provider using HTTP transport.
 *
 * @module provider/HttpProvider
 */

import type { JsonRpcRequest, Transport } from '../transport/types.js';
import { httpTransport } from '../transport/http.js';
import { nextRequestId } from '../jsonrpc/utils.js';
import { isJsonRpcError } from '../transport/types.js';
import type { Provider } from './Provider.js';
import type { ProviderEvent, ProviderEventMap, RequestArguments, RequestOptions, Response, RpcError } from './types.js';
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
  PreConfirmedBlockWithReceipts,
  PreConfirmedBlockWithTxHashes,
  PreConfirmedBlockWithTxs,
  PreConfirmedStateUpdate,
  SimulatedTransaction,
  SimulationFlag,
  StateUpdate,
  StorageProof,
  SyncingStatus,
  TransactionStatus,
  TransactionTrace,
  TxnWithHash,
  TxnReceiptWithBlockInfo,
} from '../jsonrpc/types.js';
import type { NewHeadsSubscriptionParams, EventsSubscriptionParams, PendingTransactionsSubscriptionParams, TransactionReceiptsSubscriptionParams } from '../jsonrpc/types.js';

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

export class HttpProvider implements Provider {
  private transport: Transport;
  private defaultTimeout: number;
  private defaultRetryCount: number;
  private defaultRetryDelay: number;
  private eventListeners: Map<ProviderEvent, Set<ProviderEventMap[ProviderEvent]>> = new Map();

  constructor(options: HttpProviderOptions | string) {
    if (typeof options === 'string') {
      this.transport = httpTransport(options, { timeout: 30000 });
      this.defaultTimeout = 30000;
      this.defaultRetryCount = 3;
      this.defaultRetryDelay = 1000;
    } else {
      const transportOptions: { timeout: number; fetchOptions?: RequestInit } = {
        timeout: options.timeout ?? 30000,
      };
      if (options.headers) {
        transportOptions.fetchOptions = { headers: options.headers };
      }
      this.transport = httpTransport(options.url, transportOptions);
      this.defaultTimeout = options.timeout ?? 30000;
      this.defaultRetryCount = options.retry ?? 3;
      this.defaultRetryDelay = options.retryDelay ?? 1000;
    }
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

  // Subscriptions (HTTP providers will typically return errors)
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
}
