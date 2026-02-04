# PRD — Repo Setup (Tooling, TS Config, Biome, Prek)

## Purpose
Define a strict, modern JavaScript/TypeScript tooling setup for Kundera‑2 that prevents unsafe patterns, enforces formatting and linting, and guarantees type safety and test correctness before commits.

## Goals
- Use Biome as the single formatter + linter.
- Provide a **strict** TypeScript configuration with maximum safety flags.
- Enforce **pre‑commit** checks via Prek (drop‑in pre‑commit alternative) to ensure:
  - typechecks always pass
  - lint/format checks pass
  - tests pass
- Keep setup minimal, deterministic, and fast for contributors.

## Non‑Goals
- No CI pipeline definition in this PRD (handled separately).
- No runtime build system decisions (bundlers, publish targets).

## Tooling Choices
- **Biome** for formatting + linting
- **TypeScript** with strictest feasible flags
- **Prek** as hook manager (pre‑commit replacement)

## TypeScript Configuration
Create a strict base config with the strongest safe flags enabled. Baseline:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `noPropertyAccessFromIndexSignature: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `useUnknownInCatchVariables: true`
- `verbatimModuleSyntax: true`
- `isolatedModules: true`

Also enforce:
- `noImplicitAny: true`
- `alwaysStrict: true`
- `moduleResolution: "bundler"` (or `"node16"` if we target pure Node)

Provide layered configs:
- `tsconfig.base.json` (shared strict settings)
- `tsconfig.json` (project‑specific references)
- `tsconfig.build.json` (build only)

## Biome Configuration
Biome will be the **single source** for formatting and linting:
- Enable formatter and organizeImports
- Enable linter with recommended + stricter rules
- Key strictness rules to enable (error):
  - `noBannedTypes`
  - `noExplicitAny` (ban `any`, allow escape hatch with `// biome-ignore ...`)
  - `useImportType` (enforce `import type` for type‑only imports)
  - `useConsistentTypeDefinitions`

## Pre‑commit (Prek) Hooks
Use Prek with `.pre-commit-config.yaml` and add the following hooks:

### Mandatory hooks
1. **Biome check**
   - `biome check` on staged files
2. **Typecheck**
   - `tsc -p tsconfig.json --noEmit`
3. **Tests**
   - `pnpm test` (or project test runner)

### Optional hooks
- `biome format` (if we want formatting before lint)
- `biome lint` separately (if we want lint‑only runs)

## Hook Execution Policy
- `pre-commit`: run biome + typecheck
- `pre-push`: run tests (slower)
Document `--no-verify` as an emergency escape hatch.

## Files to Add
- `biome.json`
- `.pre-commit-config.yaml`
- `tsconfig.base.json`
- `tsconfig.json`
- `tsconfig.build.json`

## Open Questions
- Confirm package manager (`bun` recommended).
- Confirm module resolution (`bundler` vs `node16`).
- Confirm `skipLibCheck` tradeoff.
