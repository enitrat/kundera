# MAINTAINENCE_SKILL

Purpose
This file documents how to add or change functionality in Kundera while keeping
all entrypoints and platforms in sync (TypeScript, native FFI, and WASM).

Use this as a checklist before merging changes.

-----------------------------------------------------------------------------
Quick Mental Model

Entry points (must stay in sync):
- src/index.ts        -> primary JS API
- src/native/index.ts -> native entrypoint (Bun + Node FFI)
- src/wasm/index.ts   -> wasm entrypoint (explicit load)

Core layers:
- TypeScript API: src/* (primitives/crypto/serde/rpc)
- Zig: primitives + glue (src/*/*.zig)
- Rust: cryptography FFI (lib/starknet-crypto-ffi)

Runtime-specific loaders:
- Bun FFI:  src/native/bun-ffi.ts
- Node FFI: src/native/node-ffi.ts
- Loader:   src/native/loader.ts
- Platform: src/native/platform.ts
- WASM:     src/wasm-loader/*

Parity check (compile-time):
- src/index.ts, src/native/index.ts, src/wasm/index.ts each contain
  `_api satisfies KunderaAPI` to ensure exports stay consistent.

-----------------------------------------------------------------------------
Adding a New Primitive (Type or Utility)

1) TypeScript
- Add implementation + branded types in src/primitives/index.ts
- Add tests in src/primitives/index.test.ts
- Export from src/index.ts (auto-export if using export * in entrypoints)

2) Zig
- Implement in src/primitives/root.zig
- Add Zig tests in the same file
- Wire into build.zig if needed

3) Parity
- Update src/api-interface.ts with the new functions/types
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
- Add extern in src/crypto/ffi.zig
- Add wrapper in src/crypto/root.zig
- Add Zig tests

3) TypeScript
- Add API in src/crypto/index.ts
- Add tests in src/crypto/index.test.ts

4) Native FFI loaders
- Add symbol definitions + wrapper in:
  - src/native/bun-ffi.ts
  - src/native/node-ffi.ts
- Add delegation in src/native/loader.ts

5) WASM loader
- Export in src/wasm-loader/types.ts
- Add memory marshalling in src/wasm-loader/loader.ts
- Add tests in src/wasm-loader/loader.test.ts

6) Parity
- Update src/api-interface.ts
- Verify index/native/wasm parity blocks compile

-----------------------------------------------------------------------------
WASM Integration Rules

- WASM entrypoint is explicit: require `await loadWasmCrypto()`.
- src/wasm/index.ts must NOT import bun:ffi.
- Build artifact: wasm/crypto.wasm (from cargo build --target wasm32-wasip1).
- wasm-loader uses a bump allocator; update carefully when adding new functions.

-----------------------------------------------------------------------------
Native Loader Rules (Bun + Node)

Bun:
- Uses bun:ffi in src/native/bun-ffi.ts.
- No Bun imports should exist in Node paths.

Node:
- Uses ffi-napi / ref-napi in src/native/node-ffi.ts.
- These are optionalDependencies (package.json).
- ESM-safe `createRequire(import.meta.url)` is required.

Loader:
- src/native/loader.ts detects runtime (Bun vs Node).
- Use dynamic require to avoid loading ffi-napi or bun:ffi in the wrong runtime.

Platform:
- src/native/platform.ts resolves:
  - native/<platform>-<arch>/libstarknet_crypto_ffi.<ext>
  - target/release/libstarknet_crypto_ffi.<ext>
  - optional @starknet/kundera-<platform>-<arch> packages

-----------------------------------------------------------------------------
Build + Test Workflow

Recommended local flow:
1) bun test
2) bun run build:dist
3) bun run build:types

Full build pipeline:
- bun run build:native   (cargo build --release)
- bun run build:wasm     (cargo build --target wasm32-wasip1 + copy)
- bun run build:dist     (tsup)
- bun run build:types    (tsc with tsconfig.build.json)
- bun run package:native (package native libs per platform)

Scripts:
- package.json scripts: build, build:dist, build:types, build:native, build:wasm
- prepublishOnly runs build + test

Tsup:
- tsup.config.ts must include all entrypoints:
  src/index.ts, src/native/index.ts, src/wasm/index.ts, src/wasm-loader/index.ts,
  src/primitives/index.ts, src/crypto/index.ts, src/serde/index.ts, src/rpc/index.ts
- Mark externals: bun:ffi, ffi-napi, ref-napi

Types:
- tsconfig.build.json excludes *.test.ts
- src/types/ffi-napi.d.ts provides minimal type stubs

-----------------------------------------------------------------------------
Packaging Native Binaries

Use scripts/package-native.ts to copy native libs into:
  native/<platform>-<arch>/libstarknet_crypto_ffi.<ext>

If distributing platform packages, add:
  @starknet/kundera-<platform>-<arch> as optionalDependencies
and ensure getNativeLibPath resolves them.

-----------------------------------------------------------------------------
Release / Publish Checklist

1) bun test
2) bun run build
3) bun run package:native
4) Verify dist/ and types/ outputs
5) Confirm wasm/crypto.wasm exists

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
