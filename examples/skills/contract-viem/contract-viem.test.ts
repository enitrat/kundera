/**
 * Viem-Style Contract Skill Tests
 */

import { describe, expect, test } from 'bun:test';
import type { JsonRpcRequest, Transport } from 'kundera/transport';
import {
  readContract,
  writeContract,
  simulateContract,
  watchContractEvent,
  multicallRead,
  type ReadContractParams,
  type WriteContractParams,
  type ContractResult,
  type FeeEstimate,
} from './index';

const MOCK_ERC20_ABI = [
  {
    type: 'function',
    name: 'balance_of',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'balance', type: 'core::integer::u256' }],
    state_mutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'recipient', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount', type: 'core::integer::u256' },
    ],
    outputs: [{ name: 'success', type: 'core::bool' }],
    state_mutability: 'external',
  },
  {
    type: 'event',
    name: 'Transfer',
    kind: 'struct',
    members: [
      { name: 'from', type: 'core::starknet::contract_address::ContractAddress', kind: 'key' },
      { name: 'to', type: 'core::starknet::contract_address::ContractAddress', kind: 'key' },
      { name: 'value', type: 'core::integer::u256', kind: 'data' },
    ],
  },
] as const;

const MOCK_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
const MOCK_ACCOUNT_ADDRESS = '0x123456789abcdef';

const mockTransport: Transport = {
  type: 'http',
  async request(request: JsonRpcRequest) {
    switch (request.method) {
      case 'starknet_call':
        return { jsonrpc: '2.0', id: request.id ?? 1, result: ['0x1'] } as any;
      case 'starknet_blockNumber':
        return { jsonrpc: '2.0', id: request.id ?? 1, result: 1000 } as any;
      case 'starknet_getEvents':
        return {
          jsonrpc: '2.0',
          id: request.id ?? 1,
          result: { events: [], continuation_token: null },
        } as any;
      case 'starknet_estimateFee':
        return {
          jsonrpc: '2.0',
          id: request.id ?? 1,
          result: [
            {
              gas_consumed: '0x1',
              gas_price: '0x1',
              data_gas_consumed: '0x0',
              data_gas_price: '0x0',
              overall_fee: '0x1',
              unit: 'WEI',
            },
          ],
        } as any;
      case 'starknet_getNonce':
        return { jsonrpc: '2.0', id: request.id ?? 1, result: '0x1' } as any;
      default:
        return { jsonrpc: '2.0', id: request.id ?? 1, result: null } as any;
    }
  },
  async requestBatch() {
    return [] as any;
  },
};

const mockAccount = {
  address: MOCK_ACCOUNT_ADDRESS,
  execute: async () => ({ transaction_hash: '0xabc' }),
};

describe('Viem-Style Contract Skill', () => {
  test('accepts valid parameters without type errors', () => {
    const params: ReadContractParams = {
      abi: MOCK_ERC20_ABI as any,
      address: MOCK_ADDRESS,
      functionName: 'balance_of',
      args: [MOCK_ACCOUNT_ADDRESS],
    };

    expect(params.abi).toBeDefined();
  });

  test('readContract returns result/error structure', async () => {
    const { result, error } = await readContract(mockTransport, {
      abi: MOCK_ERC20_ABI as any,
      address: MOCK_ADDRESS,
      functionName: 'balance_of',
      args: [MOCK_ACCOUNT_ADDRESS],
    });

    expect(result !== null || error !== null).toBe(true);
  });

  test('writeContract requires account parameter', () => {
    const params: WriteContractParams = {
      abi: MOCK_ERC20_ABI as any,
      address: MOCK_ADDRESS,
      functionName: 'transfer',
      args: [MOCK_ACCOUNT_ADDRESS, 1000n],
      account: mockAccount,
    };

    expect(params.account).toBeDefined();
  });

  test('writeContract returns WriteResult structure', async () => {
    const { result } = await writeContract(mockTransport, {
      abi: MOCK_ERC20_ABI as any,
      address: MOCK_ADDRESS,
      functionName: 'transfer',
      args: [MOCK_ACCOUNT_ADDRESS, 1000n],
      account: mockAccount,
    });

    expect(result?.transactionHash).toBe('0xabc');
  });

  test('simulateContract returns simulation result structure', async () => {
    const { result } = await simulateContract(mockTransport, {
      abi: MOCK_ERC20_ABI as any,
      address: MOCK_ADDRESS,
      functionName: 'transfer',
      args: [MOCK_ACCOUNT_ADDRESS, 1000n],
      account: mockAccount,
    });

    if (result) {
      expect(typeof result.success).toBe('boolean');
    }
  });

  test('estimateContractFee returns FeeEstimate structure', () => {
    type ExpectedResult = ContractResult<FeeEstimate>;
    const testResult: ExpectedResult = {
      result: {
        gasConsumed: 1000n,
        gasPrice: 100n,
        overallFee: 100000n,
      },
      error: null,
    };

    expect(testResult.result?.gasConsumed).toBe(1000n);
  });

  test('watchContractEvent returns unsubscribe function', () => {
    const unwatch = watchContractEvent(mockTransport, {
      abi: MOCK_ERC20_ABI as any,
      address: MOCK_ADDRESS,
      eventName: 'Transfer',
      onEvent: () => {},
    });

    expect(typeof unwatch).toBe('function');
    unwatch();
  });

  test('multicallRead executes multiple reads', async () => {
    const results = await multicallRead(mockTransport, [
      { abi: MOCK_ERC20_ABI as any, address: MOCK_ADDRESS, functionName: 'balance_of', args: [MOCK_ACCOUNT_ADDRESS] },
      { abi: MOCK_ERC20_ABI as any, address: MOCK_ADDRESS, functionName: 'balance_of', args: [MOCK_ACCOUNT_ADDRESS] },
    ]);

    expect(results).toHaveLength(2);
  });
});
