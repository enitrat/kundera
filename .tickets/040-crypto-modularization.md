# Ticket: Crypto - Modularize One Function Per File

## Goal
Split src/crypto/index.ts into modular files and shared state helpers.

## Scope
src/crypto/*

## Tasks
- [ ] Extract backend state to src/crypto/state.ts.
- [ ] Extract backend resolvers to src/crypto/getNative.ts and src/crypto/getWasm.ts.
- [ ] Extract loader to src/crypto/loadWasmCrypto.ts.
- [ ] Create files for each exported function (pedersenHash, poseidonHash, poseidonHashMany, snKeccak, feltAdd, feltSub, feltMul, feltDiv, feltNeg, feltInverse, feltPow, feltSqrt, sign, verify, getPublicKey, recover).
- [ ] Update src/crypto/index.ts to re-export all functions and namespaces.
- [ ] Remove monolith logic from index.ts.

## Acceptance Criteria
- [ ] No non-trivial logic remains in src/crypto/index.ts.
- [ ] All crypto functions live in their own files.
- [ ] No legacy exports or adapters.

## Dependencies
- 001-guardrails-non-legacy.md
- 030-primitives-index-and-api.md
