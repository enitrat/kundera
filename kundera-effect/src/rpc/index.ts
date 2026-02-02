import { Effect } from "effect";
import * as Rpc from "kundera-sn/rpc";
import { RpcError } from "../errors.js";

const tryRpc = <T>(
  operation: string,
  input: unknown,
  thunk: () => Promise<T>
): Effect.Effect<T, RpcError> =>
  Effect.tryPromise({
    try: thunk,
    catch: (error) =>
      new RpcError({
        message: error instanceof Error ? error.message : "RPC call failed",
        operation,
        input,
        expected: "JSON-RPC success response",
        cause: error instanceof Error ? error : undefined
      })
  });

const wrapRpcMethod = <Args extends readonly unknown[], T>(
  operation: string,
  fn: (...args: Args) => Promise<T>
) =>
  (...args: Args) =>
    tryRpc(operation, args, () => fn(...args));

export { RpcError } from "../errors.js";

export const starknet_specVersion = wrapRpcMethod(
  "starknet_specVersion",
  Rpc.starknet_specVersion
);
export const starknet_getBlockWithTxHashes = wrapRpcMethod(
  "starknet_getBlockWithTxHashes",
  Rpc.starknet_getBlockWithTxHashes
);
export const starknet_getBlockWithTxs = wrapRpcMethod(
  "starknet_getBlockWithTxs",
  Rpc.starknet_getBlockWithTxs
);
export const starknet_getBlockWithReceipts = wrapRpcMethod(
  "starknet_getBlockWithReceipts",
  Rpc.starknet_getBlockWithReceipts
);
export const starknet_getStateUpdate = wrapRpcMethod(
  "starknet_getStateUpdate",
  Rpc.starknet_getStateUpdate
);
export const starknet_getStorageAt = wrapRpcMethod(
  "starknet_getStorageAt",
  Rpc.starknet_getStorageAt
);
export const starknet_getTransactionStatus = wrapRpcMethod(
  "starknet_getTransactionStatus",
  Rpc.starknet_getTransactionStatus
);
export const starknet_getMessagesStatus = wrapRpcMethod(
  "starknet_getMessagesStatus",
  Rpc.starknet_getMessagesStatus
);
export const starknet_getTransactionByHash = wrapRpcMethod(
  "starknet_getTransactionByHash",
  Rpc.starknet_getTransactionByHash
);
export const starknet_getTransactionByBlockIdAndIndex = wrapRpcMethod(
  "starknet_getTransactionByBlockIdAndIndex",
  Rpc.starknet_getTransactionByBlockIdAndIndex
);
export const starknet_getTransactionReceipt = wrapRpcMethod(
  "starknet_getTransactionReceipt",
  Rpc.starknet_getTransactionReceipt
);
export const starknet_getClass = wrapRpcMethod(
  "starknet_getClass",
  Rpc.starknet_getClass
);
export const starknet_getClassHashAt = wrapRpcMethod(
  "starknet_getClassHashAt",
  Rpc.starknet_getClassHashAt
);
export const starknet_getClassAt = wrapRpcMethod(
  "starknet_getClassAt",
  Rpc.starknet_getClassAt
);
export const starknet_getBlockTransactionCount = wrapRpcMethod(
  "starknet_getBlockTransactionCount",
  Rpc.starknet_getBlockTransactionCount
);
export const starknet_call = wrapRpcMethod("starknet_call", Rpc.starknet_call);
export const starknet_estimateFee = wrapRpcMethod(
  "starknet_estimateFee",
  Rpc.starknet_estimateFee
);
export const starknet_estimateMessageFee = wrapRpcMethod(
  "starknet_estimateMessageFee",
  Rpc.starknet_estimateMessageFee
);
export const starknet_blockNumber = wrapRpcMethod(
  "starknet_blockNumber",
  Rpc.starknet_blockNumber
);
export const starknet_blockHashAndNumber = wrapRpcMethod(
  "starknet_blockHashAndNumber",
  Rpc.starknet_blockHashAndNumber
);
export const starknet_chainId = wrapRpcMethod("starknet_chainId", Rpc.starknet_chainId);
export const starknet_syncing = wrapRpcMethod("starknet_syncing", Rpc.starknet_syncing);
export const starknet_getEvents = wrapRpcMethod(
  "starknet_getEvents",
  Rpc.starknet_getEvents
);
export const starknet_getNonce = wrapRpcMethod("starknet_getNonce", Rpc.starknet_getNonce);
export const starknet_getStorageProof = wrapRpcMethod(
  "starknet_getStorageProof",
  Rpc.starknet_getStorageProof
);
export const starknet_addInvokeTransaction = wrapRpcMethod(
  "starknet_addInvokeTransaction",
  Rpc.starknet_addInvokeTransaction
);
export const starknet_addDeclareTransaction = wrapRpcMethod(
  "starknet_addDeclareTransaction",
  Rpc.starknet_addDeclareTransaction
);
export const starknet_addDeployAccountTransaction = wrapRpcMethod(
  "starknet_addDeployAccountTransaction",
  Rpc.starknet_addDeployAccountTransaction
);
export const starknet_traceTransaction = wrapRpcMethod(
  "starknet_traceTransaction",
  Rpc.starknet_traceTransaction
);
export const starknet_simulateTransactions = wrapRpcMethod(
  "starknet_simulateTransactions",
  Rpc.starknet_simulateTransactions
);
export const starknet_traceBlockTransactions = wrapRpcMethod(
  "starknet_traceBlockTransactions",
  Rpc.starknet_traceBlockTransactions
);
export const starknet_subscribeNewHeads = wrapRpcMethod(
  "starknet_subscribeNewHeads",
  Rpc.starknet_subscribeNewHeads
);
export const starknet_subscribeEvents = wrapRpcMethod(
  "starknet_subscribeEvents",
  Rpc.starknet_subscribeEvents
);
export const starknet_subscribeTransactionStatus = wrapRpcMethod(
  "starknet_subscribeTransactionStatus",
  Rpc.starknet_subscribeTransactionStatus
);
export const starknet_subscribeNewTransactionReceipts = wrapRpcMethod(
  "starknet_subscribeNewTransactionReceipts",
  Rpc.starknet_subscribeNewTransactionReceipts
);
export const starknet_subscribeNewTransactions = wrapRpcMethod(
  "starknet_subscribeNewTransactions",
  Rpc.starknet_subscribeNewTransactions
);
export const starknet_unsubscribe = wrapRpcMethod(
  "starknet_unsubscribe",
  Rpc.starknet_unsubscribe
);

export type { BlockHashAndNumber } from "kundera-sn/rpc";
export type { EventsFilter } from "kundera-sn/rpc";

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
  ReceiptFinalityStatus
} from "kundera-sn/rpc";
