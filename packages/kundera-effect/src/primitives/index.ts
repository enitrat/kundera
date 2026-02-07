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
