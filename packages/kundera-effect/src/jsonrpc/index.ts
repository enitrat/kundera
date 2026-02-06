import { Effect } from "effect";
import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import type {
  Transport,
  JsonRpcRequest,
} from "@kundera-sn/kundera-ts/transport";
import { isJsonRpcError } from "@kundera-sn/kundera-ts/transport";
import type {
  BlockId,
  FunctionCall,
  BroadcastedTxn,
  BroadcastedInvokeTxn,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  SimulationFlag,
  MsgFromL1,
  ContractClass,
  EventsFilter,
  EventsSubscriptionParams,
  NewHeadsSubscriptionParams,
  PendingTransactionsSubscriptionParams,
  TransactionReceiptsSubscriptionParams,
} from "@kundera-sn/kundera-ts/jsonrpc";
import type { RequestArguments } from "@kundera-sn/kundera-ts/provider";
import { RpcError } from "../errors.js";

let _requestId = 0;
function nextRequestId(): number {
  return ++_requestId;
}

/**
 * Send a JSON-RPC request through a Transport, returning an Effect.
 *
 * Handles id assignment, error discrimination, and Effect wrapping.
 */
const send = <T>(
  transport: Transport,
  args: RequestArguments,
): Effect.Effect<T, RpcError> =>
  Effect.tryPromise({
    try: async () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: nextRequestId(),
        method: args.method,
      };
      if (args.params !== undefined) {
        request.params = args.params;
      }
      const response = await transport.request<T>(request);
      if (isJsonRpcError(response)) {
        throw new RpcError({
          message: response.error.message,
          operation: args.method,
          input: args.params,
          expected: "JSON-RPC success response",
          cause: response.error,
        });
      }
      return response.result;
    },
    catch: (error) => {
      if (error instanceof RpcError) return error;
      return new RpcError({
        message: error instanceof Error ? error.message : "RPC call failed",
        operation: args.method,
        input: args.params,
        expected: "JSON-RPC success response",
        cause: error instanceof Error ? error : undefined,
      });
    },
  });

// ── Read API ──────────────────────────────────────────────

export const starknet_specVersion = (transport: Transport) =>
  send<string>(transport, Rpc.SpecVersionRequest());

export const starknet_blockNumber = (transport: Transport) =>
  send<number>(transport, Rpc.BlockNumberRequest());

export const starknet_blockHashAndNumber = (transport: Transport) =>
  send<{ block_hash: string; block_number: number }>(transport, Rpc.BlockHashAndNumberRequest());

export const starknet_chainId = (transport: Transport) =>
  send<string>(transport, Rpc.ChainIdRequest());

export const starknet_syncing = (transport: Transport) =>
  send<boolean | object>(transport, Rpc.SyncingRequest());

export const starknet_call = (
  transport: Transport,
  request: FunctionCall,
  blockId?: BlockId,
) => send<string[]>(transport, Rpc.CallRequest(request, blockId));

export const starknet_estimateFee = (
  transport: Transport,
  transactions: BroadcastedTxn[],
  simulationFlags?: SimulationFlag[],
  blockId?: BlockId,
) => send<unknown[]>(transport, Rpc.EstimateFeeRequest(transactions, simulationFlags, blockId));

export const starknet_estimateMessageFee = (
  transport: Transport,
  message: MsgFromL1,
  blockId?: BlockId,
) => send<unknown>(transport, Rpc.EstimateMessageFeeRequest(message, blockId));

export const starknet_getBlockWithTxHashes = (
  transport: Transport,
  blockId?: BlockId,
) => send<unknown>(transport, Rpc.GetBlockWithTxHashesRequest(blockId));

export const starknet_getBlockWithTxs = (
  transport: Transport,
  blockId?: BlockId,
) => send<unknown>(transport, Rpc.GetBlockWithTxsRequest(blockId));

export const starknet_getBlockWithReceipts = (
  transport: Transport,
  blockId?: BlockId,
) => send<unknown>(transport, Rpc.GetBlockWithReceiptsRequest(blockId));

