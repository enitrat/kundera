# Ticket: Primitives - Global Index and API Interface Update

## Goal
Rebuild src/primitives/index.ts as a clean facade and update api-interface to match the new structure. No legacy exports.

## Scope
src/primitives/index.ts
src/api-interface.ts

## Tasks
- [ ] Rebuild src/primitives/index.ts to re-export the new modular primitives.
- [ ] Decide final public surface for primitives and implement directly.
- [ ] Update src/api-interface.ts to import from new paths.
- [ ] Remove any legacy aliases (no deprecated names, no compatibility wrappers).

## Acceptance Criteria
- [ ] src/primitives/index.ts only re-exports modular code.
- [ ] api-interface compiles with new structure.
- [ ] No legacy exports or aliases remain.

## Dependencies
- 001-guardrails-non-legacy.md
- 010-primitives-felt252-shortstring.md
- 020-primitives-address-types.md
