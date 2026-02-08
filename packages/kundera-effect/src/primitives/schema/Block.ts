import * as Schema from "effect/Schema";
import {
  blockWithReceiptsFromRpc,
  blockWithReceiptsToRpc,
  blockWithTxHashesFromRpc,
  blockWithTxHashesToRpc,
  blockWithTxsFromRpc,
  blockWithTxsToRpc,
  type BlockWithReceiptsType,
  type BlockWithTxHashesType,
  type BlockWithTxsType,
} from "@kundera-sn/kundera-ts";
import { hasStringType, isArrayOf, isFelt252, isObject } from "./_predicates.js";
import { rpcTransform } from "./_rpcSchema.js";

type RpcBlockWithTxHashes = Parameters<typeof blockWithTxHashesFromRpc>[0];
type RpcBlockWithTxs = Parameters<typeof blockWithTxsFromRpc>[0];
type RpcBlockWithReceipts = Parameters<typeof blockWithReceiptsFromRpc>[0];

const hasBlockBase = (value: unknown): value is { readonly status: string } =>
  isObject(value) && typeof value.status === "string";

const isBlockWithTxHashes = (value: unknown): value is BlockWithTxHashesType => {
  if (!hasBlockBase(value)) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return isArrayOf(v.transactions, isFelt252);
};

const isBlockWithTxs = (value: unknown): value is BlockWithTxsType => {
  if (!hasBlockBase(value)) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return isArrayOf(v.transactions, hasStringType);
};

const isBlockWithReceipts = (value: unknown): value is BlockWithReceiptsType => {
  if (!hasBlockBase(value)) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return isArrayOf(
    v.transactions,
    (entry) => isObject(entry) && hasStringType(entry.transaction) && hasStringType(entry.receipt),
  );
};

const BlockWithTxHashesTypeSchema = Schema.declare<BlockWithTxHashesType>(
  isBlockWithTxHashes,
  { identifier: "BlockWithTxHashes" },
);

const BlockWithTxsTypeSchema = Schema.declare<BlockWithTxsType>(
  isBlockWithTxs,
  { identifier: "BlockWithTxs" },
);

const BlockWithReceiptsTypeSchema = Schema.declare<BlockWithReceiptsType>(
  isBlockWithReceipts,
  { identifier: "BlockWithReceipts" },
);

export const WithTxHashesRpc: Schema.Schema<BlockWithTxHashesType, RpcBlockWithTxHashes> =
  rpcTransform(BlockWithTxHashesTypeSchema, blockWithTxHashesFromRpc, blockWithTxHashesToRpc, {
    identifier: "Kundera.BlockWithTxHashes.Rpc",
    title: "Starknet Block With Transaction Hashes",
    description: "Block with transaction hashes decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet block-with-tx-hashes RPC value",
  });

export const WithTxsRpc: Schema.Schema<BlockWithTxsType, RpcBlockWithTxs> = rpcTransform(
  BlockWithTxsTypeSchema,
  blockWithTxsFromRpc,
  blockWithTxsToRpc,
  {
    identifier: "Kundera.BlockWithTxs.Rpc",
    title: "Starknet Block With Transactions",
    description: "Block with full transactions decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet block-with-transactions RPC value",
  },
);

export const WithReceiptsRpc: Schema.Schema<BlockWithReceiptsType, RpcBlockWithReceipts> =
  rpcTransform(
    BlockWithReceiptsTypeSchema,
    blockWithReceiptsFromRpc,
    blockWithReceiptsToRpc,
    {
      identifier: "Kundera.BlockWithReceipts.Rpc",
      title: "Starknet Block With Receipts",
      description: "Block with transaction/receipt pairs decoded from Starknet RPC wire data.",
      errorMessage: "Invalid Starknet block-with-receipts RPC value",
    },
  );