export const starknet_getBlockTransactionCount = (
  transport: Transport,
  blockId?: BlockId,
) => send<number>(transport, Rpc.GetBlockTransactionCountRequest(blockId));

export const starknet_getStateUpdate = (
  transport: Transport,
  blockId?: BlockId,
) => send<unknown>(transport, Rpc.GetStateUpdateRequest(blockId));

export const starknet_getStorageAt = (
  transport: Transport,
  contractAddress: string,
  key: string,
  blockId?: BlockId,
) => send<string>(transport, Rpc.GetStorageAtRequest(contractAddress, key, blockId));

export const starknet_getTransactionStatus = (
  transport: Transport,
  transactionHash: string,
) => send<unknown>(transport, Rpc.GetTransactionStatusRequest(transactionHash));

export const starknet_getMessagesStatus = (
  transport: Transport,
  l1TransactionHash: string,
) => send<unknown>(transport, Rpc.GetMessagesStatusRequest(l1TransactionHash));

export const starknet_getTransactionByHash = (
  transport: Transport,
  transactionHash: string,
) => send<unknown>(transport, Rpc.GetTransactionByHashRequest(transactionHash));

export const starknet_getTransactionByBlockIdAndIndex = (
  transport: Transport,
  blockId: BlockId,
  index: number,
) => send<unknown>(transport, Rpc.GetTransactionByBlockIdAndIndexRequest(blockId, index));

export const starknet_getTransactionReceipt = (
  transport: Transport,
  transactionHash: string,
) => send<unknown>(transport, Rpc.GetTransactionReceiptRequest(transactionHash));

export const starknet_getClass = (
  transport: Transport,
  blockId: BlockId,
  classHash: string,
) => send<unknown>(transport, Rpc.GetClassRequest(blockId, classHash));

export const starknet_getClassHashAt = (
  transport: Transport,
  blockId: BlockId,
  contractAddress: string,
) => send<string>(transport, Rpc.GetClassHashAtRequest(blockId, contractAddress));

export const starknet_getClassAt = (
  transport: Transport,
  blockId: BlockId,
  contractAddress: string,
) => send<unknown>(transport, Rpc.GetClassAtRequest(blockId, contractAddress));

export const starknet_getEvents = (
  transport: Transport,
  filter: EventsFilter,
) => send<unknown>(transport, Rpc.GetEventsRequest(filter));

export const starknet_getNonce = (
  transport: Transport,
  blockId: BlockId,
  contractAddress: string,
) => send<string>(transport, Rpc.GetNonceRequest(blockId, contractAddress));

export const starknet_getStorageProof = (
  transport: Transport,
  blockId: BlockId,
  classHashes: string[],
  contractAddresses: string[],
  contractStorageKeys: Array<{ contract_address: string; storage_keys: string[] }>,
) => send<unknown>(transport, Rpc.GetStorageProofRequest(blockId, classHashes, contractAddresses, contractStorageKeys));

// ── Write API ─────────────────────────────────────────────

export const starknet_addInvokeTransaction = (
  transport: Transport,
  transaction: BroadcastedInvokeTxn,
) => send<{ transaction_hash: string }>(transport, Rpc.AddInvokeTransactionRequest(transaction));

export const starknet_addDeclareTransaction = (
  transport: Transport,
  transaction: BroadcastedDeclareTxn,
) => send<{ transaction_hash: string; class_hash: string }>(transport, Rpc.AddDeclareTransactionRequest(transaction));

export const starknet_addDeployAccountTransaction = (
  transport: Transport,
  transaction: BroadcastedDeployAccountTxn,
) => send<{ transaction_hash: string; contract_address: string }>(transport, Rpc.AddDeployAccountTransactionRequest(transaction));

// ── Trace API ─────────────────────────────────────────────

export const starknet_traceTransaction = (
  transport: Transport,
  transactionHash: string,
) => send<unknown>(transport, Rpc.TraceTransactionRequest(transactionHash));

