import { describe, expect, it } from 'bun:test';
import '../../../src/test-utils/setupCrypto';
import type { Transport } from 'kundera/transport';
import { createAccountDeployer } from './index';

type HandlerMap = Record<string, (params: unknown[] | Record<string, unknown> | undefined) => unknown>;

function createMockTransport(handlers: HandlerMap) {
  const calls: Array<{ method: string; params?: unknown }> = [];
  const transport: Transport = {
    type: 'custom',
    request: async (request) => {
      calls.push({ method: request.method, params: request.params });
      const handler = handlers[request.method];
      if (!handler) {
        throw new Error(`Unhandled RPC method: ${request.method}`);
      }
      return {
        jsonrpc: '2.0',
        id: request.id ?? 1,
        result: handler(request.params),
      };
    },
    requestBatch: async () => {
      throw new Error('Batch requests not supported in test transport');
    },
  };
  return { transport, calls };
}

const feeEstimate = {
  gas_consumed: '1',
  gas_price: '2',
  data_gas_consumed: '0',
  data_gas_price: '0',
  overall_fee: '3',
  unit: 'WEI' as const,
};

describe('account-deploy skill', () => {
  it('submits deploy account transaction via RPC', async () => {
    let signedHash: Uint8Array | undefined;
    const signer = {
      signTransaction: async (hash: Uint8Array) => {
        signedHash = hash;
        return [7n, 8n];
      },
    };

    const payload = {
      classHash: '0x111',
      constructorCalldata: [1n],
      addressSalt: '0xabc',
    };

    const { transport, calls } = createMockTransport({
      starknet_chainId: () => '0x534e5f5345504f4c4941',
      starknet_addDeployAccountTransaction: (params) => {
        const [tx] = params as Array<Record<string, unknown>>;
        expect(tx.type).toBe('DEPLOY_ACCOUNT');
        expect(tx.contract_address_salt).toBe('0xabc');
        const calldata = tx.constructor_calldata as string[];
        expect(BigInt(calldata[0])).toBe(1n);
        return { transaction_hash: '0xaaa', contract_address: '0xbbb' };
      },
    });

    const deployer = createAccountDeployer({ transport, signer });
    const result = await deployer.deployAccount(payload);

    expect(result.transaction_hash).toBe('0xaaa');
    expect(result.contract_address).toBe('0xbbb');
    expect(signedHash).toBeInstanceOf(Uint8Array);

    const addCall = calls.find((call) => call.method === 'starknet_addDeployAccountTransaction');
    const [tx] = (addCall?.params as Array<Record<string, unknown>>) ?? [];
    expect(BigInt((tx.signature as string[])[0])).toBe(7n);
    expect(BigInt((tx.signature as string[])[1])).toBe(8n);
  });

  it('estimates fee for deploy account', async () => {
    const payload = {
      classHash: '0x111',
      constructorCalldata: [1n],
      addressSalt: '0xabc',
    };

    const { transport, calls } = createMockTransport({
      starknet_estimateFee: (params) => {
        const [txs] = params as Array<unknown>;
        const [tx] = txs as Array<Record<string, unknown>>;
        expect(tx.type).toBe('DEPLOY_ACCOUNT');
        expect((tx.signature as string[]).length).toBe(0);
        return [feeEstimate];
      },
    });

    const deployer = createAccountDeployer({
      transport,
      signer: { signTransaction: async () => [0n, 0n] },
    });

    const estimate = await deployer.estimateFee(payload);
    expect(estimate).toEqual(feeEstimate);
    expect(calls.some((call) => call.method === 'starknet_estimateFee')).toBe(true);
  });

  it('passes skipValidate and nonce for deploy account estimate', async () => {
    const payload = {
      classHash: '0x111',
      constructorCalldata: [1n],
      addressSalt: '0xabc',
    };

    const { transport } = createMockTransport({
      starknet_estimateFee: (params) => {
        const [txs, flags] = params as Array<unknown>;
        expect(flags).toEqual(['SKIP_VALIDATE']);
        const [tx] = txs as Array<Record<string, unknown>>;
        expect(tx.type).toBe('DEPLOY_ACCOUNT');
        expect(BigInt(tx.nonce as string)).toBe(9n);
        return [feeEstimate];
      },
    });

    const deployer = createAccountDeployer({
      transport,
      signer: { signTransaction: async () => [0n, 0n] },
    });

    const estimate = await deployer.estimateFee(payload, {
      skipValidate: true,
      nonce: 9n,
    });

    expect(estimate).toEqual(feeEstimate);
  });
});
