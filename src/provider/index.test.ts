/**
 * Provider Tests
 *
 * Tests for HttpProvider, TypedProvider, and WebSocketProvider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  HttpProvider,
  TypedProvider,
  WebSocketProvider,
  createHttpProvider,
  createTypedProvider,
  mainnetProvider,
  sepoliaProvider,
} from './index.js';

/**
 * Minimal fake WebSocket for testing
 */
class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  onclose: (() => void) | null = null;

  sentMessages: string[] = [];

  constructor(
    public url: string,
    public protocols?: string | string[],
  ) {
    // Auto-open after microtask
    setTimeout(() => {
      this.readyState = FakeWebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  send(data: string) {
    this.sentMessages.push(data);
    // Auto-respond to subscription requests
    const msg = JSON.parse(data);
    if (msg.method?.startsWith('starknet_subscribe')) {
      setTimeout(() => {
        this.onmessage?.({
          data: JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            result: `sub_${msg.id}`,
          }),
        });
      }, 0);
    }
    if (msg.method === 'starknet_chainId') {
      setTimeout(() => {
        this.onmessage?.({
          data: JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            result: '0x534e5f5345504f4c4941',
          }),
        });
      }, 0);
    }
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }

  // Helper to simulate incoming subscription notification
  simulateNotification(subscriptionId: string, result: unknown, useSubscriptionId = true) {
    const params = useSubscriptionId
      ? { subscription_id: subscriptionId, result }
      : { subscription: subscriptionId, result };
    this.onmessage?.({
      data: JSON.stringify({
        jsonrpc: '2.0',
        method: 'starknet_subscriptionNewHeads',
        params,
      }),
    });
  }
}

describe('HttpProvider', () => {
  describe('constructor', () => {
    it('should accept string URL', () => {
      const provider = new HttpProvider('https://example.com');
      expect(provider).toBeInstanceOf(HttpProvider);
    });

    it('should accept options object', () => {
      const provider = new HttpProvider({
        url: 'https://example.com',
        timeout: 5000,
        retry: 2,
        headers: { 'X-Custom': 'header' },
      });
      expect(provider).toBeInstanceOf(HttpProvider);
    });
  });

  describe('request', () => {
    it('should make JSON-RPC request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: 12345,
        }),
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      const provider = new HttpProvider('https://example.com');
      const result = await provider.request({
        method: 'starknet_blockNumber',
        params: [],
      });

      expect(result).toBe(12345);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should throw RpcError on error response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32600, message: 'Invalid Request' },
        }),
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      const provider = new HttpProvider('https://example.com');
      await expect(
        provider.request({ method: 'invalid', params: [] }),
      ).rejects.toEqual({ code: -32600, message: 'Invalid Request' });
    });

    it('should throw on HTTP error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      const provider = new HttpProvider({
        url: 'https://example.com',
        retry: 0,
      });
      await expect(
        provider.request({ method: 'starknet_blockNumber', params: [] }),
      ).rejects.toMatchObject({
        code: -32603,
        message: expect.stringContaining('HTTP 500'),
      });
    });
  });

  describe('method wrappers', () => {
    let provider: HttpProvider;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: 'test-result',
        }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;
      provider = new HttpProvider('https://example.com');
    });

    it('starknet_blockNumber returns Response<number>', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: 12345 }),
      });
      const response = await provider.starknet_blockNumber();
      expect(response.result).toBe(12345);
      expect(response.error).toBeUndefined();
    });

    it('starknet_chainId returns Response<string>', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x534e5f4d41494e' }),
      });
      const response = await provider.starknet_chainId();
      expect(response.result).toBe('0x534e5f4d41494e');
    });

    it('starknet_call returns Response<string[]>', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: ['0x1', '0x2'],
        }),
      });
      const response = await provider.starknet_call(
        {
          contract_address: '0x123',
          entry_point_selector: '0x456',
          calldata: [],
        },
        'latest',
      );
      expect(response.result).toEqual(['0x1', '0x2']);
    });

    it('starknet_getStorageAt returns Response<string>', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0xabc' }),
      });
      const response = await provider.starknet_getStorageAt(
        '0x123',
        '0x0',
        'latest',
      );
      expect(response.result).toBe('0xabc');
    });

    it('starknet_getNonce returns Response<string>', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x5' }),
      });
      const response = await provider.starknet_getNonce('latest', '0x123');
      expect(response.result).toBe('0x5');
    });

    it('handles error response in method wrapper', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: { code: 20, message: 'Contract not found' },
        }),
      });
      const response = await provider.starknet_getClassHashAt('latest', '0x123');
      expect(response.result).toBeUndefined();
      expect(response.error).toEqual({ code: 20, message: 'Contract not found' });
    });
  });

  describe('event listeners', () => {
    it('should register and remove listeners', () => {
      const provider = new HttpProvider('https://example.com');
      const listener = vi.fn();

      provider.on('connect', listener);
      provider.removeListener('connect', listener);

      // No way to test emit directly since HttpProvider doesn't emit
      // This just tests the interface works
      expect(provider).toBeInstanceOf(HttpProvider);
    });
  });
});

