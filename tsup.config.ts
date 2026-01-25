import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/primitives/index.ts',
    'src/crypto/index.ts',
    'src/serde/index.ts',
    'src/native/index.ts',
    'src/wasm/index.ts',
    'src/wasm-loader/index.ts',
    'src/rpc/index.ts',
    'src/provider/index.ts',
    'src/abi/index.ts',
    'src/contract/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  // Mark FFI modules as external to avoid bundling errors
  external: [
    'bun:ffi',
    'ffi-napi',
    'ref-napi',
  ],
  // Ensure proper handling of conditional imports
  noExternal: [],
});
