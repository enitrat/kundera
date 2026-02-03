# MAINTAINENCE_SKILL

Purpose
This file documents how to add or change functionality in Kundera while keeping
all entrypoints and platforms in sync (TypeScript, native FFI, and WASM).

Use this as a checklist before merging changes.

-----------------------------------------------------------------------------
Quick Mental Model

Entry points (must stay in sync):
- packages/kundera-ts/src/index.ts        -> primary JS API
- packages/kundera-ts/src/native/index.ts -> native entrypoint (Bun + Node FFI)
- packages/kundera-ts/src/wasm/index.ts   -> wasm entrypoint (explicit load)

Core layers:
- TypeScript API: packages/kundera-ts/src/* (primitives/crypto/serde/jsonrpc)
- Zig: primitives + glue (packages/kundera-ts/src/*/*.zig)
- Rust: cryptography FFI (lib/starknet-crypto-ffi)

Runtime-specific loaders:
- Bun FFI:  packages/kundera-ts/src/native/bun-ffi.ts
- Node FFI: packages/kundera-ts/src/native/node-ffi.ts
- Loader:   packages/kundera-ts/src/native/loader.ts
- Platform: packages/kundera-ts/src/native/platform.ts
- WASM:     packages/kundera-ts/src/wasm-loader/*

Parity check (compile-time):
- packages/kundera-ts/src/index.ts, packages/kundera-ts/src/native/index.ts,
  packages/kundera-ts/src/wasm/index.ts each contain
  `_api satisfies KunderaAPI` to ensure exports stay consistent.

-----------------------------------------------------------------------------
Adding a New Primitive (Type or Utility)

1) TypeScript
- Add implementation + branded types in packages/kundera-ts/src/primitives/
- Add tests in packages/kundera-ts/src/primitives/**/*.test.ts
- Export from packages/kundera-ts/src/index.ts (auto-export if using export * in entrypoints)
- Add an export entry in packages/kundera-ts/package.json if it is a new primitive

2) Zig
- Implement in packages/kundera-ts/src/primitives/root.zig
- Add Zig tests in the same file
- Wire into build.zig if needed

3) Parity
- Update packages/kundera-ts/src/api-interface.ts with the new functions/types
- Ensure `_api satisfies KunderaAPI` still passes in index/native/wasm

4) WASM / Native
- If the primitive is backed by FFI or WASM, see the sections below.

-----------------------------------------------------------------------------
Adding a New Crypto Function (FFI-backed)

1) Rust FFI (source of truth for crypto)
- Add function in lib/starknet-crypto-ffi/src/lib.rs
- Export C ABI signature
- Update lib/starknet-crypto-ffi/include/starknet_crypto.h
- Add Rust tests for the new function

2) Zig FFI (native + wasm)
- Add extern in packages/kundera-ts/src/crypto/ffi.zig
- Add wrapper in packages/kundera-ts/src/crypto/root.zig
- Add Zig tests

3) TypeScript
- Add API in packages/kundera-ts/src/crypto/index.ts
- Add tests in packages/kundera-ts/src/crypto/index.test.ts

4) Native FFI loaders
- Add symbol definitions + wrapper in:
  - packages/kundera-ts/src/native/bun-ffi.ts
  - packages/kundera-ts/src/native/node-ffi.ts
- Add delegation in packages/kundera-ts/src/native/loader.ts

5) WASM loader
- Export in packages/kundera-ts/src/wasm-loader/types.ts
- Add memory marshalling in packages/kundera-ts/src/wasm-loader/loader.ts
- Add tests in packages/kundera-ts/src/wasm-loader/loader.test.ts

6) Parity
- Update packages/kundera-ts/src/api-interface.ts
- Verify index/native/wasm parity blocks compile

-----------------------------------------------------------------------------
WASM Integration Rules

