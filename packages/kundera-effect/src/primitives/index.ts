import * as Schema from "./schema/index.js";

export * from "./types.js";
export * from "./decode.js";
export * from "./format.js";
export { Schema };

export const ContractAddress = {
  Hex: Schema.ContractAddress.Hex,
} as const;

export const StorageKey = {
  Hex: Schema.StorageKey.Hex,
} as const;

export const Felt252 = {
  Hex: Schema.Felt252.Hex,
} as const;

export const ClassHash = {
  Hex: Schema.ClassHash.Hex,
} as const;

export const BlockHeader = {
  Rpc: Schema.BlockHeader.Rpc,
  WithCommitmentsRpc: Schema.BlockHeader.WithCommitmentsRpc,
  ResourcePriceRpc: Schema.BlockHeader.ResourcePriceRpc,
} as const;

export const Block = {
  WithTxHashesRpc: Schema.Block.WithTxHashesRpc,
  WithTxsRpc: Schema.Block.WithTxsRpc,
  WithReceiptsRpc: Schema.Block.WithReceiptsRpc,
} as const;

export const Transaction = {
  Rpc: Schema.Transaction.Rpc,
  WithHashRpc: Schema.Transaction.WithHashRpc,
  ResourceBoundsRpc: Schema.Transaction.ResourceBoundsRpc,
  ResourceBoundsMappingRpc: Schema.Transaction.ResourceBoundsMappingRpc,
} as const;

export const Receipt = {
  Rpc: Schema.Receipt.Rpc,
  WithBlockInfoRpc: Schema.Receipt.WithBlockInfoRpc,
  FeePaymentRpc: Schema.Receipt.FeePaymentRpc,
  MsgToL1Rpc: Schema.Receipt.MsgToL1Rpc,
} as const;

export const Event = {
  Rpc: Schema.Event.Rpc,
  EmittedRpc: Schema.Event.EmittedRpc,
} as const;

export const StateUpdate = {
  Rpc: Schema.StateUpdate.Rpc,
  StateDiffRpc: Schema.StateUpdate.StateDiffRpc,
} as const;

export const FeeEstimate = {
  Rpc: Schema.FeeEstimate.Rpc,
} as const;

export const Trace = {
  Rpc: Schema.Trace.Rpc,
  OrderedEventRpc: Schema.Trace.OrderedEventRpc,
  OrderedMessageRpc: Schema.Trace.OrderedMessageRpc,
  FunctionInvocationRpc: Schema.Trace.FunctionInvocationRpc,
  RevertibleFunctionInvocationRpc: Schema.Trace.RevertibleFunctionInvocationRpc,
} as const;
