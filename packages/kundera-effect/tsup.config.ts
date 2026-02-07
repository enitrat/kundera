import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/errors.ts",
    "src/services/index.ts",
    "src/jsonrpc/index.ts",
    "src/presets/index.ts"
  ],
  format: ["esm"],
  dts: false,
  clean: true,
  splitting: false,
  treeshake: true,
  external: [
    "effect",
    "@kundera-sn/kundera-ts",
    "@kundera-sn/kundera-ts/jsonrpc",
    "@kundera-sn/kundera-ts/transport",
    "@kundera-sn/kundera-ts/provider"
  ]
});
