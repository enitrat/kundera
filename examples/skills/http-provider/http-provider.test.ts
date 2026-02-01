import { describe, expect, it } from 'bun:test';
import { createHttpProvider } from './index';

describe('http-provider skill', () => {
  it('creates provider with transport and methods', () => {
    const provider = createHttpProvider({ url: 'http://localhost:5050' });
    expect(provider.transport.type).toBe('http');
    expect(typeof provider.chainId).toBe('function');
    expect(typeof provider.blockNumber).toBe('function');
    expect(typeof provider.call).toBe('function');
  });
});
