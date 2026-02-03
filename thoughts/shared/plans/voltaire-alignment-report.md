# Kundera ↔ Voltaire Alignment Report (TS + Effect)

Date: February 3, 2026

## Scope
- Only TypeScript and Effect packages.
- Voltaire sources: `packages/voltaire-ts`, `packages/voltaire-effect`.
- Kundera sources: `packages/kundera-ts`, `packages/kundera-effect`.
- Zig/Rust/Python intentionally ignored.

## Executive Summary
- The TS provider layer in Kundera is now aligned with Voltaire’s core shape (typed provider + request schema + HTTP/WS providers + tests). Key gaps remain in Voltaire’s extended provider ecosystem (EIP‑6963, InMemory/Fork providers, state manager, event utilities).
- Kundera TS has schema‑driven Starknet JSON‑RPC and request builders, but lacks Voltaire’s derived schema system and related helpers.
- Kundera TS utilities now match Voltaire’s `utils/` module.
- The major divergence is still **Effect services**: Voltaire exposes a deep services layer (`Transport`, `Provider`, `RpcBatch`, etc.). Kundera Effect currently wraps TS modules without DI‑style services.
- Voltaire provides higher‑level modules (block/stream/transaction/contract/standards). Kundera TS/Effect does not yet, and needs explicit scope decisions.

## What Is Already Aligned (Kundera TS)
- Provider layer exists and mirrors Voltaire’s public surface.
  - Files: `packages/kundera-ts/src/provider/Provider.ts`, `TypedProvider.ts`, `RpcSchema.ts`, `HttpProvider.ts`, `WebSocketProvider.ts`, `schemas/StarknetRpcSchema.ts`, `request/*`, `types.ts`.
- JSON‑RPC request builders match Voltaire’s `Rpc.*Request` approach.
  - File: `packages/kundera-ts/src/jsonrpc/namespace.ts`.
- `utils/` module matches Voltaire’s set.
  - Files: `packages/kundera-ts/src/utils/*`.
- Tests exist for provider, JSON‑RPC namespace, and utils.
  - Files: `packages/kundera-ts/src/provider/*.test.ts`, `packages/kundera-ts/src/jsonrpc/namespace.test.ts`, `packages/kundera-ts/src/utils/*.test.ts`.
- Exports include `./provider` and `./utils`.
  - File: `packages/kundera-ts/package.json`.

## Divergences (TS)

### 1) Provider Feature Set
**Voltaire** provider index is a full EIP‑1193 ecosystem with optional InMemory/Fork providers and EIP‑6963 discovery.

```ts
// Voltaire
export * as EIP6963 from "./eip6963/index.js";
export { InMemoryProvider } from "./InMemoryProvider.js";
export { ForkProvider } from "./ForkProvider.js";
export { StateManagerHost } from "./StateManagerHost.js";
```
`packages/voltaire-ts/src/provider/index.ts`

**Kundera** provider index is strictly HTTP + WebSocket + typed schema.

```ts
// Kundera
export { HttpProvider } from './HttpProvider.js';
export { WebSocketProvider } from './WebSocketProvider.js';
export type { StarknetRpcSchema } from './schemas/index.js';
```
`packages/kundera-ts/src/provider/index.ts`

**Impact**
- No discovery layer (`eip6963`) or stateful/embedded providers.
- No EVM‑style in‑memory or fork provider equivalents.
- Provider events are “EIP‑1193‑inspired” but Starknet‑specific subscriptions are exposed separately (`ProviderEvents`).

**Transition**
- Decide if Starknet needs equivalents for:
  - `InMemoryProvider` (devnet simulator)
  - `ForkProvider` (fork from upstream node)
  - `StateManagerHost` (if local execution is planned)
- If not needed, document “not applicable” explicitly to avoid drift.

### 2) Schema System and Derived Schemas
**Voltaire** adds derived schemas (override blocks, state overrides) for EVM‑specific methods.

`packages/voltaire-ts/src/provider/schemas/DerivedRpcSchema.ts`

**Kundera** has only `StarknetRpcSchema`.

`packages/kundera-ts/src/provider/schemas/StarknetRpcSchema.ts`

**Impact**
- Kundera has strong method typing but no schema composability layer yet.

**Transition**
- Introduce `DerivedStarknetRpcSchema` if Starknet needs method groups (e.g., future namespaces or extensions) that can be composed.

### 3) Request Options Shape
**Voltaire** uses `RequestOptions` with `retry`.

`packages/voltaire-ts/src/provider/types.ts`

**Kundera** uses `retryCount`.

