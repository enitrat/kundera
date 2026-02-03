# Voltaire Alignment Roadmap (Kundera TS + Effect)

## Scope
Align Kundera with Voltaire’s structure and philosophy for **TypeScript** and **Effect** packages only.
This plan assumes **breaking changes are allowed** and that **structure/packaging is already done**.

## Current State (Baseline)
- Monorepo with `packages/kundera-ts` and `packages/kundera-effect`.
- Core primitives exposed as granular subpath exports.
- JSON-RPC module exists (`jsonrpc/`), transport layer exists (`transport/`).
- Effect package wraps primitives/crypto/serde/transport/jsonrpc.
- CI and release flows updated to monorepo pnpm.

## Goals
1. Match Voltaire’s high‑level architecture: provider + schema‑driven JSON‑RPC + utilities + services.
2. Provide a composable, type‑safe API surface for Starknet that mirrors Voltaire’s structure.
3. Ensure tree‑shaking friendly exports and consistent Effect layers.

---

## Phase 1 — Provider Layer (TS)
**Why:** Voltaire’s architecture pivots around `provider/` and typed request/response handling.

Deliverables:
- `packages/kundera-ts/src/provider/` with:
  - `Provider.ts`, `TypedProvider.ts`, `HttpProvider.ts`, `WebSocketProvider.ts`.
  - Optional: `InMemoryProvider` if a local/mock transport is available.
  - `schemas/` and `events/` scaffolding similar to Voltaire.
- Provider-level batching, request id handling, and error normalization.
- Exports in `packages/kundera-ts/package.json` (`./provider`).

Acceptance:
- Provider unit tests for basic requests, batching, and error handling.
- `pnpm -r typecheck` and `pnpm -r test:run` pass.

---

## Phase 2 — JSON‑RPC Schemas + Builders (TS)
**Why:** Voltaire uses schema‑driven JSON‑RPC with request/response typing and validation.

Deliverables:
- `packages/kundera-ts/src/jsonrpc/schemas/` for Starknet methods.
- `packages/kundera-ts/src/jsonrpc/*` request/response builders.
- Typed error handling consistent with Voltaire’s JSON‑RPC patterns.

Acceptance:
- Tests for at least 5 core Starknet methods using schema validation.
- Provider calls integrate schema definitions.

---

## Phase 3 — Utilities Layer (TS)
**Why:** Voltaire exposes runtime helpers (`utils/`) used across provider/services.

Deliverables:
- `packages/kundera-ts/src/utils/` with:
  - `retryWithBackoff`, `poll`, `batch`, `timeout`, `rateLimit` (names may map to Starknet needs).
- `./utils` export in package.json.

Acceptance:
- Unit tests for utilities.

---

## Phase 4 — Effect Services Layer
**Why:** Voltaire Effect exposes a rich `services/` layer for DI and composability.

Deliverables:
- `packages/kundera-effect/src/services/`:
  - `Transport`, `Provider`, `RpcBatch` (core), plus `RateLimiter` / `Cache` if useful.
- Presets/layers for common production defaults.
- Effect wrappers that use the Provider layer + schema‑driven JSON‑RPC.

Acceptance:
- Tests for at least Transport + Provider services.
- Docs for new services.

---

## Phase 5 — Higher‑level Modules (Optional/Iterative)
**Why:** Voltaire offers modules like block/stream/transaction/contract; we may add only what makes sense for Starknet.

Deliverables (selective):
- `block/`, `stream/`, `transaction/`, `contract/` if Starknet use‑cases justify.
- If not implemented, document intentionally out‑of‑scope.

Acceptance:
- Decision recorded for each module (implement or defer).

---

## Cross‑Cutting Tasks
- Ensure all new exports are tree‑shakeable and have types in `typesVersions`.
- Keep `_api satisfies KunderaAPI` parity checks aligned.
- Keep docs/skills updated with new entrypoints.
- Extend CI coverage if new modules introduce new tooling.

---

## Validation Checklist (per phase)
- `pnpm -r typecheck`
- `pnpm -r test:run`
- New modules have minimal docs/examples
- No legacy paths remain; only monorepo structure is used
