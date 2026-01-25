/**
 * Contract Module Tests
 */

import { describe, expect, it, mock } from 'bun:test';
import { getContract, type Account } from './index.js';
import type { Abi } from '../abi/index.js';
import type { StarknetRpcClient } from '../rpc/client.js';

// ============ Test ABI ============

const ERC20_ABI: Abi = [
  {
    type: 'struct',
    name: 'core::integer::u256',
    members: [
      { name: 'low', type: 'core::integer::u128' },
      { name: 'high', type: 'core::integer::u128' },
    ],
  },
  {
    type: 'function',
    name: 'balance_of',
    inputs: [
      { name: 'account', type: 'core::starknet::contract_address::ContractAddress' },
    ],
    outputs: [
      { name: 'balance', type: 'core::integer::u256' },
    ],
    state_mutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'recipient', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount', type: 'core::integer::u256' },
    ],
    outputs: [
      { name: 'success', type: 'core::bool' },
    ],
    state_mutability: 'external',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [
      { name: 'name', type: 'core::felt252' },
    ],
    state_mutability: 'view',
  },
];

// ============ Mock Client ============

function createMockClient(responses: Record<string, string[]>): StarknetRpcClient {
  return {
    callContract: async (request: { entry_point_selector: string }) => {
      const key = request.entry_point_selector;
      if (responses[key]) {
        return responses[key];
      }
      // Default: return balance of 1000
      return ['0x3e8', '0x0']; // 1000 as u256
    },
    estimateFee: async () => ({
      gas_consumed: '0x100',
      gas_price: '0x10',
      overall_fee: '0x1000',
    }),
  } as unknown as StarknetRpcClient;
}

// ============ Mock Account ============

function createMockAccount(
  address: string,
  txHash: string = '0xabc123'
): Account {
  return {
    address,
    execute: async (calls) => {
      return { transaction_hash: txHash };
    },
  };
}

// ============ Contract Creation Tests ============

describe('getContract', () => {
  it('should create contract instance', () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
    });

    expect(contract.address).toBe('0x123');
    expect(contract.abi).toBe(ERC20_ABI);
  });

  it('should expose read/write/populate/estimateFee methods', () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
    });

    expect(typeof contract.read).toBe('function');
    expect(typeof contract.write).toBe('function');
    expect(typeof contract.populate).toBe('function');
    expect(typeof contract.estimateFee).toBe('function');
  });
});

// ============ Read Tests ============

describe('contract.read()', () => {
  it('should call provider with encoded calldata', async () => {
    let capturedRequest: any = null;
    const mockClient = {
      callContract: async (request: any) => {
        capturedRequest = request;
        return ['0x3e8', '0x0']; // 1000 as u256
      },
    } as unknown as StarknetRpcClient;

    const contract = getContract({
      abi: ERC20_ABI,
      address: '0xcontract',
      client: mockClient,
    });

    const result = await contract.read('balance_of', ['0x123']);

    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest.contract_address).toBe('0xcontract');
    expect(capturedRequest.calldata).toContain('0x123');
    expect(result.error).toBeNull();
    expect(result.result).toEqual([1000n]);
  });

  it('should decode u256 return value', async () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
    });

    const result = await contract.read('balance_of', ['0x456']);

    expect(result.error).toBeNull();
    expect(result.result![0]).toBe(1000n);
  });

  it('should support object arguments', async () => {
    let capturedRequest: any = null;
    const mockClient = {
      callContract: async (request: any) => {
        capturedRequest = request;
        return ['0x1']; // true
      },
    } as unknown as StarknetRpcClient;

    const contract = getContract({
      abi: ERC20_ABI,
      address: '0xcontract',
      client: mockClient,
    });

    // Note: this won't actually work for 'transfer' as it's external
    // Using balance_of which is view
    await contract.read('balance_of', { account: '0x789' });

    expect(capturedRequest.calldata).toContain('0x789');
  });

  it('should return error for unknown function', async () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
    });

    const result = await contract.read('nonexistent', []);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('FUNCTION_NOT_FOUND');
  });
});

// ============ Write Tests ============

describe('contract.write()', () => {
  it('should require account', async () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
      // No account provided
    });

    const result = await contract.write('transfer', ['0x456', 100n]);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('ACCOUNT_REQUIRED');
  });

  it('should execute via account when provided', async () => {
    const client = createMockClient({});
    let capturedCalls: any[] = [];
    const account: Account = {
      address: '0xaccount',
      execute: async (calls) => {
        capturedCalls = calls;
        return { transaction_hash: '0xtxhash' };
      },
    };

    const contract = getContract({
      abi: ERC20_ABI,
      address: '0xcontract',
      client,
      account,
    });

    const result = await contract.write('transfer', ['0x456', 100n]);

    expect(result.error).toBeNull();
    expect(result.result!.transactionHash).toBe('0xtxhash');
    expect(capturedCalls.length).toBe(1);
    expect(capturedCalls[0].contractAddress).toBe('0xcontract');
  });

  it('should return {result, error} style', async () => {
    const client = createMockClient({});
    const account = createMockAccount('0xaccount', '0xhash');

    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
      account,
    });

    const result = await contract.write('transfer', ['0x456', 100n]);

    expect(result).toHaveProperty('result');
    expect(result).toHaveProperty('error');
    expect(result.error).toBeNull();
    expect(result.result!.transactionHash).toBe('0xhash');
  });
});

// ============ Populate Tests ============

describe('contract.populate()', () => {
  it('should return Call object without network call', () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0xcontract',
      client,
    });

    const result = contract.populate('transfer', ['0x456', 1000n]);

    expect(result.error).toBeNull();
    expect(result.result!.contractAddress).toBe('0xcontract');
    expect(result.result!.entrypoint).toBeTruthy(); // selector hex
    expect(result.result!.calldata).toEqual([0x456n, 1000n, 0n]); // recipient, amount_low, amount_high
  });

  it('should error on invalid function', () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
    });

    const result = contract.populate('nonexistent', []);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('FUNCTION_NOT_FOUND');
  });
});

// ============ EstimateFee Tests ============

describe('contract.estimateFee()', () => {
  it('should call provider estimateFee', async () => {
    let called = false;
    const mockClient = {
      callContract: async () => ['0x0'],
      estimateFee: async () => {
        called = true;
        return {
          gas_consumed: '0x100',
          gas_price: '0x10',
          overall_fee: '0x1000',
        };
      },
    } as unknown as StarknetRpcClient;

    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client: mockClient,
    });

    const result = await contract.estimateFee('transfer', ['0x456', 100n]);

    expect(called).toBe(true);
    expect(result.error).toBeNull();
    expect(result.result!.gasConsumed).toBe(0x100n);
    expect(result.result!.gasPrice).toBe(0x10n);
    expect(result.result!.overallFee).toBe(0x1000n);
  });
});

// ============ GetSelector Tests ============

describe('contract.getSelector()', () => {
  it('should return selector for known function', () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
    });

    const result = contract.getSelector('transfer');

    expect(result.error).toBeNull();
    expect(result.result!.selector).toBeGreaterThan(0n);
    expect(result.result!.selectorHex).toMatch(/^0x[0-9a-f]+$/);
  });

  it('should error for unknown function', () => {
    const client = createMockClient({});
    const contract = getContract({
      abi: ERC20_ABI,
      address: '0x123',
      client,
    });

    const result = contract.getSelector('nonexistent');

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('FUNCTION_NOT_FOUND');
  });
});
