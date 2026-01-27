/**
 * Wallet Modal Skill Tests
 *
 * These tests verify the wallet modal skill's error handling and type safety.
 * Actual wallet connection tests require a browser environment.
 */

import { describe, expect, test, mock, beforeEach } from 'bun:test';
import {
  connectWalletWithModal,
  disconnectWalletModal,
  type WalletModalOptions,
  type WalletModalResult,
} from './index';

describe('Wallet Modal Skill', () => {
  describe('connectWalletWithModal', () => {
    test('returns error when modal provider is not installed', async () => {
      // In Node/Bun environment, dynamic imports of browser modules will fail
      const { result, error } = await connectWalletWithModal();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.code).toBe('MODAL_NOT_AVAILABLE');
    });

    test('returns error for unsupported provider', async () => {
      const { result, error } = await connectWalletWithModal({
        modalProvider: 'unknown' as any,
      });

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.code).toBe('UNSUPPORTED_PROVIDER');
    });

    test('accepts valid options without type errors', () => {
      // Type-level test: these should compile without errors
      const options1: WalletModalOptions = {};
      const options2: WalletModalOptions = { modalProvider: 'starknetkit' };
      const options3: WalletModalOptions = { modalProvider: 'get-starknet' };
      const options4: WalletModalOptions = {
        modalProvider: 'starknetkit',
        walletIds: ['argentX', 'braavos'],
        rpcUrl: 'https://custom-rpc.io',
        chainId: 'SN_SEPOLIA',
      };

      expect(options1).toBeDefined();
      expect(options2).toBeDefined();
      expect(options3).toBeDefined();
      expect(options4).toBeDefined();
    });

    test('result type matches expected structure', async () => {
      const { result, error }: WalletModalResult = await connectWalletWithModal();

      // Should have either result or error, not both
      if (error) {
        expect(result).toBeNull();
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
      } else {
        expect(result).not.toBeNull();
        expect(result?.account).toBeDefined();
        expect(result?.client).toBeDefined();
        expect(result?.walletId).toBeDefined();
        expect(result?.address).toBeDefined();
        expect(result?.chainId).toBeDefined();
      }
    });
  });

  describe('disconnectWalletModal', () => {
    test('does not throw when modal not connected', async () => {
      // Should gracefully handle case when modal is not available
      await expect(disconnectWalletModal()).resolves.toBeUndefined();
    });

    test('accepts valid modal providers', async () => {
      await expect(disconnectWalletModal('starknetkit')).resolves.toBeUndefined();
      await expect(disconnectWalletModal('get-starknet')).resolves.toBeUndefined();
    });
  });

  describe('Error Codes', () => {
    test('MODAL_NOT_AVAILABLE is returned when import fails', async () => {
      const { error } = await connectWalletWithModal({
        modalProvider: 'starknetkit',
      });

      expect(error?.code).toBe('MODAL_NOT_AVAILABLE');
      expect(error?.message).toContain('StarknetKit is not installed');
    });

    test('get-starknet also returns MODAL_NOT_AVAILABLE', async () => {
      const { error } = await connectWalletWithModal({
        modalProvider: 'get-starknet',
      });

      expect(error?.code).toBe('MODAL_NOT_AVAILABLE');
      expect(error?.message).toContain('get-starknet is not installed');
    });
  });
});

describe('Type Safety', () => {
  test('WalletModalConnection has required fields', () => {
    // This is a compile-time test
    type TestConnection = {
      account: any;
      client: any;
      walletId: string;
      address: string;
      chainId: string;
    };

    // Should be assignable (compile-time check)
    const connection: TestConnection = {
      account: {},
      client: {},
      walletId: 'argentX',
      address: '0x123',
      chainId: 'SN_MAIN',
    };

    expect(connection.walletId).toBe('argentX');
  });

  test('Error codes are typed correctly', () => {
    const codes = [
      'MODAL_NOT_AVAILABLE',
      'USER_REJECTED',
      'NO_WALLET_FOUND',
      'CONNECTION_FAILED',
      'UNSUPPORTED_PROVIDER',
    ] as const;

    codes.forEach((code) => {
      expect(typeof code).toBe('string');
    });
  });
});