export const starknet_simulateTransactions = (
  transport: Transport,
  blockId: BlockId,
  transactions: BroadcastedTxn[],
  simulationFlags?: SimulationFlag[],
) => send<unknown[]>(transport, Rpc.SimulateTransactionsRequest(blockId, transactions, simulationFlags));

export const starknet_traceBlockTransactions = (
  transport: Transport,
  blockId: BlockId,
) => send<unknown[]>(transport, Rpc.TraceBlockTransactionsRequest(blockId));

// ── WebSocket API ─────────────────────────────────────────

export const starknet_subscribeNewHeads = (
  transport: Transport,
  params?: NewHeadsSubscriptionParams,
) => send<string>(transport, Rpc.SubscribeNewHeadsRequest(params));

export const starknet_subscribeEvents = (
  transport: Transport,
  params?: EventsSubscriptionParams,
) => send<string>(transport, Rpc.SubscribeEventsRequest(params));

export const starknet_subscribeTransactionStatus = (
  transport: Transport,
  transactionHash: string,
) => send<string>(transport, Rpc.SubscribeTransactionStatusRequest(transactionHash));

export const starknet_subscribeNewTransactions = (
  transport: Transport,
  params?: PendingTransactionsSubscriptionParams,
) => send<string>(transport, Rpc.SubscribeNewTransactionsRequest(params));

export const starknet_subscribeNewTransactionReceipts = (
  transport: Transport,
  params?: TransactionReceiptsSubscriptionParams,
) => send<string>(transport, Rpc.SubscribeNewTransactionReceiptsRequest(params));

export const starknet_unsubscribe = (
  transport: Transport,
  subscriptionId: string,
) => send<boolean>(transport, Rpc.UnsubscribeRequest(subscriptionId));

// ── Re-exports ────────────────────────────────────────────

export { RpcError } from "../errors.js";

export type { BlockHashAndNumber } from "@kundera-sn/kundera-ts/jsonrpc";
export type { EventsFilter } from "@kundera-sn/kundera-ts/jsonrpc";

export type {
  RpcError as RpcErrorType,
  StarknetRpcErrorCode,
  BlockTag,
  BlockId,
  BlockStatus,
  BlockHeader,
  BlockHeaderWithCommitments,
  BlockWithTxHashes,
  PreConfirmedBlockWithTxHashes,
  BlockWithTxs,
  PreConfirmedBlockWithTxs,
  BlockWithReceipts,
  PreConfirmedBlockWithReceipts,
  BlockTransactionTrace,
  StateUpdate,
  PreConfirmedStateUpdate,
  StorageProof,
  ContractStorageDiffItem,
  DeployedContractItem,
  DeclaredClassItem,
  ReplacedClassItem,
  NonceUpdateItem,
  TransactionStatus,
  FunctionCall,
  SimulationFlag,
  FeeEstimate,
  MessageFeeEstimate,
  MsgFromL1,
  MessagesStatusResponse,
  SyncingStatus,
  EventsResponse,
  EmittedEvent,
  NewHead,
  TxnWithHash,
  TxnReceiptWithBlockInfo,
  TransactionTrace,
  SimulatedTransaction,
  BroadcastedTxn,
  BroadcastedInvokeTxn,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  ContractClass,
  AddInvokeTransactionResult,
  AddDeclareTransactionResult,
  AddDeployAccountTransactionResult,
  MessageStatus,
  PendingTransaction,
  TransactionStatusUpdate,
  WsTransactionReceipt,
  ReorgData,
  WsNotificationPayload,
  EventsSubscriptionParams,
  NewHeadsSubscriptionParams,
  PendingTransactionsSubscriptionParams,
  TransactionReceiptsSubscriptionParams,
  TxnFinalityStatusWithoutL1,
  ReceiptFinalityStatus,
} from "@kundera-sn/kundera-ts/jsonrpc";
