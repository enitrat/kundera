# Ticket: Migration Guardrails (No Legacy)

## Goal
Establish strict migration rules: no legacy API, no adapter layer, no deprecated wrappers, and monolith files removed once replaced.

## Scope
Repository-wide policy and removal of legacy patterns during refactor.

## Tasks
- [ ] Add a short migration policy doc in docs/ (e.g. docs/migration-guardrails.md).
- [ ] State explicitly that breaking changes are allowed and expected (no external consumers).
- [ ] Define the new public API surface that will remain after migration.
- [ ] Add a checklist item to every refactor ticket: remove the old monolith after extraction.
- [ ] Ensure no "compat" exports remain in package.json after migration.

## Acceptance Criteria
- [ ] Policy doc exists and is referenced by other tickets.
- [ ] No legacy or compatibility code is planned or kept.
- [ ] After migration, monolith files are deleted, not kept in parallel.

## Dependencies
- None.

## Notes
- No legacy patterns allowed post-migration.
- No adaptation plan or backward compatibility layer.
