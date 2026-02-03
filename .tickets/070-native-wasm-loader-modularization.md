# Ticket: Native/WASM/Loader - Modularize Entry Points

## Goal
Split src/native, src/wasm, and src/wasm-loader into one function per file.

## Scope
src/native/*
src/wasm/*
src/wasm-loader/*

## Tasks
- [ ] Extract each native crypto function to its own file under src/native/.
- [ ] Extract each wasm crypto function to its own file under src/wasm/.
- [ ] Split wasm-loader into files for loadWasmCrypto, isWasmAvailable, isWasmLoaded, getWasmPath, and raw wasm bindings.
- [ ] Rebuild each index.ts as a facade.
- [ ] Remove old monolith files after extraction.

## Acceptance Criteria
- [ ] No heavy logic remains in any index.ts under native/wasm/wasm-loader.
- [ ] One function per file achieved.
- [ ] No legacy exports or adapter shims.

## Dependencies
- 001-guardrails-non-legacy.md
- 040-crypto-modularization.md