- WASM entrypoint is explicit: require `await loadWasmCrypto()`.
- packages/kundera-ts/src/wasm/index.ts must NOT import bun:ffi.
- Build artifact: packages/kundera-ts/wasm/crypto.wasm (from cargo build --target wasm32-wasip1).
- wasm-loader uses a bump allocator; update carefully when adding new functions.

-----------------------------------------------------------------------------
Native Loader Rules (Bun + Node)

Bun:
- Uses bun:ffi in packages/kundera-ts/src/native/bun-ffi.ts.
- No Bun imports should exist in Node paths.

Node:
- Uses ffi-napi / ref-napi in packages/kundera-ts/src/native/node-ffi.ts.
- These are optionalDependencies (packages/kundera-ts/package.json).
- ESM-safe `createRequire(import.meta.url)` is required.

Loader:
- packages/kundera-ts/src/native/loader.ts detects runtime (Bun vs Node).
- Use dynamic require to avoid loading ffi-napi or bun:ffi in the wrong runtime.

Platform:
- packages/kundera-ts/src/native/platform.ts resolves:
  - native/<platform>-<arch>/libstarknet_crypto_ffi.<ext>
  - target/release/libstarknet_crypto_ffi.<ext>
  - optional kundera-sn-<platform>-<arch> packages

-----------------------------------------------------------------------------
Build + Test Workflow

Recommended local flow:
1) pnpm --filter kundera-sn test:run
2) pnpm --filter kundera-sn build:dist
3) pnpm --filter kundera-sn build:types

Full build pipeline:
- pnpm --filter kundera-sn build:native   (cargo build --release)
- pnpm --filter kundera-sn build:wasm     (cargo build --target wasm32-wasip1 + copy)
- pnpm --filter kundera-sn build:dist     (tsup)
- pnpm --filter kundera-sn build:types    (tsc with tsconfig.build.json)
- pnpm --filter kundera-sn package:native (package native libs per platform)

Scripts:
- packages/kundera-ts/package.json scripts: build, build:dist, build:types, build:native, build:wasm
- prepublishOnly runs build + test

Tsup:
- packages/kundera-ts/tsup.config.ts must include all entrypoints:
  packages/kundera-ts/src/index.ts, packages/kundera-ts/src/native/index.ts,
  packages/kundera-ts/src/wasm/index.ts, packages/kundera-ts/src/wasm-loader/index.ts,
  packages/kundera-ts/src/abi/index.ts, packages/kundera-ts/src/transport/index.ts,
  packages/kundera-ts/src/serde/index.ts, packages/kundera-ts/src/jsonrpc/index.ts
- Mark externals: bun:ffi, ffi-napi, ref-napi

Types:
- packages/kundera-ts/tsconfig.build.json excludes *.test.ts
- packages/kundera-ts/src/types/ffi-napi.d.ts provides minimal type stubs

-----------------------------------------------------------------------------
Packaging Native Binaries

Use scripts/package-native.ts to copy native libs into:
  packages/kundera-ts/native/<platform>-<arch>/libstarknet_crypto_ffi.<ext>

If distributing platform packages, add:
  kundera-sn-<platform>-<arch> as optionalDependencies
and ensure getNativeLibPath resolves them.

-----------------------------------------------------------------------------
Release / Publish Checklist

1) pnpm --filter kundera-sn test:run
2) pnpm --filter kundera-sn build
3) pnpm --filter kundera-sn package:native
4) Verify packages/kundera-ts/dist/ and packages/kundera-ts/types/ outputs
5) Confirm packages/kundera-ts/wasm/crypto.wasm exists

-----------------------------------------------------------------------------
Troubleshooting

- If Node cannot load native:
  - install ffi-napi + ref-napi
  - ensure lib exists in target/release or native/<platform>-<arch>/

- If tsup fails on DTS:
  - check `_api satisfies KunderaAPI` types
  - ensure crypto.Felt merges primitive Felt
  - avoid duplicate keys in parity objects

- If wasm fails:
  - ensure wasm32-wasip1 target is installed
  - rebuild with: cargo build --release --target wasm32-wasip1
