# PRD — Transport (HTTP JSON‑RPC)

## Purpose
Provide a minimal HTTP JSON‑RPC transport and client for Starknet. This is the only runtime implementation in core; WebSocket and batching are out of scope.

## Goals
- Simple, fetch‑based JSON‑RPC requests.
- Clean separation between low‑level HTTP transport and Provider implementation.
- Target **Starknet RPC 0.10 only** (no version negotiation).

## Non‑Goals
- No WebSocket support.
- No batching or retries.
- No caching or middleware pipeline.

## Scope
- `HttpTransport`: low‑level fetch wrapper.
- `RpcClient`: implements `Provider` using JSON‑RPC requests.
- JSON‑RPC request/response typing and error mapping.

## File Structure
```
transport/
├── index.ts        # Re-exports
├── http.ts         # HttpTransport (fetch wrapper)
├── client.ts       # RpcClient (implements Provider)
├── request.ts      # Build JsonRpcRequest
├── response.ts     # Parse JsonRpcResponse, map errors
├── types.ts        # JSON-RPC types (id, request, response, error)
└── errors.ts       # TransportError
```

## Responsibilities
- `HttpTransport` handles fetch, headers, and timeouts.
- `RpcClient` handles method names, params, and maps to Provider calls.
- Error mapping converts JSON‑RPC errors into `RpcError`.

## Pitfalls & Mitigations
- Always set `Content-Type: application/json`.
- Preserve JSON‑RPC `id` and handle `error` vs `result`.
- No retry logic in core.

## Open Questions
- None in core; RPC 0.10 is the single supported version.
