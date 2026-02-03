# Ticket: kundera-effect - RPC Functions + Service Layer

## Goal
Split RPC wrappers into one file per function and add a Provider/Transport service layer aligned with Effect DI.

## Scope
kundera-effect/src/rpc/*
kundera-effect/src/services/*

## Tasks
- [ ] Split kundera-effect/src/rpc/index.ts into functions/ folder (one file per starknet_* method).
- [ ] Build a minimal services layer: TransportService and ProviderService with Effect DI.
- [ ] Create Provider functions in kundera-effect/src/services/Provider/functions/ mirroring core RPC methods.
- [ ] Add errors and types for Provider/Transport services (Effect TaggedError).
- [ ] Rebuild kundera-effect/src/rpc/index.ts and kundera-effect/src/services/index.ts as facades.
- [ ] Remove old monolithic wrappers.

## Acceptance Criteria
- [ ] One RPC wrapper per file.
- [ ] Provider/Transport services exist with DI entrypoints.
- [ ] No legacy adapter layer or monoliths.

## Dependencies
- 001-guardrails-non-legacy.md
- 080-kundera-effect-primitives-schemas.md
