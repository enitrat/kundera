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
  dts: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: [
    "kundera-sn",
    "kundera-sn/abi",
    "kundera-sn/crypto",
    "kundera-sn/serde",
    "kundera-sn/transport",
    "kundera-sn/provider",
    "kundera-sn/jsonrpc",
    "kundera-sn/native",
    "kundera-sn/wasm",
    "kundera-sn/wasm-loader",
    "kundera-sn/Felt252",
    "kundera-sn/ContractAddress",
    "kundera-sn/ClassHash",
    "kundera-sn/StorageKey",
    "kundera-sn/ShortString",
    "kundera-sn/EthAddress",
    "kundera-sn/Address",
    "effect"
  ]
});
