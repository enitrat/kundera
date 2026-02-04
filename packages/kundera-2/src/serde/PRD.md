# PRD — Serde (Internal CairoValue ↔ felt[])

## Purpose
Provide internal, pure helper functions for serializing and deserializing Cairo values to and from `felt[]`. This module is used by `abi/runtime` and is not exposed as a public API.

## Goals
- Deterministic, spec‑accurate serialization for Cairo primitives and containers.
- Minimal, composable functions with no side effects.
- Cursor‑based deserialization to support nested decoding.

## Non‑Goals
- No ABI awareness (struct/enum mapping handled in `abi/runtime`).
- No network or provider logic.
- No public exports from package root.

## Scope
- Serialize/deserialize: felt, bool, uN/iN, u256, ByteArray, Array.
- Helpers: split/join u256, cursor utilities.

## File Structure
```
serde/
├── index.ts            # Internal re-exports
├── types.ts            # CairoValue + CairoSerde interface
├── serialize/
│   ├── felt.ts
│   ├── numeric.ts
│   ├── u256.ts
│   ├── bool.ts
│   ├── byteArray.ts
│   ├── array.ts
│   └── index.ts
├── deserialize/
│   ├── felt.ts
│   ├── numeric.ts
│   ├── u256.ts
│   ├── bool.ts
│   ├── byteArray.ts
│   ├── array.ts
│   └── index.ts
└── utils.ts            # splitU256/joinU256 + cursor helpers
```

## Cursor Model
- Deserializers accept `{ felts: Felt252[], offset: number }` and return `{ value, offset }`.
- Enables nested decoding without slicing arrays.

## Pitfalls & Mitigations
- ByteArray encoding must follow Cairo spec: 31‑byte chunks + pending_word + pending_word_len.
- iN types use two’s complement; sign extension must be handled correctly.
- u256 must reject values ≥ 2^256.
- Empty arrays serialize as `[0]`.

## Dependencies
- Uses `primitives` for branded types.
- Called only from `abi/runtime`.
