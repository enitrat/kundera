import { describe, expect, it } from 'bun:test';
import '../../../src/test-utils/setupCrypto';
import type { Transport, TransportRequestOptions } from 'kundera/transport';
import type { SignerInterface } from 'kundera/crypto';
import { createAccountDeclarer } from './index';

type HandlerMap = Record<string, (params: unknown[] | Record<string, unknown> | undefined) => unknown>;

function createMockTransport(handlers: HandlerMap) {
  const calls: Array<{ method: string; params?: unknown }> = [];
  const transport: Transport = {
    type: 'custom',
    request: async <T = unknown>(request: any, _options?: TransportRequestOptions) => {
      calls.push({ method: request.method, params: request.params });
      const handler = handlers[request.method];
      if (!handler) {
        throw new Error(`Unhandled RPC method: ${request.method}`);
      }
      return {
        jsonrpc: '2.0' as const,
        id: request.id ?? 1,
        result: handler(request.params) as T,
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

describe('account-declare skill', () => {
  it('submits declare transaction via RPC', async () => {
    let signedHash: Uint8Array | undefined;
    const signer: SignerInterface = {
      getPubKey: async () => '0x123',
      signRaw: async () => ({ r: 9n as any, s: 10n as any }),
      signMessage: async () => [9n, 10n],
      signTransaction: async (hash: Uint8Array) => {
        signedHash = hash;
        return [9n, 10n];
      },
    };

    const payload = {
      contract: { abi: [], sierra_program: [] },
      classHash: '0x111',
      compiledClassHash: '0x222',
    };

    const { transport, calls } = createMockTransport({
      starknet_chainId: () => '0x534e5f5345504f4c4941',
      starknet_getNonce: () => '0x2',
      starknet_addDeclareTransaction: (params) => {
        const [tx] = params as Array<Record<string, unknown>>;
        if (!tx) throw new Error('Transaction parameter missing');
        expect(tx['type']).toBe('DECLARE');
        expect(tx['compiled_class_hash']).toBe('0x222');
        expect(tx['contract_class']).toBe(payload.contract);
        return { transaction_hash: '0xabc', class_hash: '0xdef' };
      },
    });

    const declarer = createAccountDeclarer({
      transport,
      address: '0xabc',
      signer,
    });

    const result = await declarer.declare(payload);
    expect(result.transaction_hash).toBe('0xabc');
    expect(result.class_hash).toBe('0xdef');
    expect(signedHash).toBeInstanceOf(Uint8Array);

    const addCall = calls.find((call) => call.method === 'starknet_addDeclareTransaction');
    const [tx] = (addCall?.params as Array<Record<string, unknown>>) ?? [];
    if (!tx) throw new Error('Transaction not found');
    const signature = tx['signature'] as string[];
    if (!signature[0] || !signature[1]) throw new Error('Signature incomplete');
    expect(BigInt(signature[0])).toBe(9n);
    expect(BigInt(signature[1])).toBe(10n);
  });

  it('estimates fee for declare', async () => {
    const payload = {
      contract: { abi: [], sierra_program: [] },
      classHash: '0x111',
      compiledClassHash: '0x222',
    };

    const { transport, calls } = createMockTransport({
      starknet_getNonce: () => '0x2',
      starknet_estimateFee: (params) => {
        const [txs] = params as Array<unknown>;
        const [tx] = txs as Array<Record<string, unknown>>;
        if (!tx) throw new Error('Transaction parameter missing');
        expect(tx['type']).toBe('DECLARE');
        expect((tx['signature'] as string[]).length).toBe(0);
        return [feeEstimate];
      },
    });

    const declarer = createAccountDeclarer({
      transport,
      address: '0xabc',
      signer: {
        getPubKey: async () => '0x123',
        signRaw: async () => ({ r: 0n as any, s: 0n as any }),
        signMessage: async () => [0n, 0n],
        signTransaction: async () => [0n, 0n],
      },
    });

    const estimate = await declarer.estimateFee(payload);
    expect(estimate).toEqual(feeEstimate);
    expect(calls.some((call) => call.method === 'starknet_estimateFee')).toBe(true);
  });

  it('uses provided nonce when declaring', async () => {
    const payload = {
      contract: { abi: [], sierra_program: [] },
      classHash: '0x111',
      compiledClassHash: '0x222',
    };

    const { transport } = createMockTransport({
      starknet_chainId: () => '0x534e5f5345504f4c4941',
      starknet_addDeclareTransaction: (params) => {
        const [tx] = params as Array<Record<string, unknown>>;
        if (!tx) throw new Error('Transaction parameter missing');
        expect(tx['type']).toBe('DECLARE');
        expect(BigInt(tx['nonce'] as string)).toBe(7n);
        return { transaction_hash: '0xabc', class_hash: '0xdef' };
      },
    });

    const declarer = createAccountDeclarer({
      transport,
      address: '0xabc',
      signer: {
        getPubKey: async () => '0x123',
        signRaw: async () => ({ r: 0n as any, s: 0n as any }),
        signMessage: async () => [0n, 0n],
        signTransaction: async () => [0n, 0n],
      },
    });

    await declarer.declare(payload, { nonce: 7n });
  });
});
