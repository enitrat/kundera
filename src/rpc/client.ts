/**
 * Starknet JSON-RPC Client
 *
 * A lightweight, fetch-based client for Starknet JSON-RPC API.
 */

import type {
  Felt252Type,
  ContractAddressType,
  ClassHashType,
} from '../primitives/index.js';
import { toHex } from '../primitives/index.js';

// ============ Types ============

/**
 * Block identifier types
 */
export type BlockTag = 'latest' | 'pending';
export type BlockNumber = number;
export type BlockHash = string;
export type BlockId =
  | BlockTag
  | { block_number: BlockNumber }
  | { block_hash: BlockHash };

/**
 * JSON-RPC error
 */
export interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * JSON-RPC response
 */
interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: RpcError;
}

/**
 * Call request for starknet_call
 */
export interface FunctionCall {
  contract_address: string;
  entry_point_selector: string;
  calldata: string[];
}

/**
 * Transaction receipt status
 */
export type TransactionStatus =
  | 'RECEIVED'
  | 'REJECTED'
  | 'ACCEPTED_ON_L2'
  | 'ACCEPTED_ON_L1';

/**
 * Basic block header info
 */
export interface BlockHeader {
  block_hash: string;
  parent_hash: string;
  block_number: number;
  sequencer_address: string;
  new_root: string;
  timestamp: number;
  starknet_version: string;
}

/**
 * Chain ID result
 */
export type ChainId = string;

/**
 * Nonce result
 */
export type Nonce = string;

/**
 * Storage value result
 */
export type StorageValue = string;

/**
 * Class at address result (simplified)
 */
export interface ContractClass {
  sierra_program?: string[];
  contract_class_version?: string;
  entry_points_by_type?: {
    CONSTRUCTOR?: { selector: string; function_idx: number }[];
    EXTERNAL?: { selector: string; function_idx: number }[];
    L1_HANDLER?: { selector: string; function_idx: number }[];
  };
  abi?: string;
}

// ============ Client ============

/**
 * Configuration for the RPC client
 */
export interface RpcClientConfig {
  /** RPC endpoint URL */
  url: string;
  /** Custom fetch implementation (for testing) */
  fetch?: typeof globalThis.fetch;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Starknet JSON-RPC Client
 */
export class StarknetRpcClient {
  private url: string;
  private fetchFn: typeof globalThis.fetch;
  private timeout: number;
  private headers: Record<string, string>;
  private requestId = 0;

