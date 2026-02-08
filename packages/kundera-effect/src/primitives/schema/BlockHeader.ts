import * as Schema from "effect/Schema";
import {
  blockHeaderFromRpc,
  blockHeaderToRpc,
  blockHeaderWithCommitmentsFromRpc,
  blockHeaderWithCommitmentsToRpc,
  resourcePriceFromRpc,
  resourcePriceToRpc,
  type BlockHeaderType,
  type BlockHeaderWithCommitmentsType,
  type ResourcePriceType,
} from "@kundera-sn/kundera-ts";
import { isFelt252, isObject } from "./_predicates.js";
import { rpcTransform } from "./_rpcSchema.js";

type RpcResourcePrice = Parameters<typeof resourcePriceFromRpc>[0];
type RpcBlockHeader = Parameters<typeof blockHeaderFromRpc>[0];
type RpcBlockHeaderWithCommitments = Parameters<typeof blockHeaderWithCommitmentsFromRpc>[0];

const ResourcePriceTypeSchema = Schema.declare<ResourcePriceType>(
  (value): value is ResourcePriceType =>
    isObject(value) &&
    isFelt252(value.price_in_fri) &&
    isFelt252(value.price_in_wei),
  { identifier: "ResourcePrice" },
);

const isBlockHeader = (value: unknown): value is BlockHeaderType =>
  isObject(value) &&
  isFelt252(value.block_hash) &&
  isFelt252(value.parent_hash) &&
  typeof value.block_number === "number" &&
  isFelt252(value.new_root) &&
  typeof value.timestamp === "number" &&
  isFelt252(value.sequencer_address) &&
  isObject(value.l1_gas_price) &&
  isObject(value.l2_gas_price) &&
  isObject(value.l1_data_gas_price) &&
  typeof value.l1_da_mode === "string" &&
  typeof value.starknet_version === "string";

const BlockHeaderTypeSchema = Schema.declare<BlockHeaderType>(isBlockHeader, {
  identifier: "BlockHeader",
});

const BlockHeaderWithCommitmentsTypeSchema =
  Schema.declare<BlockHeaderWithCommitmentsType>(
    (value): value is BlockHeaderWithCommitmentsType => {
      if (!isBlockHeader(value)) {
        return false;
      }
      const v = value as unknown as Record<string, unknown>;
      return (
        isFelt252(v.event_commitment) &&
        isFelt252(v.transaction_commitment) &&
        isFelt252(v.receipt_commitment) &&
        isFelt252(v.state_diff_commitment) &&
        typeof v.event_count === "number" &&
        typeof v.transaction_count === "number" &&
        typeof v.state_diff_length === "number"
      );
    },
    { identifier: "BlockHeaderWithCommitments" },
  );

export const ResourcePriceRpc: Schema.Schema<ResourcePriceType, RpcResourcePrice> =
  rpcTransform(ResourcePriceTypeSchema, resourcePriceFromRpc, resourcePriceToRpc, {
    identifier: "Kundera.ResourcePrice.Rpc",
    title: "Starknet Resource Price",
    description: "Resource price object decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet resource price RPC value",
  });

export const Rpc: Schema.Schema<BlockHeaderType, RpcBlockHeader> = rpcTransform(
  BlockHeaderTypeSchema,
  blockHeaderFromRpc,
  blockHeaderToRpc,
  {
    identifier: "Kundera.BlockHeader.Rpc",
    title: "Starknet Block Header",
    description: "Block header decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet block header RPC value",
  },
);

export const WithCommitmentsRpc: Schema.Schema<
  BlockHeaderWithCommitmentsType,
  RpcBlockHeaderWithCommitments
> = rpcTransform(
  BlockHeaderWithCommitmentsTypeSchema,
  blockHeaderWithCommitmentsFromRpc,
  blockHeaderWithCommitmentsToRpc,
  {
    identifier: "Kundera.BlockHeaderWithCommitments.Rpc",
    title: "Starknet Block Header With Commitments",
    description:
      "Extended block header with commitment fields decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet block header with commitments RPC value",
  },
);
