# Changelog

## v0.0.5 (2026-02-07)

### Breaking Changes

- **FeeEstimate field renames**: `gas_consumed` → `l1_gas_consumed`, `gas_price` → `l1_gas_price`, `data_gas_consumed` → `l1_data_gas_consumed`, `data_gas_price` → `l1_data_gas_price` — aligns with Starknet RPC v0.7 spec
- **ABI engine replaced**: Removed `kanabi` dependency, replaced with native ABI inference (`InferArgs`, `InferReturn`, `InferFunctionName`) for typed contract reads/writes
- **JSON-RPC refactored**: Voltaire-style request builder pattern — `provider.request(Rpc.CallRequest(...))` replaces `provider.starknet_call(...)`
- **Domain primitives**: 8 new primitive modules (`BlockHeader`, `Block`, `Transaction`, `Receipt`, `Event`, `StateUpdate`, `FeeEstimate`, `Trace`) with `fromRpc`/`toRpc` codecs
- **FFI backend**: Replaced `ffi-napi` with `koffi` for Node.js native bindings

### Features

- **Wallet support**: `walletTransport`, `WalletProvider`, `WalletRpcSchema`, and wallet RPC request builders for browser wallet integration
- **ABI type inference**: Generic type inference on contract read/write skills — `contract.read("balanceOf", { owner })` returns typed results
- **Keccak256 native FFI**: Added Keccak256 to the Rust FFI backend
- **ByteArray primitive**: New `ByteArray` type for Cairo byte array encoding
- **Integer type library**: Complete `Int8`–`Int128`, `Uint8`–`Uint256` primitives with SNIP-12 support
- **Three-backend crypto**: Pedersen, Poseidon, Keccak each have pure-TS, native FFI, and WASM backends
- **MSW integration tests**: Mock Service Worker tests for BlockHeader and FeeEstimate wire types
- **kundera-ui example**: Wallet integration example app

### Fixes

- **effect**: Updated FeeEstimate field names in `DefaultFeeEstimator` to match RPC spec
- **effect**: Removed double-unwrap in ContractFactory after `decodeOutput` change
- **provider**: Typed return inference for Rpc request builders
- **docs**: Fixed stale APIs (26 `starknet_call` refs → `Rpc.CallRequest`), deduplicated branded types pages, unified architecture docs

### Docs

- Restructured skills index with categories and composition flow
- Merged 3 branded-types pages into single canonical `shared/branded-types.mdx`
- Made landing page neutral (TS and Effect presented equally)
- Clarified Native=sync, WASM=async in runtime implementations
- Added `get-contract` skill documenting ABI type inference

### Internal

- Migrated from `bun:test` to Vitest
- Added `vite-tsconfig-paths` for package self-imports
- Primitives converted to `.js` + JSDoc for tree-shaking
- Automated doc generation pipeline (`typedoc` → frontmatter → navigation → setup)
