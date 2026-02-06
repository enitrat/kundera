/**
 * HTTP Provider Skill
 *
 * Lightweight JSON-RPC provider built on Kundera's transport + rpc primitives.
 * Copy into your codebase and tailor methods as needed.
 */

import { httpTransport, type HttpTransportOptions, type Transport } from '@kundera-sn/kundera-ts/transport';
import { Rpc } from '@kundera-sn/kundera-ts/jsonrpc';
import type {
  BlockId,
  BroadcastedTxn,
  BroadcastedInvokeTxn,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,

  EventsFilter,
  FunctionCall,
  SimulationFlag,
} from '@kundera-sn/kundera-ts/jsonrpc';
import type { ContractAddressType, ClassHashType, Felt252Type } from '@kundera-sn/kundera-ts';

/** Send a request-builder result through a transport and unwrap the response. */
async function send<T>(transport: Transport, req: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T> {
  const response = await transport.request({ jsonrpc: '2.0', id: 1, method: req.method, params: req.params ?? [] });
  if ('error' in response) throw new Error(response.error.message);
  return response.result as T;
}

export interface HttpProviderOptions {
  /** RPC endpoint URL (used if transport is not provided) */
  url?: string;
  /** Provide a custom transport (e.g., batched/retrying transport skill) */
  transport?: Transport;
  /** Transport options for the default HTTP transport */
  transportOptions?: HttpTransportOptions;
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
  ) => Promise<unknown>;
  getClassHashAt: (
    contractAddress: ContractAddressType | string,
    blockId?: BlockId,
  ) => Promise<string>;
  getClassAt: (
    contractAddress: ContractAddressType | string,
    blockId?: BlockId,
  ) => Promise<unknown>;
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
  if (!options.transport && !options.url) {
    throw new Error('HttpProvider requires either a transport or a url');
  }

  const transport =
    options.transport ??
    httpTransport(
      options.url ?? '',
      options.transportOptions,
    );

  return {
    transport,
    specVersion: () => send(transport, Rpc.SpecVersionRequest()),
    chainId: () => send(transport, Rpc.ChainIdRequest()),
    blockNumber: () => send(transport, Rpc.BlockNumberRequest()),
    blockHashAndNumber: () => send(transport, Rpc.BlockHashAndNumberRequest()),
    getBlockWithTxHashes: (blockId) => send(transport, Rpc.GetBlockWithTxHashesRequest(blockId)),
    getBlockWithTxs: (blockId) => send(transport, Rpc.GetBlockWithTxsRequest(blockId)),
    getBlockWithReceipts: (blockId) => send(transport, Rpc.GetBlockWithReceiptsRequest(blockId)),
    getStateUpdate: (blockId) => send(transport, Rpc.GetStateUpdateRequest(blockId)),
    getStorageAt: (contractAddress, key, blockId) =>
      send(transport, Rpc.GetStorageAtRequest(String(contractAddress), String(key), blockId)),
    getClass: (classHash, blockId) => send(transport, Rpc.GetClassRequest(blockId ?? 'latest', String(classHash))),
    getClassHashAt: (contractAddress, blockId) =>
      send(transport, Rpc.GetClassHashAtRequest(blockId ?? 'latest', String(contractAddress))),
    getClassAt: (contractAddress, blockId) =>
      send(transport, Rpc.GetClassAtRequest(blockId ?? 'latest', String(contractAddress))),
    getBlockTransactionCount: (blockId) =>
      send(transport, Rpc.GetBlockTransactionCountRequest(blockId)),
    call: (request, blockId) => send(transport, Rpc.CallRequest(request, blockId)),
    estimateFee: (transactions, simulationFlags, blockId) =>
      send(transport, Rpc.EstimateFeeRequest(transactions, simulationFlags, blockId)),
    estimateMessageFee: (message, blockId) =>
      send(transport, Rpc.EstimateMessageFeeRequest(message as any, blockId)),
    getTransactionByHash: (txHash) => send(transport, Rpc.GetTransactionByHashRequest(txHash)),
    getTransactionReceipt: (txHash) => send(transport, Rpc.GetTransactionReceiptRequest(txHash)),
    getTransactionStatus: (txHash) => send(transport, Rpc.GetTransactionStatusRequest(txHash)),
    getEvents: (filter) => send(transport, Rpc.GetEventsRequest(filter)),
    getNonce: (contractAddress, blockId) =>
      send(transport, Rpc.GetNonceRequest(blockId ?? 'pending', String(contractAddress))),
    getStorageProof: (blockId, classHashes, contractAddresses, contractStorageKeys) =>
      send(transport, Rpc.GetStorageProofRequest(
        blockId,
        classHashes,
        contractAddresses,
        contractStorageKeys,
      )),
    addInvokeTransaction: (transaction) =>
      send(transport, Rpc.AddInvokeTransactionRequest(transaction)),
    addDeclareTransaction: (transaction) =>
      send(transport, Rpc.AddDeclareTransactionRequest(transaction)),
    addDeployAccountTransaction: (transaction) =>
      send(transport, Rpc.AddDeployAccountTransactionRequest(transaction)),
    simulateTransactions: (blockId, transactions, simulationFlags) =>
      send(transport, Rpc.SimulateTransactionsRequest(blockId, transactions, simulationFlags)),
    traceTransaction: (txHash) => send(transport, Rpc.TraceTransactionRequest(txHash)),
    traceBlockTransactions: (blockId) =>
      send(transport, Rpc.TraceBlockTransactionsRequest(blockId)),
  };
}
