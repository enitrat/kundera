/**
 * WebSocket Provider Skill
 *
 * Real-time subscriptions using Kundera's WebSocket transport + RPC methods.
 */

import {
  webSocketTransport,
  type WebSocketTransport,
  type WebSocketTransportOptions,
} from 'kundera/transport';
import {
  starknet_subscribeNewHeads,
  starknet_subscribeEvents,
  starknet_subscribeTransactionStatus,
  starknet_subscribeNewTransactions,
  starknet_subscribeNewTransactionReceipts,
  starknet_unsubscribe,
} from 'kundera/rpc';
import type {
  NewHead,
  EmittedEvent,
  TransactionStatusUpdate,
  PendingTransaction,
  WsTransactionReceipt,
  EventsSubscriptionParams,
  NewHeadsSubscriptionParams,
  PendingTransactionsSubscriptionParams,
  TransactionReceiptsSubscriptionParams,
} from 'kundera/rpc';

export interface WebSocketProviderOptions {
  url: string;
  transport?: WebSocketTransportOptions;
}

export type Unsubscribe = () => Promise<void>;

export interface WebSocketProvider {
  transport: WebSocketTransport;
  connect: () => Promise<void>;
  close: () => void;
  subscribeNewHeads: (params: NewHeadsSubscriptionParams | undefined, onData: (data: NewHead) => void) => Promise<Unsubscribe>;
  subscribeEvents: (params: EventsSubscriptionParams | undefined, onData: (data: EmittedEvent) => void) => Promise<Unsubscribe>;
  subscribeTransactionStatus: (transactionHash: string, onData: (data: TransactionStatusUpdate) => void) => Promise<Unsubscribe>;
  subscribeNewTransactions: (params: PendingTransactionsSubscriptionParams | undefined, onData: (data: PendingTransaction) => void) => Promise<Unsubscribe>;
  subscribeNewTransactionReceipts: (params: TransactionReceiptsSubscriptionParams | undefined, onData: (data: WsTransactionReceipt) => void) => Promise<Unsubscribe>;
}

export function createWebSocketProvider(
  options: WebSocketProviderOptions,
): WebSocketProvider {
  const transport = webSocketTransport(options.url, options.transport);

  return {
    transport,
    connect: () => transport.connect(),
    close: () => transport.close(),

    async subscribeNewHeads(params, onData) {
      const subscriptionId = await starknet_subscribeNewHeads(transport, params);
      const callback = (data: unknown) => onData(data as NewHead);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await starknet_unsubscribe(transport, subscriptionId);
      };
    },

    async subscribeEvents(params, onData) {
      const subscriptionId = await starknet_subscribeEvents(transport, params);
      const callback = (data: unknown) => onData(data as EmittedEvent);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await starknet_unsubscribe(transport, subscriptionId);
      };
    },

    async subscribeTransactionStatus(transactionHash, onData) {
      const subscriptionId = await starknet_subscribeTransactionStatus(
        transport,
        transactionHash,
      );
      const callback = (data: unknown) => onData(data as TransactionStatusUpdate);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await starknet_unsubscribe(transport, subscriptionId);
      };
    },

    async subscribeNewTransactions(params, onData) {
      const subscriptionId = await starknet_subscribeNewTransactions(transport, params);
      const callback = (data: unknown) => onData(data as PendingTransaction);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await starknet_unsubscribe(transport, subscriptionId);
      };
    },

    async subscribeNewTransactionReceipts(params, onData) {
      const subscriptionId = await starknet_subscribeNewTransactionReceipts(
        transport,
        params,
      );
      const callback = (data: unknown) => onData(data as WsTransactionReceipt);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await starknet_unsubscribe(transport, subscriptionId);
      };
    },
  };
}
