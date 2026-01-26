/**
 * Account Discovery Helpers Tests
 */

import { describe, it, expect, mock } from 'bun:test';
import {
  isAccountDeployed,
  getAccountNonce,
  getAccountClassHash,
} from './discovery.js';

describe('account discovery', () => {
  it('returns true when account is deployed', async () => {
    const provider = {
      request: mock(async ({ method }: { method: string }) => {
        if (method === 'starknet_getClassHashAt') {
          return '0xclasshash';
        }
        throw new Error(`Unexpected method: ${method}`);
      }),
    };

    const result = await isAccountDeployed(provider as any, '0xabc');
    expect(result.error).toBeNull();
    expect(result.result).toBe(true);
  });

  it('returns false when contract not found', async () => {
    const provider = {
      request: mock(async () => {
        throw { code: 20, message: 'Contract not found' };
      }),
    };

    const result = await isAccountDeployed(provider as any, '0xabc');
    expect(result.error).toBeNull();
    expect(result.result).toBe(false);
  });

  it('returns error on unexpected failure', async () => {
    const provider = {
      request: mock(async () => {
        throw { code: 999, message: 'RPC failed' };
      }),
    };

    const result = await isAccountDeployed(provider as any, '0xabc');
    expect(result.result).toBeNull();
    expect(result.error?.code).toBe('RPC_ERROR');
    expect(result.error?.details).toEqual({ code: 999 });
  });

  it('gets account nonce as bigint', async () => {
    const provider = {
      request: mock(async ({ method }: { method: string }) => {
        if (method === 'starknet_getNonce') {
          return '0x5';
        }
        throw new Error(`Unexpected method: ${method}`);
      }),
    };

    const result = await getAccountNonce(provider as any, '0xabc');
    expect(result.error).toBeNull();
    expect(result.result).toBe(5n);
  });

  it('gets account class hash', async () => {
    const provider = {
      request: mock(async ({ method }: { method: string }) => {
        if (method === 'starknet_getClassHashAt') {
          return '0xdeadbeef';
        }
        throw new Error(`Unexpected method: ${method}`);
      }),
    };

    const result = await getAccountClassHash(provider as any, '0xabc');
    expect(result.error).toBeNull();
    expect(result.result).toBe('0xdeadbeef');
  });
});
