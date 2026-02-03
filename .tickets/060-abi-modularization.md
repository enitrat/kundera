# Ticket: ABI - One Function Per File Refactor

## Goal
Split ABI module into one function per file with a thin index facade.

## Scope
src/abi/*

## Tasks
- [ ] Inventory all exported functions from src/abi/*.ts (parse, encode, decode, calldata, events).
- [ ] Create one file per exported function.
- [ ] Move shared helpers into internal helper files as needed.
- [ ] Rebuild src/abi/index.ts to export from new files only.
- [ ] Remove old monolith implementation files after migration.

## Acceptance Criteria
- [ ] Every exported ABI function lives in its own file.
- [ ] index.ts is a facade only.
- [ ] No legacy code paths remain.

## Dependencies
- 001-guardrails-non-legacy.md
- 030-primitives-index-and-api.md
