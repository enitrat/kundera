/**
 * Wallet Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  connectWallet,
  disconnectWallet,
  onAccountChange,
  onNetworkChanged,
} from './index.js';
import { WalletRequestType } from '../account/WalletAccount.js';

describe('wallet connector', () => {
  const originalWindow = (globalThis as { window?: unknown }).window;
  const originalStarknet = (globalThis as { starknet?: unknown }).starknet;
  const originalGetStarknet = (globalThis as { getStarknet?: unknown }).getStarknet;

  beforeEach(() => {
    // Reset window for each test
    (globalThis as { window?: unknown }).window = undefined;
    (globalThis as { starknet?: unknown }).starknet = undefined;
    (globalThis as { getStarknet?: unknown }).getStarknet = undefined;
  });

  afterEach(() => {
    // Restore original window
    (globalThis as { window?: unknown }).window = originalWindow;
    (globalThis as { starknet?: unknown }).starknet = originalStarknet;
    (globalThis as { getStarknet?: unknown }).getStarknet = originalGetStarknet;
  });

  it('returns NO_WALLET when no provider detected', async () => {
    const result = await connectWallet();
    expect(result.result).toBeNull();
    expect(result.error?.code).toBe('RPC_ERROR');
    expect(result.error?.message).toContain('NO_WALLET');
  });

  it('connects via window.starknet and returns first account', async () => {
    const provider = {
      request: mock(async ({ type }: { type: string }) => {
        if (type === WalletRequestType.WALLET_REQUEST_ACCOUNTS) {
          return ['0xaaa', '0xbbb'];
        }
        if (type === WalletRequestType.WALLET_REQUEST_CHAIN_ID) {
          return '0x534e5f5345504f4c4941';
        }
        if (type === WalletRequestType.WALLET_GET_PERMISSIONS) {
          return ['accounts'];
        }
        throw new Error(`Unexpected request type: ${type}`);
      }),
      on: mock(() => {}),
      off: mock(() => {}),
    };

    (globalThis as { window?: unknown }).window = globalThis as unknown;
    (globalThis as { starknet?: unknown }).starknet = provider;

    const result = await connectWallet();
    expect(result.error).toBeNull();
    expect(result.result?.accounts).toEqual(['0xaaa']);
    expect(result.result?.chainId).toBe('0x534e5f5345504f4c4941');
  });

  it('returns multiple accounts when allowMultiple is true', async () => {
    const provider = {
      request: mock(async ({ type }: { type: string }) => {
        if (type === WalletRequestType.WALLET_REQUEST_ACCOUNTS) {
          return ['0xaaa', '0xbbb'];
        }
        if (type === WalletRequestType.WALLET_REQUEST_CHAIN_ID) {
          return '0x534e5f5345504f4c4941';
        }
        if (type === WalletRequestType.WALLET_GET_PERMISSIONS) {
          return ['accounts'];
        }
        throw new Error(`Unexpected request type: ${type}`);
      }),
      on: mock(() => {}),
      off: mock(() => {}),
    };

    (globalThis as { window?: unknown }).window = globalThis as unknown;
    (globalThis as { starknet?: unknown }).starknet = provider;

    const result = await connectWallet({ allowMultiple: true });
    expect(result.error).toBeNull();
    expect(result.result?.accounts).toEqual(['0xaaa', '0xbbb']);
  });

  it('returns NOT_CONNECTED in silent mode when no permissions', async () => {
    const provider = {
      request: mock(async ({ type }: { type: string }) => {
        if (type === WalletRequestType.WALLET_GET_PERMISSIONS) {
          return [];
        }
        throw new Error(`Unexpected request type: ${type}`);
      }),
      on: mock(() => {}),
      off: mock(() => {}),
    };

    (globalThis as { window?: unknown }).window = globalThis as unknown;
    (globalThis as { starknet?: unknown }).starknet = provider;

    const result = await connectWallet({ silent: true });
    expect(result.result).toBeNull();
    expect(result.error?.message).toContain('NOT_CONNECTED');
  });

  it('disconnectWallet is a no-op success', async () => {
    const result = await disconnectWallet();
    expect(result.error).toBeNull();
    expect(result.result).toBe(true);
  });
});

describe('wallet events', () => {
  it('registers and unregisters account change handler', () => {
    const on = mock(() => {});
    const off = mock(() => {});
    const provider = { on, off };

    const unsubscribe = onAccountChange(provider as any, () => {});
    expect(on).toHaveBeenCalledWith('accountsChanged', expect.any(Function));

    unsubscribe();
    expect(off).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
  });

  it('registers and unregisters network change handler', () => {
    const on = mock(() => {});
    const off = mock(() => {});
    const provider = { on, off };

    const unsubscribe = onNetworkChanged(provider as any, () => {});
    expect(on).toHaveBeenCalledWith('networkChanged', expect.any(Function));

    unsubscribe();
    expect(off).toHaveBeenCalledWith('networkChanged', expect.any(Function));
  });
});

// ============ Discovery & Deploy Tests ============

import {
  isAccountDeployed,
  getAccountNonce,
  getAccountClassHash,
  estimateDeployAccount,
  deployAccountIfNeeded,
  Account,
  createSigner,
  type DeployAccountPayload,
} from '../account/index.js';
import type { Provider } from '../provider/Provider.js';

function createMockProvider(responses: Record<string, unknown> = {}): Provider {
  return {
    request: async (args: { method: string; params?: unknown[] }) => {
      if (args.method in responses) {
        const response = responses[args.method];
        if (response instanceof Error) {
          throw response;
        }
        return response;
      }
      throw new Error(`Unexpected method: ${args.method}`);
    },
    on: () => ({} as Provider),
    removeListener: () => ({} as Provider),
  } as Provider;
}

function createRpcError(code: number, message: string): Error & { code: number } {
  const error = new Error(message) as Error & { code: number };
  error.code = code;
  return error;
}

describe('Account Discovery', () => {
  describe('isAccountDeployed', () => {
    it('returns true when account is deployed', async () => {
      const provider = createMockProvider({
        starknet_getClassHashAt: '0x12345',
      });

      const { result, error } = await isAccountDeployed(provider, '0xabc');
      expect(error).toBeNull();
      expect(result).toBe(true);
    });

    it('returns false when contract not found (code 20)', async () => {
      const provider = createMockProvider({
        starknet_getClassHashAt: createRpcError(20, 'Contract not found'),
      });

      const { result, error } = await isAccountDeployed(provider, '0xabc');
      expect(error).toBeNull();
      expect(result).toBe(false);
    });

    it('returns error for other RPC errors', async () => {
      const provider = createMockProvider({
        starknet_getClassHashAt: createRpcError(500, 'Internal error'),
      });

      const { result, error } = await isAccountDeployed(provider, '0xabc');
      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.code).toBe('RPC_ERROR');
    });
  });

  describe('getAccountNonce', () => {
    it('returns nonce as bigint', async () => {
      const provider = createMockProvider({
        starknet_getNonce: '0x5',
      });

      const { result, error } = await getAccountNonce(provider, '0xabc');
      expect(error).toBeNull();
      expect(result).toBe(5n);
    });

    it('handles zero nonce', async () => {
      const provider = createMockProvider({
        starknet_getNonce: '0x0',
      });

      const { result, error } = await getAccountNonce(provider, '0xabc');
      expect(error).toBeNull();
      expect(result).toBe(0n);
    });
  });

  describe('getAccountClassHash', () => {
    it('returns class hash as string', async () => {
      const classHash = '0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b';
      const provider = createMockProvider({
        starknet_getClassHashAt: classHash,
      });

      const { result, error } = await getAccountClassHash(provider, '0xabc');
      expect(error).toBeNull();
      expect(result).toBe(classHash);
    });

    it('returns error when not deployed', async () => {
      const provider = createMockProvider({
        starknet_getClassHashAt: createRpcError(20, 'Contract not found'),
      });

      const { result, error } = await getAccountClassHash(provider, '0xabc');
      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.details).toEqual({ code: 20 });
    });
  });
});

describe('Account Deployment', () => {
  describe('estimateDeployAccount', () => {
    it('returns fee estimate', async () => {
      const feeEstimate = {
        gas_consumed: '0x100',
        gas_price: '0x10',
        data_gas_consumed: '0x50',
        data_gas_price: '0x5',
        overall_fee: '0x1050',
        unit: 'WEI' as const,
      };

      const provider = createMockProvider({
        starknet_estimateFee: [feeEstimate],
      });

      const payload: DeployAccountPayload = {
        classHash: '0x12345',
        constructorCalldata: ['0x1'],
        addressSalt: '0xabc',
      };

      const { result, error } = await estimateDeployAccount(provider, payload);
      expect(error).toBeNull();
      expect(result).toEqual(feeEstimate);
    });

    it('returns error on RPC failure', async () => {
      const provider = createMockProvider({
        starknet_estimateFee: createRpcError(500, 'Estimation failed'),
      });

      const payload: DeployAccountPayload = {
        classHash: '0x12345',
      };

      const { result, error } = await estimateDeployAccount(provider, payload);
      expect(result).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('deployAccountIfNeeded', () => {
    it('returns alreadyDeployed:true when deployed', async () => {
      const provider = createMockProvider({
        starknet_getClassHashAt: '0x12345',
      });

      // Use a valid private key (< field prime)
      const signer = createSigner(
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde'
      );
      const account = new Account(provider, '0xabc', signer);

      const payload: DeployAccountPayload = {
        classHash: '0x12345',
      };

      const { result, error } = await deployAccountIfNeeded(account, payload);
      expect(error).toBeNull();
      expect(result?.alreadyDeployed).toBe(true);
      expect(result?.deployResult).toBeUndefined();
    });

    it('deploys when not deployed', async () => {
      const deployResult = {
        transaction_hash: '0xtxhash',
        contract_address: '0xabc',
      };

      const provider = createMockProvider({
        starknet_getClassHashAt: createRpcError(20, 'Contract not found'),
        starknet_chainId: '0x534e5f474f45524c49',
        starknet_addDeployAccountTransaction: deployResult,
      });

      // Use a valid private key (< field prime)
      const signer = createSigner(
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde'
      );
      const account = new Account(provider, '0xabc', signer);

      const payload: DeployAccountPayload = {
        classHash: '0x12345',
        constructorCalldata: ['0x1'],
        addressSalt: '0xabcdef123456',
      };

      const { result, error } = await deployAccountIfNeeded(account, payload);
      expect(error).toBeNull();
      expect(result?.alreadyDeployed).toBe(false);
      expect(result?.deployResult).toBeDefined();
    });
  });
});

describe('Factory connectAccountFromWallet', () => {
  it('creates WalletAccount from wallet provider', async () => {
    const { connectAccountFromWallet } = await import('../account/factory.js');

    const mockProvider = createMockProvider({
      starknet_chainId: '0x534e5f4d41494e',
    });

    const walletProvider = {
      request: mock(async ({ type }: { type: string }) => {
        if (type === WalletRequestType.WALLET_REQUEST_ACCOUNTS) {
          return ['0xaccount1', '0xaccount2'];
        }
        throw new Error(`Unexpected request type: ${type}`);
      }),
      on: mock(() => {}),
      off: mock(() => {}),
    };

    const { result, error } = await connectAccountFromWallet(mockProvider, walletProvider as any);
    expect(error).toBeNull();
    expect(result).toBeDefined();
    expect(result?.address).toBe('0xaccount1');
  });

  it('returns error when no accounts', async () => {
    const { connectAccountFromWallet } = await import('../account/factory.js');

    const mockProvider = createMockProvider({});
    const walletProvider = {
      request: mock(async ({ type }: { type: string }) => {
        if (type === WalletRequestType.WALLET_REQUEST_ACCOUNTS) {
          return [];
        }
        throw new Error(`Unexpected request type: ${type}`);
      }),
      on: mock(() => {}),
      off: mock(() => {}),
    };

    const { result, error } = await connectAccountFromWallet(mockProvider, walletProvider as any);
    expect(result).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.code).toBe('ACCOUNT_REQUIRED');
  });
});

describe('Voltaire-style Results', () => {
  it('discovery functions return {result, error} format', async () => {
    const provider = createMockProvider({
      starknet_getClassHashAt: '0x12345',
      starknet_getNonce: '0x1',
    });

    const deployed = await isAccountDeployed(provider, '0xabc');
    expect('result' in deployed).toBe(true);
    expect('error' in deployed).toBe(true);

    const nonce = await getAccountNonce(provider, '0xabc');
    expect('result' in nonce).toBe(true);
    expect('error' in nonce).toBe(true);

    const classHash = await getAccountClassHash(provider, '0xabc');
    expect('result' in classHash).toBe(true);
    expect('error' in classHash).toBe(true);
  });

  it('deployment functions return {result, error} format', async () => {
    const provider = createMockProvider({
      starknet_estimateFee: [{
        gas_consumed: '0x100',
        gas_price: '0x10',
        data_gas_consumed: '0x50',
        data_gas_price: '0x5',
        overall_fee: '0x1050',
        unit: 'WEI',
      }],
      starknet_getClassHashAt: '0x12345',
    });

    const estimate = await estimateDeployAccount(provider, { classHash: '0x12345' });
    expect('result' in estimate).toBe(true);
    expect('error' in estimate).toBe(true);

    // Use a valid private key (< field prime)
    const signer = createSigner(
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde'
    );
    const account = new Account(provider, '0xabc', signer);
    const deployIfNeeded = await deployAccountIfNeeded(account, { classHash: '0x12345' });
    expect('result' in deployIfNeeded).toBe(true);
    expect('error' in deployIfNeeded).toBe(true);
  });

  it('wallet functions return {result, error} format', async () => {
    const disconnect = await disconnectWallet();
    expect('result' in disconnect).toBe(true);
    expect('error' in disconnect).toBe(true);
  });
});
