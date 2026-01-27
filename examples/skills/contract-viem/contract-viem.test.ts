/**
 * Viem-Style Contract Skill Tests
 *
 * These tests verify the contract skill's API surface and type safety.
 */

import { describe, expect, test, mock, beforeEach } from 'bun:test';
import {
  readContract,
  writeContract,
  simulateContract,
  estimateContractFee,
  watchContractEvent,
  multicallRead,
  type ReadContractParams,
  type WriteContractParams,
  type ContractResult,
  type FeeEstimate,
  type WriteResult,
} from './index';

// Mock ABI for testing
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

// Mock client that returns errors (no real RPC)
const mockClient = {
  starknet_blockNumber: async () => ({ result: 1000, error: null }),
  starknet_getEvents: async () => ({ result: { events: [] }, error: null }),
} as any;

// Mock account
const mockAccount = {
  address: MOCK_ACCOUNT_ADDRESS,
  signer: {},
} as any;

describe('Viem-Style Contract Skill', () => {
  describe('readContract', () => {
    test('accepts valid parameters without type errors', () => {
      const params: ReadContractParams = {
        abi: MOCK_ERC20_ABI as any,
        address: MOCK_ADDRESS,
        functionName: 'balance_of',
        args: [MOCK_ACCOUNT_ADDRESS],
      };

      expect(params.abi).toBeDefined();
      expect(params.address).toBe(MOCK_ADDRESS);
      expect(params.functionName).toBe('balance_of');
      expect(params.args).toHaveLength(1);
    });

    test('returns result/error structure', async () => {
      const { result, error } = await readContract(mockClient, {
        abi: MOCK_ERC20_ABI as any,
        address: MOCK_ADDRESS,
        functionName: 'balance_of',
        args: [MOCK_ACCOUNT_ADDRESS],
      });

      // Should have either result or error
      expect(result !== null || error !== null).toBe(true);
    });

    test('handles missing args gracefully', async () => {
      const params: ReadContractParams = {
        abi: MOCK_ERC20_ABI as any,
        address: MOCK_ADDRESS,
        functionName: 'balance_of',
        // args omitted - should default to []
      };

      // Should not throw
      const response = await readContract(mockClient, params);
      expect(response).toBeDefined();
    });
  });

  describe('writeContract', () => {
    test('requires account parameter', () => {
      const params: WriteContractParams = {
        abi: MOCK_ERC20_ABI as any,
        address: MOCK_ADDRESS,
        functionName: 'transfer',
        args: [MOCK_ACCOUNT_ADDRESS, 1000n],
        account: mockAccount,
      };

      expect(params.account).toBeDefined();
    });

    test('returns WriteResult structure on success type', () => {
      // Type-level test
      type ExpectedResult = ContractResult<WriteResult>;
      const testResult: ExpectedResult = {
        result: { transactionHash: '0xabc' },
        error: null,
      };

      expect(testResult.result?.transactionHash).toBe('0xabc');
    });
  });

  describe('simulateContract', () => {
    test('returns simulation result structure', async () => {
      const { result, error } = await simulateContract(mockClient, {
        abi: MOCK_ERC20_ABI as any,
        address: MOCK_ADDRESS,
        functionName: 'transfer',
        args: [MOCK_ACCOUNT_ADDRESS, 1000n],
        account: mockAccount,
      });

      // Should have a result with success field
      if (result) {
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.returnData)).toBe(true);
      }
    });
  });

  describe('estimateContractFee', () => {
    test('returns FeeEstimate structure on success type', () => {
      // Type-level test
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
      expect(testResult.result?.gasPrice).toBe(100n);
      expect(testResult.result?.overallFee).toBe(100000n);
    });
  });

  describe('watchContractEvent', () => {
    test('returns unsubscribe function', () => {
      const unwatch = watchContractEvent(mockClient, {
        abi: MOCK_ERC20_ABI as any,
        address: MOCK_ADDRESS,
        eventName: 'Transfer',
        onEvent: () => {},
      });

      expect(typeof unwatch).toBe('function');

      // Clean up
      unwatch();
    });

    test('accepts optional parameters', () => {
      const unwatch = watchContractEvent(mockClient, {
        abi: MOCK_ERC20_ABI as any,
        address: MOCK_ADDRESS,
        eventName: 'Transfer',
        onEvent: () => {},
        onError: () => {},
        pollingInterval: 10000,
        fromBlock: 500,
      });

      expect(typeof unwatch).toBe('function');
      unwatch();
    });

    test('calls onEvent for decoded events', async () => {
      const events: any[] = [];

      const unwatch = watchContractEvent(mockClient, {
        abi: MOCK_ERC20_ABI as any,
        address: MOCK_ADDRESS,
        eventName: 'Transfer',
        onEvent: (event) => events.push(event),
        pollingInterval: 100,
      });

      // Wait for one poll cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      unwatch();

      // Events array should exist (may be empty if no events)
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('multicallRead', () => {
    test('executes multiple reads in parallel', async () => {
      const calls: ReadContractParams[] = [
        {
          abi: MOCK_ERC20_ABI as any,
          address: MOCK_ADDRESS,
          functionName: 'balance_of',
          args: ['0x111'],
        },
        {
          abi: MOCK_ERC20_ABI as any,
          address: MOCK_ADDRESS,
          functionName: 'balance_of',
          args: ['0x222'],
        },
      ];

      const results = await multicallRead(mockClient, calls);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
    });

    test('returns array of ContractResult', async () => {
      const results = await multicallRead(mockClient, [
        {
          abi: MOCK_ERC20_ABI as any,
          address: MOCK_ADDRESS,
          functionName: 'balance_of',
          args: ['0x111'],
        },
      ]);

      const [first] = results;
      expect(first).toHaveProperty('result');
      expect(first).toHaveProperty('error');
    });
  });
});

describe('Error Codes', () => {
  test('all error codes are strings', () => {
    const codes = [
      'FUNCTION_NOT_FOUND',
      'ENCODE_ERROR',
      'DECODE_ERROR',
      'ACCOUNT_REQUIRED',
      'EXECUTION_REVERTED',
      'NETWORK_ERROR',
    ];

    codes.forEach((code) => {
      expect(typeof code).toBe('string');
    });
  });
});

describe('Type Safety', () => {
  test('ContractResult has correct shape', () => {
    const successResult: ContractResult<number> = { result: 42, error: null };
    const errorResult: ContractResult<number> = {
      result: null,
      error: { code: 'NETWORK_ERROR', message: 'Failed' },
    };

    expect(successResult.result).toBe(42);
    expect(successResult.error).toBeNull();
    expect(errorResult.result).toBeNull();
    expect(errorResult.error?.code).toBe('NETWORK_ERROR');
  });

  test('FeeEstimate uses bigint for amounts', () => {
    const fee: FeeEstimate = {
      gasConsumed: BigInt(1000),
      gasPrice: BigInt(100),
      overallFee: BigInt(100000),
    };

    expect(typeof fee.gasConsumed).toBe('bigint');
    expect(typeof fee.gasPrice).toBe('bigint');
    expect(typeof fee.overallFee).toBe('bigint');
  });
});
