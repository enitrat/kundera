import * as Schema from "effect/Schema";
import {
  feePaymentFromRpc,
  feePaymentToRpc,
  msgToL1FromRpc,
  msgToL1ToRpc,
  receiptFromRpc,
  receiptToRpc,
  receiptWithBlockInfoFromRpc,
  receiptWithBlockInfoToRpc,
  type FeePaymentType,
  type MsgToL1Type,
  type TxnReceiptType,
  type TxnReceiptWithBlockInfoType,
} from "@kundera-sn/kundera-ts";
import { hasStringType, isArrayOf, isFelt252, isObject } from "./_predicates.js";
import { rpcTransform } from "./_rpcSchema.js";

type RpcFeePayment = Parameters<typeof feePaymentFromRpc>[0];
type RpcMsgToL1 = Parameters<typeof msgToL1FromRpc>[0];
type RpcTxnReceipt = Parameters<typeof receiptFromRpc>[0];
type RpcTxnReceiptWithBlockInfo = Parameters<typeof receiptWithBlockInfoFromRpc>[0];

const FeePaymentTypeSchema = Schema.declare<FeePaymentType>(
  (value): value is FeePaymentType =>
    isObject(value) && isFelt252(value.amount) && typeof value.unit === "string",
  { identifier: "FeePayment" },
);

const MsgToL1TypeSchema = Schema.declare<MsgToL1Type>(
  (value): value is MsgToL1Type =>
    isObject(value) &&
    isFelt252(value.from_address) &&
    isFelt252(value.to_address) &&
    isArrayOf(value.payload, isFelt252),
  { identifier: "MsgToL1" },
);

const isTxnReceipt = (value: unknown): value is TxnReceiptType => {
  if (!hasStringType(value)) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    isFelt252(v.transaction_hash) &&
    isObject(v.actual_fee) &&
    isFelt252(v.actual_fee.amount) &&
    isArrayOf(v.messages_sent, isObject) &&
    isArrayOf(v.events, isObject) &&
    isObject(v.execution_resources) &&
    typeof v.execution_status === "string"
  );
};

const TxnReceiptTypeSchema = Schema.declare<TxnReceiptType>(isTxnReceipt, {
  identifier: "TxnReceipt",
});

const TxnReceiptWithBlockInfoTypeSchema = Schema.declare<TxnReceiptWithBlockInfoType>(
  (value): value is TxnReceiptWithBlockInfoType => {
    if (!isTxnReceipt(value)) {
      return false;
    }
    const v = value as unknown as Record<string, unknown>;
    return (
      (v.block_hash === undefined || isFelt252(v.block_hash)) &&
      (v.block_number === undefined || typeof v.block_number === "number")
    );
  },
  { identifier: "TxnReceiptWithBlockInfo" },
);

export const FeePaymentRpc: Schema.Schema<FeePaymentType, RpcFeePayment> = rpcTransform(
  FeePaymentTypeSchema,
  feePaymentFromRpc,
  feePaymentToRpc,
  {
    identifier: "Kundera.FeePayment.Rpc",
    title: "Starknet Fee Payment",
    description: "Fee payment decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet fee payment RPC value",
  },
);

export const MsgToL1Rpc: Schema.Schema<MsgToL1Type, RpcMsgToL1> = rpcTransform(
  MsgToL1TypeSchema,
  msgToL1FromRpc,
  msgToL1ToRpc,
  {
    identifier: "Kundera.MsgToL1.Rpc",
    title: "Starknet Message To L1",
    description: "L2-to-L1 message decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet msg-to-l1 RPC value",
  },
);

export const Rpc: Schema.Schema<TxnReceiptType, RpcTxnReceipt> = rpcTransform(
  TxnReceiptTypeSchema,
  receiptFromRpc,
  receiptToRpc,
  {
    identifier: "Kundera.Receipt.Rpc",
    title: "Starknet Transaction Receipt",
    description: "Transaction receipt decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet receipt RPC value",
  },
);

export const WithBlockInfoRpc: Schema.Schema<
  TxnReceiptWithBlockInfoType,
  RpcTxnReceiptWithBlockInfo
> = rpcTransform(
  TxnReceiptWithBlockInfoTypeSchema,
  receiptWithBlockInfoFromRpc,
  receiptWithBlockInfoToRpc,
  {
    identifier: "Kundera.ReceiptWithBlockInfo.Rpc",
    title: "Starknet Transaction Receipt With Block Info",
    description: "Transaction receipt with block metadata decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet receipt-with-block-info RPC value",
  },
);