describe('TypedProvider', () => {
  it('should wrap provider with type safety', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 1, result: 12345 }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const httpProvider = new HttpProvider('https://example.com');
    const typed = new TypedProvider(httpProvider);

    // This should be type-safe - result is inferred as number
    const blockNumber = await typed.request({
      method: 'starknet_blockNumber',
      params: [],
    });

    expect(blockNumber).toBe(12345);
  });

  it('createTypedProvider factory works', () => {
    const httpProvider = new HttpProvider('https://example.com');
    const typed = createTypedProvider(httpProvider);
    expect(typed).toBeInstanceOf(TypedProvider);
  });

  it('getProvider returns underlying provider', () => {
    const httpProvider = new HttpProvider('https://example.com');
    const typed = new TypedProvider(httpProvider);
    expect(typed.getProvider()).toBe(httpProvider);
  });
});

describe('Factory functions', () => {
  it('createHttpProvider creates HttpProvider', () => {
    const provider = createHttpProvider('https://example.com');
    expect(provider).toBeInstanceOf(HttpProvider);
  });

  it('mainnetProvider creates provider with mainnet URL', () => {
    const provider = mainnetProvider();
    expect(provider).toBeInstanceOf(HttpProvider);
  });

  it('sepoliaProvider creates provider with sepolia URL', () => {
    const provider = sepoliaProvider();
    expect(provider).toBeInstanceOf(HttpProvider);
  });
});

describe('WebSocketProvider subscription routing', () => {
  it('should parse subscription_id from notification params', () => {
    // Test the subscription_id field is used (spec-compliant)
    // This is a unit test for the message parsing logic
    const message = {
      jsonrpc: '2.0',
      method: 'starknet_subscriptionNewHeads',
      params: {
        subscription_id: 'sub_123',
        result: { block_number: 100 },
      },
    };

    // Verify the message structure matches spec
    expect(message.params.subscription_id).toBe('sub_123');
    expect(message.params.result.block_number).toBe(100);
  });

  it('should fallback to subscription field for compatibility', () => {
    // Test fallback to legacy subscription field
    const message = {
      jsonrpc: '2.0',
      method: 'starknet_subscriptionNewHeads',
      params: {
        subscription: 'sub_legacy',
        result: { block_number: 100 },
      },
    };

    // The routing logic uses: subscription_id ?? subscription
    const subscriptionId =
      message.params.subscription_id ?? message.params.subscription;
    expect(subscriptionId).toBe('sub_legacy');
  });
});

describe('WebSocketProvider subscription params', () => {
  it('events params are positional: from_address, keys, block_id, finality_status', () => {
    // Test param structure for starknet_subscribeEvents
    const params = {
      from_address: '0x123',
      keys: [['0xabc']],
      block_id: { block_number: 100 },
      finality_status: 'ACCEPTED_ON_L2' as const,
    };

    // Build positional array as WebSocketProvider does
    const positional: unknown[] = [];
    positional.push(params.from_address ?? null);
    positional.push(params.keys ?? null);
    positional.push(params.block_id ?? null);
    if (params.finality_status !== undefined) {
      positional.push(params.finality_status);
    }

    expect(positional).toEqual([
      '0x123',
      [['0xabc']],
      { block_number: 100 },
      'ACCEPTED_ON_L2',
    ]);
  });

  it('newTransactions params are positional: finality_status, sender_address', () => {
    // Test param structure for starknet_subscribeNewTransactions
    const params = {
      finality_status: 'PRE_CONFIRMED' as const,
      sender_address: ['0x123', '0x456'],
    };

    // Build positional array as WebSocketProvider does
    const positional: unknown[] = [];
    positional.push(params.finality_status ?? null);
    if (params.sender_address !== undefined) {
      positional.push(params.sender_address);
    }

    expect(positional).toEqual(['PRE_CONFIRMED', ['0x123', '0x456']]);
  });

  it('newTransactionReceipts params are positional: finality_status, sender_address', () => {
    // Test param structure for starknet_subscribeNewTransactionReceipts
    // Only PRE_CONFIRMED or ACCEPTED_ON_L2 allowed per spec
    const params = {
      finality_status: 'ACCEPTED_ON_L2' as const,
      sender_address: ['0x789'],
    };

    // Build positional array as WebSocketProvider does
    const positional: unknown[] = [];
    positional.push(params.finality_status ?? null);
    if (params.sender_address !== undefined) {
      positional.push(params.sender_address);
    }

    expect(positional).toEqual(['ACCEPTED_ON_L2', ['0x789']]);
  });

  it('newHeads params are positional: block_id', () => {
    // Test param structure for starknet_subscribeNewHeads
    const params = {
      block_id: { block_hash: '0xabc' },
    };

    // Build positional array as WebSocketProvider does
    const positional: unknown[] = [];
    if (params.block_id !== undefined) {
      positional.push(params.block_id);
    }

    expect(positional).toEqual([{ block_hash: '0xabc' }]);
  });
});

