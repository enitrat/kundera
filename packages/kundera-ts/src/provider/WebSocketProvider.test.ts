import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WebSocketProvider } from './WebSocketProvider.js';

type MessageEventLike = { data: string };

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;

  url: string;
  protocols?: string | string[] | undefined;
  readyState = MockWebSocket.CONNECTING;
  onopen?: () => void;
  onmessage?: (event: MessageEventLike) => void;
  onerror?: () => void;
  onclose?: () => void;

  private subscriptionCounter = 0;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    MockWebSocket.instances.push(this);

    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    });
  }

  send(data: string) {
    const message = JSON.parse(data) as { id?: number | string; method?: string; params?: unknown[] };
    const id = message.id ?? 1;

    if (message.method === 'starknet_chainId') {
      this.respond(id, '0x534e5f5345504f4c4941');
      return;
    }

    if (message.method === 'starknet_blockNumber') {
      this.respond(id, 123);
      return;
    }

    if (message.method?.startsWith('starknet_subscribe')) {
      this.subscriptionCounter += 1;
      this.respond(id, `sub-${this.subscriptionCounter}`);
      return;
    }

    if (message.method === 'starknet_unsubscribe') {
      this.respond(id, true);
      return;
    }

    this.respond(id, null);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  respond(id: number | string, result: unknown) {
    this.onmessage?.({
      data: JSON.stringify({ jsonrpc: '2.0', id, result }),
    });
  }

  emitSubscription(subscriptionId: string, result: unknown) {
    this.onmessage?.({
      data: JSON.stringify({
        jsonrpc: '2.0',
        method: 'starknet_subscription',
        params: {
          subscription_id: subscriptionId,
          result,
        },
      }),
    });
  }
}

describe('WebSocketProvider', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket as typeof WebSocket;
  });

  it('connects and emits connect event with chainId', async () => {
    const provider = new WebSocketProvider('ws://localhost:9545');
    let connectedChainId: string | undefined;

    provider.on('connect', ({ chainId }) => {
      connectedChainId = chainId;
    });

    await provider.connect();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(connectedChainId).toBe('0x534e5f5345504f4c4941');
  });

  it('executes request() over websocket', async () => {
    const provider = new WebSocketProvider('ws://localhost:9545');
    await provider.connect();

    const result = await provider.request({ method: 'starknet_blockNumber' });
    expect(result).toBe(123);
  });

  it('streams newHeads subscription events', async () => {
    const provider = new WebSocketProvider('ws://localhost:9545');
    await provider.connect();

    const ws = MockWebSocket.instances[0]!;
    const stream = provider.events.newHeads();

    const nextPromise = stream.next();
    await new Promise((resolve) => setTimeout(resolve, 0));

    queueMicrotask(() => {
      ws.emitSubscription('sub-1', {
        block_hash: '0x1',
        parent_hash: '0x0',
        block_number: 1,
        new_root: '0x2',
        timestamp: 123,
        sequencer_address: '0x3',
        l1_gas_price: { price_in_fri: '1', price_in_wei: '1' },
        l1_data_gas_price: { price_in_fri: '1', price_in_wei: '1' },
        l1_da_mode: 'BLOB',
        starknet_version: '0.13.0',
      });
    });

    const next = await nextPromise;
    expect((next.value as any)?.block_hash).toBe('0x1');

    await stream.return?.();
  });
});
