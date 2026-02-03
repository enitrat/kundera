# Ticket: Primitives - Felt252 + ShortString Modularization

## Goal
Split Felt252 and ShortString into one-function-per-file modules with a clean index facade.

## Scope
src/primitives/Felt252/*
src/primitives/ShortString/*

## Tasks
- [ ] Create folders: src/primitives/Felt252 and src/primitives/ShortString.
- [ ] Move constants to src/primitives/Felt252/constants.ts and src/primitives/ShortString/constants.ts.
- [ ] Move brand/type to src/primitives/Felt252/Felt252Type.ts.
- [ ] Extract prototype logic to src/primitives/Felt252/prototype.ts.
- [ ] Extract constructors: from.ts, fromHex.ts, fromBigInt.ts, fromBytes.ts.
- [ ] Extract ops: toHex.ts, toBigInt.ts, isValid.ts, isZero.ts, equals.ts.
- [ ] Extract short string ops: encodeShortString.ts, encodeShortStringHex.ts, decodeShortString.ts.
- [ ] Build new index facade in src/primitives/Felt252/index.ts with clear exports.
- [ ] Ensure no direct exports remain from the old monolith.

## Acceptance Criteria
- [ ] All Felt252 and ShortString logic lives in their folders.
- [ ] No remaining Felt252/ShortString logic in src/primitives/index.ts.
- [ ] Tests updated to import new modules.
- [ ] Old monolith sections removed (no duplication).

## Dependencies
- 001-guardrails-non-legacy.md
