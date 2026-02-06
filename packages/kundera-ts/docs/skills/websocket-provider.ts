/**
 * WebSocket Provider Skill
 *
 * Real-time subscriptions using Kundera's WebSocket transport + RPC methods.
 */

import {
  webSocketTransport,
  type WebSocketTransport,
  type WebSocketTransportOptions,
} from '@kundera-sn/kundera-ts/transport';
import { Rpc } from '@kundera-sn/kundera-ts/jsonrpc';
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
} from '@kundera-sn/kundera-ts/jsonrpc';

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

/** Send a subscription request and return the subscription id. */
async function subscribe(transport: WebSocketTransport, req: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<string> {
  const response = await transport.request({ jsonrpc: '2.0', id: 1, method: req.method, params: req.params ?? [] });
  if ('error' in response) throw new Error(response.error.message);
  return response.result as string;
}

/** Send an unsubscribe request. */
async function sendUnsubscribe(transport: WebSocketTransport, subscriptionId: string): Promise<void> {
  const unsub = Rpc.UnsubscribeRequest(subscriptionId);
  const response = await transport.request({ jsonrpc: '2.0', id: 1, method: unsub.method, params: unsub.params ?? [] });
  if ('error' in response) throw new Error(response.error.message);
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
      const subscriptionId = await subscribe(transport, Rpc.SubscribeNewHeadsRequest(params));
      const callback = (data: unknown) => onData(data as NewHead);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await sendUnsubscribe(transport, subscriptionId);
      };
    },

    async subscribeEvents(params, onData) {
      const subscriptionId = await subscribe(transport, Rpc.SubscribeEventsRequest(params));
      const callback = (data: unknown) => onData(data as EmittedEvent);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await sendUnsubscribe(transport, subscriptionId);
      };
    },

    async subscribeTransactionStatus(transactionHash, onData) {
      const subscriptionId = await subscribe(
        transport,
        Rpc.SubscribeTransactionStatusRequest(transactionHash),
      );
      const callback = (data: unknown) => onData(data as TransactionStatusUpdate);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await sendUnsubscribe(transport, subscriptionId);
      };
    },

    async subscribeNewTransactions(params, onData) {
      const subscriptionId = await subscribe(transport, Rpc.SubscribeNewTransactionsRequest(params));
      const callback = (data: unknown) => onData(data as PendingTransaction);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await sendUnsubscribe(transport, subscriptionId);
      };
    },

    async subscribeNewTransactionReceipts(params, onData) {
      const subscriptionId = await subscribe(
        transport,
        Rpc.SubscribeNewTransactionReceiptsRequest(params),
      );
      const callback = (data: unknown) => onData(data as WsTransactionReceipt);
      transport.subscribe(subscriptionId, callback);
      return async () => {
        transport.unsubscribe(subscriptionId, callback);
        await sendUnsubscribe(transport, subscriptionId);
      };
    },
  };
}
