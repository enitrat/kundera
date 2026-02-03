# Ticket: Serde - Modularize One Function Per File

## Goal
Split src/serde/index.ts into one file per function and a clean facade.

## Scope
src/serde/*

## Tasks
- [ ] Extract serializeU256, deserializeU256, serializeArray, deserializeArray, serializeByteArray into separate files.
- [ ] Build a minimal index.ts that re-exports these functions and CairoSerde namespace.
- [ ] Remove all logic from the old monolith.

## Acceptance Criteria
- [ ] One function per file in src/serde.
- [ ] index.ts is only a facade.
- [ ] Old monolith logic removed.

## Dependencies
- 001-guardrails-non-legacy.md
- 030-primitives-index-and-api.md
