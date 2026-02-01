/**
 * Wallet Modal Skill Tests
 */

import { describe, expect, test } from 'bun:test';
import {
  connectWalletWithModal,
  disconnectWalletModal,
  type WalletModalOptions,
  type WalletModalResult,
} from './index';

describe('Wallet Modal Skill', () => {
  describe('connectWalletWithModal', () => {
    test('returns error when modal provider is not installed', async () => {
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

      if (error) {
        expect(result).toBeNull();
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
      } else {
        expect(result).not.toBeNull();
        expect(result?.walletProvider).toBeDefined();
        expect(result?.transport).toBeDefined();
        expect(result?.walletId).toBeDefined();
        expect(result?.address).toBeDefined();
        expect(result?.chainId).toBeDefined();
      }
    });
  });

  describe('disconnectWalletModal', () => {
    test('does not throw when modal not connected', async () => {
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
