/**
 * HTTP Provider Skill
 *
 * Lightweight JSON-RPC provider built on Kundera's transport + rpc primitives.
 * Copy into your codebase and tailor methods as needed.
 */

import {
  httpTransport,
  type HttpTransportOptions,
  type Transport,
} from 'kundera/transport';
import {
  starknet_chainId,
  starknet_blockNumber,
  starknet_blockHashAndNumber,
  starknet_specVersion,
  starknet_getBlockWithTxHashes,
  starknet_getBlockWithTxs,
  starknet_getBlockWithReceipts,
  starknet_getStateUpdate,
  starknet_getStorageAt,
  starknet_getClass,
  starknet_getClassHashAt,
  starknet_getClassAt,
  starknet_getBlockTransactionCount,
  starknet_call,
  starknet_estimateFee,
  starknet_estimateMessageFee,
  starknet_getTransactionByHash,
  starknet_getTransactionReceipt,
  starknet_getTransactionStatus,
  starknet_getEvents,
  starknet_getNonce,
  starknet_getStorageProof,
  starknet_addInvokeTransaction,
  starknet_addDeclareTransaction,
  starknet_addDeployAccountTransaction,
  starknet_simulateTransactions,
  starknet_traceTransaction,
  starknet_traceBlockTransactions,
} from 'kundera/rpc';
import type {
  BlockId,
  BroadcastedTxn,
  BroadcastedInvokeTxn,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  ContractClassResponse,
  EventsFilter,
  FunctionCall,
  SimulationFlag,
} from 'kundera/rpc';
import type { ContractAddressType, ClassHashType, Felt252Type } from 'kundera/primitives';

export interface HttpProviderOptions {
  /** RPC endpoint URL */
  url: string;
  /** Transport options */
  transport?: Omit<HttpTransportOptions, 'batch'> & { batch?: HttpTransportOptions['batch'] };
}

export interface HttpProvider {
  transport: Transport;
  specVersion: () => Promise<string>;
  chainId: () => Promise<string>;
  blockNumber: () => Promise<number>;
  blockHashAndNumber: () => Promise<{ block_hash: string; block_number: number }>;
  getBlockWithTxHashes: (blockId?: BlockId) => Promise<unknown>;
  getBlockWithTxs: (blockId?: BlockId) => Promise<unknown>;
  getBlockWithReceipts: (blockId?: BlockId) => Promise<unknown>;
  getStateUpdate: (blockId?: BlockId) => Promise<unknown>;
  getStorageAt: (
    contractAddress: ContractAddressType | string,
    key: Felt252Type | string,
    blockId?: BlockId,
  ) => Promise<string>;
  getClass: (
    classHash: ClassHashType | string,
    blockId?: BlockId,
  ) => Promise<ContractClassResponse>;
  getClassHashAt: (
    contractAddress: ContractAddressType | string,
    blockId?: BlockId,
  ) => Promise<string>;
  getClassAt: (
    contractAddress: ContractAddressType | string,
    blockId?: BlockId,
  ) => Promise<ContractClassResponse>;
  getBlockTransactionCount: (blockId?: BlockId) => Promise<number>;
  call: (request: FunctionCall, blockId?: BlockId) => Promise<string[]>;
  estimateFee: (
    transactions: BroadcastedTxn[],
    simulationFlags?: SimulationFlag[],
    blockId?: BlockId,
  ) => Promise<unknown>;
  estimateMessageFee: (message: unknown, blockId?: BlockId) => Promise<unknown>;
  getTransactionByHash: (txHash: string) => Promise<unknown>;
  getTransactionReceipt: (txHash: string) => Promise<unknown>;
  getTransactionStatus: (txHash: string) => Promise<unknown>;
  getEvents: (filter: EventsFilter) => Promise<unknown>;
  getNonce: (contractAddress: ContractAddressType | string, blockId?: BlockId) => Promise<string>;
  getStorageProof: (
    blockId: BlockId,
    classHashes: string[],
    contractAddresses: string[],
    contractStorageKeys: { contract_address: string; storage_keys: string[] }[],
  ) => Promise<unknown>;
  addInvokeTransaction: (transaction: BroadcastedInvokeTxn) => Promise<unknown>;
  addDeclareTransaction: (transaction: BroadcastedDeclareTxn) => Promise<unknown>;
  addDeployAccountTransaction: (transaction: BroadcastedDeployAccountTxn) => Promise<unknown>;
  simulateTransactions: (
    blockId: BlockId,
    transactions: BroadcastedTxn[],
    simulationFlags?: SimulationFlag[],
  ) => Promise<unknown>;
  traceTransaction: (txHash: string) => Promise<unknown>;
  traceBlockTransactions: (blockId: BlockId) => Promise<unknown>;
}

