# PRD — Errors (Centralized)

## Purpose
Provide a centralized, minimal error taxonomy for all core modules (ABI, serde, provider, transport). Errors must be stable, serializable, and framework‑agnostic.

## Goals
- Single place to define error types and codes.
- Clear separation between ABI/serde errors and RPC/transport errors.
- Errors are simple to inspect (`code`, `message`, optional `details`/`cause`).

## Non‑Goals
- No Effect‑style tagged errors or advanced error algebra.
- No verbose stack manipulation or custom stack frames.
- No dependency on external error libraries.

## Base Error
- `KunderaError` extends `Error` and carries:
  - `code: string`
  - `details?: unknown`
  - `cause?: Error`

## Error Hierarchy
- `AbiError` (base for ABI issues)
  - `EncodeError`
  - `DecodeError`
- `SerdeError` (internal serialization failures)
- `ProviderError` (provider‑level failures)
  - `RpcError` (numeric RPC error code + data)
- `TransportError` (network/timeout/fetch failures)

## File Structure
```
errors/
├── index.ts      # Re-exports
├── base.ts       # KunderaError
├── abi.ts        # AbiError, EncodeError, DecodeError
├── serde.ts      # SerdeError
├── provider.ts   # ProviderError, RpcError
├── transport.ts  # TransportError
└── codes.ts      # Error code constants (ABI + RPC)
```

## Error Codes
- ABI codes are string constants (e.g. `ABI_PARSE_ERROR`, `ENCODE_TYPE_MISMATCH`).
- RPC codes are numeric and follow the Starknet JSON‑RPC spec (v0.10).
- `codes.ts` provides a minimal mapping for common cases; do not attempt to mirror the full spec in v1.

## Dependencies
- None (pure module). Other modules import from here.

## Pitfalls & Mitigations
- Avoid leaking transport errors as ABI errors; wrap with `cause` instead.
- Keep `RpcError` distinct from `ProviderError` to preserve spec error codes.
- Ensure errors stringify cleanly (no circular `details`).

## Open Questions
- Whether to expose a public `isKunderaError()` type guard.
