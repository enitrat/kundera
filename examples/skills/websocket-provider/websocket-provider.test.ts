import { describe, expect, it } from 'bun:test';
import { createWebSocketProvider } from './index';

describe('websocket-provider skill', () => {
  it('creates provider with transport and methods', () => {
    const provider = createWebSocketProvider({ url: 'ws://localhost:5050' });
    expect(provider.transport.type).toBe('websocket');
    expect(typeof provider.connect).toBe('function');
    expect(typeof provider.subscribeNewHeads).toBe('function');
  });
});
