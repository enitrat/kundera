import { describe, expect, it } from 'bun:test';
import '../../../src/test-utils/setupCrypto';
import type { Transport } from 'kundera/transport';
import { createAccountInvoker } from './index';

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

describe('account-invoke skill', () => {
  it('executes via RPC and formats signature', async () => {
    let signedHash: Uint8Array | undefined;
    const signer = {
      signTransaction: async (hash: Uint8Array) => {
        signedHash = hash;
        return [1n, 2n];
      },
    };

    const { transport, calls } = createMockTransport({
      starknet_chainId: () => '0x534e5f5345504f4c4941',
      starknet_getNonce: () => '0x1',
      starknet_addInvokeTransaction: (params) => {
        const [tx] = params as Array<Record<string, unknown>>;
        expect(tx.type).toBe('INVOKE');
        return { transaction_hash: '0x123' };
      },
    });

    const account = createAccountInvoker({
      transport,
      address: '0xabc',
      signer,
    });

    const result = await account.execute({
      contractAddress: '0x1',
      entrypoint: 'transfer',
      calldata: [1n],
    });

    expect(result.transaction_hash).toBe('0x123');
    expect(signedHash).toBeInstanceOf(Uint8Array);

    const addCall = calls.find((call) => call.method === 'starknet_addInvokeTransaction');
    const [tx] = (addCall?.params as Array<Record<string, unknown>>) ?? [];
    expect(BigInt((tx.signature as string[])[0])).toBe(1n);
    expect(BigInt((tx.signature as string[])[1])).toBe(2n);
  });

  it('estimates fee for invoke', async () => {
    const { transport, calls } = createMockTransport({
      starknet_getNonce: () => '0x1',
      starknet_estimateFee: (params) => {
        const [txs] = params as Array<unknown>;
        const [tx] = txs as Array<Record<string, unknown>>;
        expect(tx.type).toBe('INVOKE');
        expect((tx.signature as string[]).length).toBe(0);
        return [feeEstimate];
      },
    });

    const account = createAccountInvoker({
      transport,
      address: '0xabc',
      signer: { signTransaction: async () => [0n, 0n] },
    });

    const estimate = await account.estimateFee({
      contractAddress: '0x1',
      entrypoint: 'transfer',
      calldata: [1n],
    });

    expect(estimate).toEqual(feeEstimate);
    expect(calls.some((call) => call.method === 'starknet_estimateFee')).toBe(true);
  });

  it('passes skipValidate when estimating fee', async () => {
    const { transport } = createMockTransport({
      starknet_getNonce: () => '0x1',
      starknet_estimateFee: (params) => {
        const [txs, flags] = params as Array<unknown>;
        expect(flags).toEqual(['SKIP_VALIDATE']);
        const [tx] = txs as Array<Record<string, unknown>>;
        expect(tx.type).toBe('INVOKE');
        return [feeEstimate];
      },
    });

    const account = createAccountInvoker({
      transport,
      address: '0xabc',
      signer: { signTransaction: async () => [0n, 0n] },
    });

    const estimate = await account.estimateFee(
      {
        contractAddress: '0x1',
        entrypoint: 'transfer',
        calldata: [1n],
      },
      { skipValidate: true },
    );

    expect(estimate).toEqual(feeEstimate);
  });
});