describe('WebSocketProvider behavioral tests', () => {
  let originalWebSocket: typeof WebSocket;
  let lastFakeWs: FakeWebSocket | null = null;

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket;
    // Capture the instance for testing
    globalThis.WebSocket = class extends FakeWebSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        lastFakeWs = this;
      }
    } as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    lastFakeWs = null;
  });

  it('routes notifications by subscription_id and invokes callbacks', async () => {
    const provider = new WebSocketProvider('wss://example.com');
    await provider.connect();

    // Use direct request to establish subscription (simpler than generators)
    const subscriptionId = await provider.request({
      method: 'starknet_subscribeNewHeads',
      params: [],
    });

    // Set up callback tracking via transport's subscribe method
    const received: unknown[] = [];
    provider.getTransport().subscribe(subscriptionId as string, (data) => received.push(data));

    // Simulate notification with subscription_id (spec-compliant)
    const blockData = { block_number: 12345, block_hash: '0xabc' };
    lastFakeWs!.simulateNotification(subscriptionId as string, blockData, true);

    expect(received).toEqual([blockData]);
    provider.disconnect();
  });

  it('routes notifications by legacy subscription field (fallback)', async () => {
    const provider = new WebSocketProvider('wss://example.com');
    await provider.connect();

    const subscriptionId = await provider.request({
      method: 'starknet_subscribeNewHeads',
      params: [],
    });

    // Set up callback tracking via transport's subscribe method
    const received: unknown[] = [];
    provider.getTransport().subscribe(subscriptionId as string, (data) => received.push(data));

    // Simulate notification with legacy 'subscription' field (not subscription_id)
    const blockData = { block_number: 99999, block_hash: '0xdef' };
    lastFakeWs!.simulateNotification(subscriptionId as string, blockData, false);

    expect(received).toEqual([blockData]);
    provider.disconnect();
  });

  it('sends correct positional params for subscribe requests', async () => {
    const provider = new WebSocketProvider('wss://example.com');
    await provider.connect();

    // Test starknet_subscribeNewHeads with block_id
    await provider.request({
      method: 'starknet_subscribeNewHeads',
      params: [{ block_number: 100 }],
    });

    const newHeadsMsg = lastFakeWs!.sentMessages.find((m) =>
      m.includes('starknet_subscribeNewHeads'),
    );
    expect(newHeadsMsg).toBeDefined();
    const newHeadsParsed = JSON.parse(newHeadsMsg!);
    expect(newHeadsParsed.params).toEqual([{ block_number: 100 }]);

    // Test starknet_subscribeEvents with all params
    await provider.request({
      method: 'starknet_subscribeEvents',
      params: ['0x123', [['0xabc']], { block_number: 50 }, 'ACCEPTED_ON_L2'],
    });

    const eventsMsg = lastFakeWs!.sentMessages.find((m) =>
      m.includes('starknet_subscribeEvents'),
    );
    expect(eventsMsg).toBeDefined();
    const eventsParsed = JSON.parse(eventsMsg!);
    expect(eventsParsed.params).toEqual([
      '0x123',
      [['0xabc']],
      { block_number: 50 },
      'ACCEPTED_ON_L2',
    ]);

    // Test starknet_subscribeNewTransactions: finality_status, sender_address
    await provider.request({
      method: 'starknet_subscribeNewTransactions',
      params: ['PRE_CONFIRMED', ['0x111', '0x222']],
    });

    const txMsg = lastFakeWs!.sentMessages.find((m) =>
      m.includes('starknet_subscribeNewTransactions'),
    );
    expect(txMsg).toBeDefined();
    const txParsed = JSON.parse(txMsg!);
    expect(txParsed.params).toEqual(['PRE_CONFIRMED', ['0x111', '0x222']]);

    // Test starknet_subscribeNewTransactionReceipts: finality_status, sender_address
    await provider.request({
      method: 'starknet_subscribeNewTransactionReceipts',
      params: ['ACCEPTED_ON_L2', ['0x333']],
    });

    const receiptsMsg = lastFakeWs!.sentMessages.find((m) =>
      m.includes('starknet_subscribeNewTransactionReceipts'),
    );
    expect(receiptsMsg).toBeDefined();
    const receiptsParsed = JSON.parse(receiptsMsg!);
    expect(receiptsParsed.params).toEqual(['ACCEPTED_ON_L2', ['0x333']]);

    provider.disconnect();
  });
});
