import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/abi/index.ts",
    "src/primitives/index.ts",
    "src/crypto/index.ts",
    "src/serde/index.ts",
    "src/transport/index.ts",
    "src/rpc/index.ts",
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
    "@starknet/kundera",
    "@starknet/kundera/abi",
    "@starknet/kundera/crypto",
    "@starknet/kundera/primitives",
    "@starknet/kundera/serde",
    "@starknet/kundera/transport",
    "@starknet/kundera/rpc",
    "@starknet/kundera/native",
    "@starknet/kundera/wasm",
    "@starknet/kundera/wasm-loader",
    "effect"
  ]
});
