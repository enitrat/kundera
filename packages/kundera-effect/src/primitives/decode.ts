import * as Schema from "effect/Schema";
import * as PrimitiveSchema from "./schema/index.js";

export const decodeContractAddress = Schema.decodeUnknown(
  PrimitiveSchema.ContractAddress.Hex,
);

export const decodeStorageKey = Schema.decodeUnknown(
  PrimitiveSchema.StorageKey.Hex,
);

export const decodeFelt252 = Schema.decodeUnknown(
  PrimitiveSchema.Felt252.Hex,
);

export const decodeClassHash = Schema.decodeUnknown(
  PrimitiveSchema.ClassHash.Hex,
);

export const decodeContractAddressSync = Schema.decodeUnknownSync(
  PrimitiveSchema.ContractAddress.Hex,
);

export const decodeStorageKeySync = Schema.decodeUnknownSync(
  PrimitiveSchema.StorageKey.Hex,
);

export const decodeFelt252Sync = Schema.decodeUnknownSync(
  PrimitiveSchema.Felt252.Hex,
);

export const decodeClassHashSync = Schema.decodeUnknownSync(
  PrimitiveSchema.ClassHash.Hex,
);

export const decodeBlockHeader = Schema.decodeUnknown(
  PrimitiveSchema.BlockHeader.Rpc,
);

export const decodeBlockHeaderWithCommitments = Schema.decodeUnknown(
  PrimitiveSchema.BlockHeader.WithCommitmentsRpc,
);

export const decodeBlockWithTxHashes = Schema.decodeUnknown(
  PrimitiveSchema.Block.WithTxHashesRpc,
);

export const decodeBlockWithTxs = Schema.decodeUnknown(
  PrimitiveSchema.Block.WithTxsRpc,
);

export const decodeBlockWithReceipts = Schema.decodeUnknown(
  PrimitiveSchema.Block.WithReceiptsRpc,
);

export const decodeTransaction = Schema.decodeUnknown(
  PrimitiveSchema.Transaction.Rpc,
);

export const decodeTransactionWithHash = Schema.decodeUnknown(
  PrimitiveSchema.Transaction.WithHashRpc,
);

export const decodeReceipt = Schema.decodeUnknown(
  PrimitiveSchema.Receipt.Rpc,
);

export const decodeReceiptWithBlockInfo = Schema.decodeUnknown(
  PrimitiveSchema.Receipt.WithBlockInfoRpc,
);

export const decodeEvent = Schema.decodeUnknown(
  PrimitiveSchema.Event.Rpc,
);

export const decodeEmittedEvent = Schema.decodeUnknown(
  PrimitiveSchema.Event.EmittedRpc,
);

export const decodeStateUpdate = Schema.decodeUnknown(
  PrimitiveSchema.StateUpdate.Rpc,
);

export const decodeStateDiff = Schema.decodeUnknown(
  PrimitiveSchema.StateUpdate.StateDiffRpc,
);

export const decodeFeeEstimate = Schema.decodeUnknown(
  PrimitiveSchema.FeeEstimate.Rpc,
);

export const decodeTransactionTrace = Schema.decodeUnknown(
  PrimitiveSchema.Trace.Rpc,
);

export const decodeBlockHeaderSync = Schema.decodeUnknownSync(
  PrimitiveSchema.BlockHeader.Rpc,
);

export const decodeBlockHeaderWithCommitmentsSync = Schema.decodeUnknownSync(
  PrimitiveSchema.BlockHeader.WithCommitmentsRpc,
);

export const decodeBlockWithTxHashesSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Block.WithTxHashesRpc,
);

export const decodeBlockWithTxsSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Block.WithTxsRpc,
);

export const decodeBlockWithReceiptsSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Block.WithReceiptsRpc,
);

export const decodeTransactionSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Transaction.Rpc,
);

export const decodeTransactionWithHashSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Transaction.WithHashRpc,
);

export const decodeReceiptSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Receipt.Rpc,
);

export const decodeReceiptWithBlockInfoSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Receipt.WithBlockInfoRpc,
);

export const decodeEventSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Event.Rpc,
);

export const decodeEmittedEventSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Event.EmittedRpc,
);

export const decodeStateUpdateSync = Schema.decodeUnknownSync(
  PrimitiveSchema.StateUpdate.Rpc,
);

export const decodeStateDiffSync = Schema.decodeUnknownSync(
  PrimitiveSchema.StateUpdate.StateDiffRpc,
);

export const decodeFeeEstimateSync = Schema.decodeUnknownSync(
  PrimitiveSchema.FeeEstimate.Rpc,
);

export const decodeTransactionTraceSync = Schema.decodeUnknownSync(
  PrimitiveSchema.Trace.Rpc,
);