/**
 * Create an HTTP provider backed by Kundera transports.
 */
export function createHttpProvider(options: HttpProviderOptions): HttpProvider {
  const transport = httpTransport(options.url, options.transport);

  return {
    transport,
    specVersion: () => starknet_specVersion(transport),
    chainId: () => starknet_chainId(transport),
    blockNumber: () => starknet_blockNumber(transport),
    blockHashAndNumber: () => starknet_blockHashAndNumber(transport),
    getBlockWithTxHashes: (blockId) => starknet_getBlockWithTxHashes(transport, blockId),
    getBlockWithTxs: (blockId) => starknet_getBlockWithTxs(transport, blockId),
    getBlockWithReceipts: (blockId) => starknet_getBlockWithReceipts(transport, blockId),
    getStateUpdate: (blockId) => starknet_getStateUpdate(transport, blockId),
    getStorageAt: (contractAddress, key, blockId) =>
      starknet_getStorageAt(transport, contractAddress, key, blockId),
    getClass: (classHash, blockId) => starknet_getClass(transport, classHash, blockId),
    getClassHashAt: (contractAddress, blockId) =>
      starknet_getClassHashAt(transport, contractAddress, blockId),
    getClassAt: (contractAddress, blockId) =>
      starknet_getClassAt(transport, contractAddress, blockId),
    getBlockTransactionCount: (blockId) =>
      starknet_getBlockTransactionCount(transport, blockId),
    call: (request, blockId) => starknet_call(transport, request, blockId),
    estimateFee: (transactions, simulationFlags, blockId) =>
      starknet_estimateFee(transport, transactions, simulationFlags, blockId),
    estimateMessageFee: (message, blockId) =>
      starknet_estimateMessageFee(transport, message as any, blockId),
    getTransactionByHash: (txHash) => starknet_getTransactionByHash(transport, txHash),
    getTransactionReceipt: (txHash) => starknet_getTransactionReceipt(transport, txHash),
    getTransactionStatus: (txHash) => starknet_getTransactionStatus(transport, txHash),
    getEvents: (filter) => starknet_getEvents(transport, filter),
    getNonce: (contractAddress, blockId) =>
      starknet_getNonce(transport, contractAddress, blockId),
    getStorageProof: (blockId, classHashes, contractAddresses, contractStorageKeys) =>
      starknet_getStorageProof(
        transport,
        blockId,
        classHashes,
        contractAddresses,
        contractStorageKeys,
      ),
    addInvokeTransaction: (transaction) =>
      starknet_addInvokeTransaction(transport, transaction),
    addDeclareTransaction: (transaction) =>
      starknet_addDeclareTransaction(transport, transaction),
    addDeployAccountTransaction: (transaction) =>
      starknet_addDeployAccountTransaction(transport, transaction),
    simulateTransactions: (blockId, transactions, simulationFlags) =>
      starknet_simulateTransactions(transport, blockId, transactions, simulationFlags),
    traceTransaction: (txHash) => starknet_traceTransaction(transport, txHash),
    traceBlockTransactions: (blockId) =>
      starknet_traceBlockTransactions(transport, blockId),
  };
}
