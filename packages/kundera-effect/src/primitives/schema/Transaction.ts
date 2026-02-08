import * as Schema from "effect/Schema";
import {
  resourceBoundsFromRpc,
  resourceBoundsMappingFromRpc,
  resourceBoundsMappingToRpc,
  resourceBoundsToRpc,
  transactionFromRpc,
  transactionToRpc,
  txnFromRpc,
  txnToRpc,
  type ResourceBoundsMappingType,
  type ResourceBoundsType,
  type TxnType,
  type TxnWithHashType,
} from "@kundera-sn/kundera-ts";
import { hasStringType, isFelt252, isObject } from "./_predicates.js";
import { rpcTransform } from "./_rpcSchema.js";

type RpcResourceBounds = Parameters<typeof resourceBoundsFromRpc>[0];
type RpcResourceBoundsMapping = Parameters<typeof resourceBoundsMappingFromRpc>[0];
type RpcTxn = Parameters<typeof txnFromRpc>[0];
type RpcTxnWithHash = Parameters<typeof transactionFromRpc>[0];

const ResourceBoundsTypeSchema = Schema.declare<ResourceBoundsType>(
  (value): value is ResourceBoundsType =>
    isObject(value) &&
    isFelt252(value.max_amount) &&
    isFelt252(value.max_price_per_unit),
  { identifier: "ResourceBounds" },
);

const ResourceBoundsMappingTypeSchema = Schema.declare<ResourceBoundsMappingType>(
  (value): value is ResourceBoundsMappingType =>
    isObject(value) &&
    isObject(value.l1_gas) &&
    isFelt252(value.l1_gas.max_amount) &&
    isFelt252(value.l1_gas.max_price_per_unit) &&
    isObject(value.l2_gas) &&
    isFelt252(value.l2_gas.max_amount) &&
    isFelt252(value.l2_gas.max_price_per_unit),
  { identifier: "ResourceBoundsMapping" },
);

const TxnTypeSchema = Schema.declare<TxnType>(
  (value): value is TxnType => hasStringType(value),
  { identifier: "Txn" },
);

const TxnWithHashTypeSchema = Schema.declare<TxnWithHashType>(
  (value): value is TxnWithHashType => {
    if (!hasStringType(value)) {
      return false;
    }
    const v = value as Record<string, unknown>;
    return isFelt252(v.transaction_hash);
  },
  { identifier: "TxnWithHash" },
);

export const ResourceBoundsRpc: Schema.Schema<ResourceBoundsType, RpcResourceBounds> =
  rpcTransform(ResourceBoundsTypeSchema, resourceBoundsFromRpc, resourceBoundsToRpc, {
    identifier: "Kundera.ResourceBounds.Rpc",
    title: "Starknet Resource Bounds",
    description: "Resource bounds decoded from Starknet transaction RPC wire data.",
    errorMessage: "Invalid Starknet resource bounds RPC value",
  });

export const ResourceBoundsMappingRpc: Schema.Schema<
  ResourceBoundsMappingType,
  RpcResourceBoundsMapping
> = rpcTransform(
  ResourceBoundsMappingTypeSchema,
  resourceBoundsMappingFromRpc,
  resourceBoundsMappingToRpc,
  {
    identifier: "Kundera.ResourceBoundsMapping.Rpc",
    title: "Starknet Resource Bounds Mapping",
    description: "Resource bounds mapping decoded from Starknet transaction RPC wire data.",
    errorMessage: "Invalid Starknet resource bounds mapping RPC value",
  },
);

export const Rpc: Schema.Schema<TxnType, RpcTxn> = rpcTransform(
  TxnTypeSchema,
  txnFromRpc,
  txnToRpc,
  {
    identifier: "Kundera.Transaction.Rpc",
    title: "Starknet Transaction",
    description: "Transaction decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet transaction RPC value",
  },
);

export const WithHashRpc: Schema.Schema<TxnWithHashType, RpcTxnWithHash> = rpcTransform(
  TxnWithHashTypeSchema,
  transactionFromRpc,
  transactionToRpc,
  {
    identifier: "Kundera.TransactionWithHash.Rpc",
    title: "Starknet Transaction With Hash",
    description: "Transaction with hash decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet transaction-with-hash RPC value",
  },
);
