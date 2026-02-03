/**
 * TypedProvider Integration Tests
 *
 * Tests demonstrating usage of the strongly-typed provider interface.
 */

import { describe, expect, expectTypeOf, it } from 'bun:test';
import type { TypedProvider } from './TypedProvider.js';
import type { StarknetRpcSchema } from './schemas/StarknetRpcSchema.js';
import type { ProviderEventMap } from './types.js';

describe('TypedProvider', () => {
  it('provides type-safe request method', async () => {
    const provider: TypedProvider<StarknetRpcSchema, ProviderEventMap> = {
      request: async ({ method, params }) => {
        void params;
        if (method === 'starknet_blockNumber') {
          return 123;
        }
        if (method === 'starknet_chainId') {
          return '0x534e5f5345504f4c4941';
        }
        if (method === 'starknet_getBlockTransactionCount') {
          return 5;
        }
        throw new Error('Unsupported method');
      },
      on: () => provider,
      removeListener: () => provider,
    };

    const blockNumber = await provider.request({ method: 'starknet_blockNumber' });
    expect(blockNumber).toBe(123);
    expectTypeOf(blockNumber).toEqualTypeOf<number>();

    const chainId = await provider.request({ method: 'starknet_chainId' });
    expect(chainId).toBe('0x534e5f5345504f4c4941');
    expectTypeOf(chainId).toEqualTypeOf<string>();

    const count = await provider.request({
      method: 'starknet_getBlockTransactionCount',
      params: ['latest'],
    });
    expect(count).toBe(5);
    expectTypeOf(count).toEqualTypeOf<number>();
  });

  it('validates parameters at compile time', async () => {
    const provider: TypedProvider<StarknetRpcSchema, ProviderEventMap> = {
      request: async ({ method, params }) => {
        void params;
        if (method === 'starknet_getNonce') {
          return '0x1';
        }
        if (method === 'starknet_call') {
          return ['0x1'];
        }
        throw new Error('Unsupported method');
      },
      on: () => provider,
      removeListener: () => provider,
    };

    const nonce = await provider.request({
      method: 'starknet_getNonce',
      params: ['latest', '0x123'],
    });
    expect(nonce).toBe('0x1');
    expectTypeOf(nonce).toEqualTypeOf<string>();

    const callResult = await provider.request({
      method: 'starknet_call',
      params: [
        { contract_address: '0x1', entry_point_selector: '0x2', calldata: [] },
        'latest',
      ],
    });
    expect(callResult).toEqual(['0x1']);
    expectTypeOf(callResult).toEqualTypeOf<string[]>();
  });

  it('supports event listeners with type safety', () => {
    let chainChangedCalled = false;
    let accountsChangedCalled = false;

    const provider: TypedProvider<StarknetRpcSchema, ProviderEventMap> = {
      request: async () => 0,
      on: (event, listener) => {
        if (event === 'chainChanged') {
          setTimeout(() => listener('0x2'), 0);
          chainChangedCalled = true;
        }
        if (event === 'accountsChanged') {
          setTimeout(() => listener([]), 0);
          accountsChangedCalled = true;
        }
        return provider;
      },
      removeListener: () => provider,
    };

    provider.on('chainChanged', (chainId) => {
      expectTypeOf(chainId).toEqualTypeOf<string>();
      expect(typeof chainId).toBe('string');
    });

    provider.on('accountsChanged', (accounts) => {
      expectTypeOf(accounts).toEqualTypeOf<string[]>();
      expect(Array.isArray(accounts)).toBe(true);
    });

    expect(chainChangedCalled).toBe(true);
    expect(accountsChangedCalled).toBe(true);
  });

  it('supports method chaining for event listeners', () => {
    const provider: TypedProvider<StarknetRpcSchema, ProviderEventMap> = {
      request: async () => 0,
      on: () => provider,
      removeListener: () => provider,
    };

    const result = provider
      .on('chainChanged', () => {})
      .on('accountsChanged', () => {})
      .on('connect', () => {});

    expect(result).toBe(provider);
  });
});
