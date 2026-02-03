import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/abi/index.ts",
    "src/primitives/index.ts",
    "src/crypto/index.ts",
    "src/serde/index.ts",
    "src/transport/index.ts",
    "src/jsonrpc/index.ts",
    "src/services/index.ts",
    "src/native/index.ts",
    "src/wasm/index.ts",
    "src/wasm-loader/index.ts"
  ],
  format: ["esm"],
  dts: false,
  clean: true,
  splitting: false,
  treeshake: true,
  external: [
    "@kundera-sn/kundera-ts",
    "@kundera-sn/kundera-ts/abi",
    "@kundera-sn/kundera-ts/crypto",
    "@kundera-sn/kundera-ts/serde",
    "@kundera-sn/kundera-ts/transport",
    "@kundera-sn/kundera-ts/provider",
    "@kundera-sn/kundera-ts/jsonrpc",
    "@kundera-sn/kundera-ts/native",
    "@kundera-sn/kundera-ts/wasm",
    "@kundera-sn/kundera-ts/wasm-loader",
    "@kundera-sn/kundera-ts/Felt252",
    "@kundera-sn/kundera-ts/ContractAddress",
    "@kundera-sn/kundera-ts/ClassHash",
    "@kundera-sn/kundera-ts/StorageKey",
    "@kundera-sn/kundera-ts/ShortString",
    "@kundera-sn/kundera-ts/EthAddress",
    "@kundera-sn/kundera-ts/Address",
    "effect"
  ]
});
