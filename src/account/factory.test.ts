/**
 * Account Factory Helpers Tests
 */

import { describe, it, expect, mock } from 'bun:test';
import { connectAccountFromWallet, createAccountFromSigner } from './factory.js';
import { Account } from './Account.js';
import { createSigner } from './Signer.js';
import { WalletRequestType } from './WalletAccount.js';

describe('connectAccountFromWallet', () => {
  const createProvider = () => ({
    request: mock(async () => '0x534e5f5345504f4c4941'),
  });

  it('creates WalletAccount from wallet provider', async () => {
    const walletProvider = {
      request: mock(async ({ type }: { type: string }) => {
        if (type === WalletRequestType.WALLET_REQUEST_ACCOUNTS) {
          return ['0xaccount1'];
        }
        throw new Error(`Unexpected request type: ${type}`);
      }),
      on: mock(() => {}),
      off: mock(() => {}),
    };

    const result = await connectAccountFromWallet(
      createProvider() as any,
      walletProvider as any
    );

    expect(result.error).toBeNull();
    expect(result.result?.address).toBe('0xaccount1');
  });

  it('returns error when no accounts are available', async () => {
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

    const result = await connectAccountFromWallet(
      createProvider() as any,
      walletProvider as any
    );

    expect(result.result).toBeNull();
    expect(result.error?.code).toBe('ACCOUNT_REQUIRED');
    expect(result.error?.message).toContain('No accounts');
  });
});

describe('createAccountFromSigner', () => {
  it('creates Account instance', () => {
    const provider = { request: async () => {} };
    const signer = createSigner('0x1234');
    const account = createAccountFromSigner(provider as any, '0xabc', signer);
    expect(account).toBeInstanceOf(Account);
  });
});
