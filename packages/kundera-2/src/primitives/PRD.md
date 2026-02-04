# PRD — Primitives (Cairo Types)

## Purpose
Provide the core Cairo primitive types for Kundera‑2 as branded TypeScript types, with minimal helper utilities. These types are the shared foundation for ABI typing, encoding/decoding, and provider request/response shapes.

## Goals
- Strong compile‑time safety for Cairo values via branded types.
- Zero or near‑zero runtime overhead.
- Stable public surface that can be wrapped by Skills without breaking changes.
- Align structure with Voltaire’s “one‑folder‑per‑type” pattern.

## Non‑Goals
- No runtime validation of bounds or formats (can be added by Skills later).
- No account, signing, or transaction logic.
- No encode/decode logic beyond tiny helpers (handled in ABI runtime).

## Contents
Primitive type families and aliases:
- `Felt252`
- Unsigned ints `Uint8`, `Uint16`, `Uint32`, `Uint64`, `Uint128` (1 felt)
- `Uint256` (public type as branded `bigint`)
- Signed ints `Int8`, `Int16`, `Int32`, `Int64`, `Int128`
- `ByteArray`
- `ShortString` (internally a `Felt252`, max 31 bytes)
- `ContractAddress`
- `ClassHash`
- `EthAddress`
- `Nonce` (alias of `Felt252`)
- `ChainId` (alias of `Felt252`)
- (Optional) `Address = ContractAddress` alias for ergonomics

Minimal helpers (type‑level or tiny runtime):
- `splitU256` and `joinU256` (or `u256ToFelts` / `u256FromFelts`)
- Optional `toFelt` / `toHex` helpers for display only (no validation)

ByteArray note:
- The encoding spec (31‑byte chunks + pending_word + pending_word_len) is implemented in ABI runtime, not here.

## File Structure
Follow a one‑folder‑per‑type layout similar to Voltaire:
- `primitives/Felt252/`
- `primitives/Uint8/`, `primitives/Uint16/`, `primitives/Uint32/`, `primitives/Uint64/`, `primitives/Uint128/`
- `primitives/Uint256/`
- `primitives/Int8/`, `primitives/Int16/`, `primitives/Int32/`, `primitives/Int64/`, `primitives/Int128/`
- `primitives/ByteArray/`
- `primitives/ShortString/`
- `primitives/ContractAddress/`
- `primitives/Address/` (optional alias)
- `primitives/ClassHash/`
- `primitives/EthAddress/`
- `primitives/ChainId/`
- `primitives/Nonce/`

Each type folder exposes a small, consistent surface:
- `types.ts` for branded type definition
- `constants.ts` for shared constants when needed
- `from.ts` for lightweight constructors if required
- `index.ts` for re‑exports

`primitives/index.ts` re‑exports all primitives and helper utilities.

## Dependencies
- No external runtime dependencies.
- Shared `brand.ts` utility at package root for branded types.

## Open Questions
- Whether to include `StorageKey`, `Selector`, `TransactionHash`, and `Timestamp` here or keep them in a later extension.
- Whether to accept `string` inputs in helper functions (if added).