  constructor(config: RpcClientConfig) {
    this.url = config.url;
    this.fetchFn = config.fetch ?? globalThis.fetch;
    this.timeout = config.timeout ?? 30000;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Make a JSON-RPC call
   */
  private async call<T>(method: string, params: unknown[]): Promise<T> {
    const id = ++this.requestId;
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(this.url, {
        method: 'POST',
        headers: this.headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as JsonRpcResponse<T>;

      if (json.error) {
        const err = new Error(json.error.message) as Error & {
          code: number;
          data: unknown;
        };
        err.code = json.error.code;
        err.data = json.error.data;
        throw err;
      }

      return json.result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ============ Read Methods ============

  /**
   * Get the chain ID
   */
  async chainId(): Promise<ChainId> {
    return this.call<ChainId>('starknet_chainId', []);
  }

  /**
   * Get the current block number
   */
  async blockNumber(): Promise<number> {
    return this.call<number>('starknet_blockNumber', []);
  }

  /**
   * Get block with transaction hashes
   */
  async getBlockWithTxHashes(blockId: BlockId): Promise<BlockHeader & { transactions: string[] }> {
    return this.call('starknet_getBlockWithTxHashes', [
      this.formatBlockId(blockId),
    ]);
  }

  /**
   * Get the nonce of an account
   */
  async getNonce(
    contractAddress: ContractAddressType | string,
    blockId: BlockId = 'latest'
  ): Promise<Nonce> {
    const address =
      typeof contractAddress === 'string'
        ? contractAddress
        : toHex(contractAddress);
    return this.call<Nonce>('starknet_getNonce', [
      this.formatBlockId(blockId),
      address,
    ]);
  }

  /**
   * Get a storage value
   */
  async getStorageAt(
    contractAddress: ContractAddressType | string,
    key: Felt252Type | string,
    blockId: BlockId = 'latest'
  ): Promise<StorageValue> {
    const address =
      typeof contractAddress === 'string'
        ? contractAddress
        : toHex(contractAddress);
    const keyHex = typeof key === 'string' ? key : toHex(key);
    return this.call<StorageValue>('starknet_getStorageAt', [
      address,
      keyHex,
      this.formatBlockId(blockId),
    ]);
  }

  /**
   * Get the class hash at a contract address
   */
  async getClassHashAt(
    contractAddress: ContractAddressType | string,
    blockId: BlockId = 'latest'
  ): Promise<string> {
    const address =
      typeof contractAddress === 'string'
        ? contractAddress
        : toHex(contractAddress);
    return this.call<string>('starknet_getClassHashAt', [
      this.formatBlockId(blockId),
      address,
    ]);
  }

  /**
   * Get the class at a contract address
   */
  async getClassAt(
    contractAddress: ContractAddressType | string,
    blockId: BlockId = 'latest'
  ): Promise<ContractClass> {
    const address =
      typeof contractAddress === 'string'
        ? contractAddress
        : toHex(contractAddress);
    return this.call<ContractClass>('starknet_getClassAt', [
      this.formatBlockId(blockId),
      address,
    ]);
  }

  /**
   * Get a class by its hash
   */
  async getClass(
    classHash: ClassHashType | string,
    blockId: BlockId = 'latest'
  ): Promise<ContractClass> {
    const hash =
      typeof classHash === 'string' ? classHash : toHex(classHash);
    return this.call<ContractClass>('starknet_getClass', [
      this.formatBlockId(blockId),
      hash,
    ]);
  }

  /**
   * Call a contract function (read-only)
   */
  async callContract(
    request: FunctionCall,
    blockId: BlockId = 'latest'
  ): Promise<string[]> {
    return this.call<string[]>('starknet_call', [
      request,
      this.formatBlockId(blockId),
    ]);
  }

  /**
   * Estimate fee for a transaction
   */
  async estimateFee(
    transaction: unknown,
    blockId: BlockId = 'latest'
  ): Promise<{ gas_consumed: string; gas_price: string; overall_fee: string }> {
    return this.call('starknet_estimateFee', [
      [transaction],
      [],
      this.formatBlockId(blockId),
    ]);
  }

  /**
   * Get transaction by hash
   */
  async getTransactionByHash(txHash: string): Promise<unknown> {
    return this.call('starknet_getTransactionByHash', [txHash]);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<unknown> {
    return this.call('starknet_getTransactionReceipt', [txHash]);
  }

  /**
   * Get events matching a filter
   */
  async getEvents(filter: {
    from_block?: BlockId;
    to_block?: BlockId;
    address?: string;
    keys?: string[][];
    continuation_token?: string;
    chunk_size: number;
  }): Promise<{
    events: unknown[];
    continuation_token?: string;
  }> {
    const formatted = {
      ...filter,
      from_block: filter.from_block
        ? this.formatBlockId(filter.from_block)
        : undefined,
      to_block: filter.to_block
        ? this.formatBlockId(filter.to_block)
        : undefined,
    };
    return this.call('starknet_getEvents', [{ filter: formatted }]);
  }

  // ============ Helpers ============

  /**
   * Format a block ID for the RPC
   */
  private formatBlockId(
    blockId: BlockId
  ): string | { block_number: number } | { block_hash: string } {
    if (typeof blockId === 'string') {
      return blockId;
    }
    return blockId;
  }
}

// ============ Factory ============

/**
 * Create a new RPC client
 */
export function createClient(config: RpcClientConfig): StarknetRpcClient {
  return new StarknetRpcClient(config);
}

/**
 * Create client for Starknet mainnet (via public endpoint)
 */
export function mainnet(
  options?: Omit<RpcClientConfig, 'url'>
): StarknetRpcClient {
  return createClient({
    url: 'https://starknet-mainnet.public.blastapi.io',
    ...options,
  });
}

/**
 * Create client for Starknet Sepolia testnet
 */
export function sepolia(
  options?: Omit<RpcClientConfig, 'url'>
): StarknetRpcClient {
  return createClient({
    url: 'https://starknet-sepolia.public.blastapi.io',
    ...options,
  });
}
