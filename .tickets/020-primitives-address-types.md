# Ticket: Primitives - ContractAddress, ClassHash, StorageKey, EthAddress

## Goal
Split address-like primitives into modular files with validation separated from constructors.

## Scope
src/primitives/ContractAddress/*
src/primitives/ClassHash/*
src/primitives/StorageKey/*
src/primitives/EthAddress/*

## Tasks
- [ ] Create one folder per primitive and add Type file (e.g. ContractAddressType.ts).
- [ ] Add constructor file from.ts for each primitive.
- [ ] Add validation file isValid.ts (where applicable).
- [ ] Add constants file if needed (MAX values).
- [ ] Add index.ts per primitive for exports.
- [ ] Remove corresponding sections from the old monolith.

## Acceptance Criteria
- [ ] Each primitive has its own folder and files.
- [ ] Old monolith sections are deleted.
- [ ] All imports updated to new paths.

## Dependencies
- 001-guardrails-non-legacy.md
- 010-primitives-felt252-shortstring.md
