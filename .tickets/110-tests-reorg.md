# Ticket: Tests Reorganization

## Goal
Split monolithic tests to match the new one-function-per-file architecture.

## Scope
src/**/**.test.ts
kundera-effect/src/**/**.test.ts

## Tasks
- [ ] Split src/primitives/index.test.ts into per-primitive test files.
- [ ] Split src/crypto/index.test.ts into per-function or per-group tests.
- [ ] Split src/serde/index.test.ts into per-function tests.
- [ ] Split src/abi/index.test.ts into per-function tests where practical.
- [ ] Split kundera-effect tests to match new folders (primitives, rpc, services).

## Acceptance Criteria
- [ ] Tests live alongside the functions they validate.
- [ ] No monolithic test files remain.

## Dependencies
- 010-primitives-felt252-shortstring.md
- 020-primitives-address-types.md
- 040-crypto-modularization.md
- 050-serde-modularization.md
- 060-abi-modularization.md
- 080-kundera-effect-primitives-schemas.md
- 090-kundera-effect-rpc-and-services.md
