# Ticket: kundera-effect - Primitives Modularization + Schemas

## Goal
Refactor kundera-effect primitives to one-function-per-file and add Effect schemas per primitive.

## Scope
kundera-effect/src/primitives/*

## Tasks
- [ ] Create subfolders per primitive (Felt252, ContractAddress, ClassHash, StorageKey, EthAddress, ShortString).
- [ ] Add Schema files for each primitive (e.g. Felt252Schema.ts).
- [ ] Split primitive wrappers into one function per file (from, fromHex, toHex, isValid, etc).
- [ ] Rebuild kundera-effect/src/primitives/index.ts as a facade only.
- [ ] Remove legacy wrappers and monolith exports.

## Acceptance Criteria
- [ ] Each primitive has a schema and modular functions.
- [ ] No monolithic primitive modules remain.
- [ ] No legacy wrappers or deprecated exports exist.

## Dependencies
- 001-guardrails-non-legacy.md
- 010-primitives-felt252-shortstring.md
- 020-primitives-address-types.md
