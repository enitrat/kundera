# Ticket: Build + Exports Cleanup (No Legacy)

## Goal
Ensure build and package exports only expose the new modular structure. Remove legacy exports.

## Scope
package.json
tsconfig.build.json
tsup.config.ts
kundera-effect/package.json
kundera-effect/tsup.config.ts

## Tasks
- [ ] Update tsup entrypoints to match new file structure.
- [ ] Update package.json exports to remove any legacy paths.
- [ ] Update kundera-effect exports to match new structure.
- [ ] Verify types build with tsc (no legacy d.ts paths).

## Acceptance Criteria
- [ ] Exports only point to new modules.
- [ ] No legacy export paths remain.
- [ ] Build succeeds with new structure.

## Dependencies
- 001-guardrails-non-legacy.md
- 030-primitives-index-and-api.md
- 040-crypto-modularization.md
- 050-serde-modularization.md
- 060-abi-modularization.md
- 070-native-wasm-loader-modularization.md
- 080-kundera-effect-primitives-schemas.md
- 090-kundera-effect-rpc-and-services.md
