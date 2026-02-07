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