`packages/kundera-ts/src/provider/types.ts`

**Impact**
- Minor API mismatch when comparing patterns and docs.

**Transition**
- Decide whether to standardize on Voltaire’s naming (`retry`) or keep Starknet‑specific naming. Document the choice.

### 4) Higher‑level Modules
Voltaire TS exposes modules like `block/`, `transaction/`, `stream/`, `contract/`, `standards/`.

Examples:
- `packages/voltaire-ts/src/block/*`
- `packages/voltaire-ts/src/transaction/*`
- `packages/voltaire-ts/src/standards/*`

Kundera TS currently does not include Starknet equivalents.

**Transition**
- For each module, record “implement” or “defer” in roadmap.
- Starknet‑specific candidates:
  - `block` (streaming headers + fetch helpers)
  - `contract` (abi + calls + multicall)
  - `transaction` (status streams)

## Divergences (Effect)

### 1) Services Layer (Major Gap)
**Voltaire Effect** is service‑driven with DI/Layers.

```ts
// Voltaire Provider service
export const Provider = Layer.effect(
  ProviderService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    return { request: <T>(m: string, p?: unknown[]) => transport.request<T>(m, p) };
  })
);
```
`packages/voltaire-effect/src/services/Provider/Provider.ts`

**Kundera Effect** exposes only thin wrappers (no services).

`packages/kundera-effect/src/index.ts`

**Impact**
- No DI‑style composition (Transport/Provider/RpcBatch).
- No standardized layering for batching, rate limiting, retries, or presets.

**Transition**
- Add `packages/kundera-effect/src/services/` and start with:
  - `TransportService` + Live HTTP/WS transport layers.
  - `ProviderService` built on `TransportService`.
  - `RpcBatch` built on `utils/batch`.
- Add `presets/` for default layers similar to Voltaire.

### 2) Raw Provider Integration
Voltaire Effect includes `RawProvider` that wraps a low‑level provider in Effect.

`packages/voltaire-effect/src/services/RawProvider/*`

Kundera Effect has no equivalent bridge to `kundera-ts` providers.

**Transition**
- Add a `RawProviderService` for Starknet so Effect users can inject a `HttpProvider`/`WebSocketProvider` directly.

### 3) RpcBatch and Utilities in Effect
Voltaire Effect’s `RpcBatch` and `RateLimiter` services build on shared utilities.

`packages/voltaire-effect/src/services/RpcBatch/*`

Kundera Effect does not expose these as services yet.

**Transition**
- Use `packages/kundera-ts/src/utils/*` as the shared implementation, and wrap in Effect layers.

## Tests and Coverage Gaps
- Voltaire has extensive provider tests: EIP‑6963, InMemory/Fork providers, state manager isolation.
  - Example files: `packages/voltaire-ts/src/provider/InMemoryProvider.test.ts`, `ForkProvider.mock.test.ts`, `StateManager.isolation.test.ts`.
- Kundera has HTTP/WS/Typed provider tests only.
  - Example files: `packages/kundera-ts/src/provider/HttpProvider.test.ts`, `WebSocketProvider.test.ts`.
- Voltaire Effect has deep service tests (`Provider`, `RpcBatch`, `Transport`, `BlockStream`, etc.).
- Kundera Effect currently has no services, therefore no service‑level tests.

## Packaging and Exports
- Voltaire TS exports a very wide surface (provider, utils, block, stream, transaction, etc.).
- Kundera TS now exports `./provider` and `./utils`, but does not export higher‑level modules.
- Voltaire Effect’s index exports many services and modules; Kundera Effect exports only wrappers.

## Recommended Transition Plan (Short‑Term)
1. Add Effect `services/` folder in Kundera and align with Voltaire’s service layering.
2. Introduce `TransportService`, `ProviderService`, `RpcBatch` with tests.
3. Add `RawProviderService` bridge for `HttpProvider`/`WebSocketProvider` from `kundera-ts`.
4. Decide on higher‑level modules (block/contract/transaction) and create Starknet‑specific equivalents or defer explicitly.
5. Update docs to reflect new services and entrypoints, and mark `docs/voltaire-alignment.md` as outdated.

## Notes for Transition Strategy
- Keep Starknet‑specific semantics for subscriptions (`starknet_subscribe*`) while mirroring Voltaire’s typed provider ergonomics.
- If certain Voltaire modules are not applicable to Starknet, record “not applicable” in the roadmap to prevent churn.
- Align naming conventions where possible (`RequestOptions`, `ProviderEvents`, batching). If not, document differences.

