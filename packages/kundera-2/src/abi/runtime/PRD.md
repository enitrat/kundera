# PRD — ABI Runtime (Parse/Encode/Decode)

## Purpose
Provide runtime ABI parsing and value encoding/decoding for Starknet Cairo types. This module powers contract calls and event decoding without introducing provider or account logic.

## Goals
- Parse ABI definitions into indexed structures for fast lookup.
- Encode inputs and decode outputs/events per Cairo ABI rules.
- Support core Cairo types and containers (struct/enum/tuple/Option/Span/Array).
- Provide deterministic errors for invalid or incompatible inputs.

## Non‑Goals
- No network or JSON‑RPC logic.
- No account/signature handling.
- No class hash computation (deferred to future crypto/util module).

## Scope
Core capabilities:
- `parseType`: string → ParsedType AST
- `parseAbi`: ABI → indexed functions/structs/enums/events
- `encodeValue` / `encodeArgs`
- `decodeValue` / `decodeArgs` / `decodeOutputs`
- `decodeEvent` for event logs
- ByteArray encoding spec (31‑byte chunks + pending_word + pending_word_len)

## File Structure
```
abi/runtime/
├── index.ts        # Re-exports
├── parse/
│   ├── index.ts
│   ├── parseType.ts
│   ├── parseAbi.ts
│   ├── getters.ts      # getFunction/getStruct/getEnum/getEvent
│   └── selector.ts     # computeSelector, selectorHex
├── encode.ts           # encodeValue, encodeArgs
├── decode.ts           # decodeValue, decodeArgs, decodeOutputs
├── calldata.ts         # encodeCalldata, decodeCalldata
├── events.ts           # decodeEvent, getEventSelector
└── errors.ts           # AbiError, EncodeError, DecodeError
```

## Error Model
- `AbiError` for parse and type mismatch errors.
- `EncodeError` / `DecodeError` for runtime conversion failures.

## Dependencies
- Uses `abi/types` for ABI entry shapes.
- Uses `serde` helpers internally for CairoValue ↔ felt[] conversions.
- Depends on `primitives` for branded types.

## Pitfalls & Mitigations
- Avoid circular imports between parse and encode/decode.
- Strictly preserve enum variant order from ABI.
- Validate numeric bounds where applicable (felt < prime, u256 < 2^256).

## Open Questions
- Whether to add optional fast‑path caches for parsed ABI lookups.
