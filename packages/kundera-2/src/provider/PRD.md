# PRD — Provider (Interfaces + Types)

## Purpose
Define the minimal provider interface and request/response types for interacting with Starknet JSON‑RPC. This module is strictly types and interfaces; implementations live elsewhere.

## Goals
- Provide a stable, minimal Provider interface aligned with core use cases.
- Keep account/signing out of scope while supporting signed invoke payloads.
- Provide strong types for request/response shapes and IDs (BlockId, BlockTag, ChainId, Nonce).

## Non‑Goals
- No HTTP/WebSocket implementation.
- No batching or retries.
- No account module or signing helpers.

## Provider Interface
Minimal interface:
- `call(request: CallRequest): Promise<CallResult>`
- `invoke(request: InvokeRequest): Promise<InvokeResult>`
- `estimateFee(request: EstimateFeeRequest): Promise<FeeEstimate>`
- `getNonce(address: ContractAddress, blockId?: BlockId): Promise<Nonce>`
- `getChainId(): Promise<ChainId>`

Notes:
- `invoke` accepts signed transactions only.
- `UnsignedInvoke` is a type‑only helper (no logic).

## File Structure
```
provider/
├── index.ts        # Re-exports
├── Provider.ts     # Provider interface
├── types.ts        # Request/response types + IDs
├── block.ts        # BlockId / BlockTag
├── errors.ts       # ProviderError, RpcError (code + data)
└── rpc.ts          # RPC method name constants
```

## Types (examples)
- `BlockTag = 'latest' | 'pending'`
- `BlockId = BlockTag | { block_hash: string } | { block_number: number }`
- `Nonce`, `ChainId` as branded `Felt252`
- `CallRequest`, `InvokeRequest`, `EstimateFeeRequest`
- `CallResult`, `InvokeResult`, `FeeEstimate`
- `UnsignedInvoke` (type only)

## Dependencies
- Uses `primitives` for branded Cairo types.
- No transport or RPC implementation dependency.

## Pitfalls & Mitigations
- RPC spec version drift: core targets **RPC 0.10 only**; no version negotiation.
- Signature format must match Starknet `[r, s]` expectations.
- RPC errors should include `code` and `data`.

## Open Questions
- Whether to add a `specVersion` field to requests for forward compatibility.
