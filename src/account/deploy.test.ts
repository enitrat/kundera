/**
 * Account Deployment Helpers Tests
 */

import { describe, it, expect, mock } from 'bun:test';
import { estimateDeployAccount, deployAccountIfNeeded } from './deploy.js';
import type { DeployAccountPayload } from './types.js';

describe('estimateDeployAccount', () => {
  it('calls starknet_estimateFee with deploy account tx', async () => {
    const provider = {
      request: mock(async ({ method }: { method: string }) => {
        if (method === 'starknet_estimateFee') {
          return [
            {
              gas_consumed: '0x10',
              gas_price: '0x1',
              data_gas_consumed: '0x0',
              data_gas_price: '0x0',
              overall_fee: '0x10',
              unit: 'WEI',
            },
          ];
        }
        throw new Error(`Unexpected method: ${method}`);
      }),
    };

    const payload: DeployAccountPayload = {
      classHash: '0x1234',
      constructorCalldata: ['0x1'],
      addressSalt: '0x2',
    };

    const result = await estimateDeployAccount(provider as any, payload);
    expect(result.error).toBeNull();
    expect(result.result?.overall_fee).toBe('0x10');
    expect(provider.request).toHaveBeenCalledWith({
      method: 'starknet_estimateFee',
      params: [expect.any(Array), expect.any(Array), 'pending'],
    });
  });
});

describe('deployAccountIfNeeded', () => {
  it('returns alreadyDeployed when account exists', async () => {
    const provider = {
      request: mock(async ({ method }: { method: string }) => {
        if (method === 'starknet_getClassHashAt') {
          return '0xclasshash';
        }
        throw new Error(`Unexpected method: ${method}`);
      }),
    };

    const account = {
      provider,
      address: '0xabc',
      deployAccount: mock(async () => {
        throw new Error('should not be called');
      }),
    };

    const result = await deployAccountIfNeeded(
      account as any,
      { classHash: '0x1', constructorCalldata: [] }
    );

    expect(result.error).toBeNull();
    expect(result.result?.alreadyDeployed).toBe(true);
  });

  it('deploys when account is not deployed', async () => {
    const provider = {
      request: mock(async ({ method }: { method: string }) => {
        if (method === 'starknet_getClassHashAt') {
          throw { code: 20, message: 'Contract not found' };
        }
        throw new Error(`Unexpected method: ${method}`);
      }),
    };

    const account = {
      provider,
      address: '0xabc',
      deployAccount: mock(async () => ({
        transaction_hash: '0xdeploy',
        contract_address: '0xaddr',
      })),
    };

    const result = await deployAccountIfNeeded(
      account as any,
      { classHash: '0x1', constructorCalldata: [] }
    );

    expect(result.error).toBeNull();
    expect(result.result?.alreadyDeployed).toBe(false);
    expect(result.result?.deployResult?.transaction_hash).toBe('0xdeploy');
  });
});
