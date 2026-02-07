## Philosophy

### Single Source of Truth

Rust is the core for crypto. All performance-critical logic lives there. TypeScript consumes Rust through FFI (bun:ffi, koffi) or WASM. Fix a bug once in Rust, every runtime gets the fix. No "the WASM version behaves differently" problems.

### Rust + TypeScript Partnership

Rust handles crypto (Pedersen, Poseidon, STARK curve ECDSA) via battle-tested `starknet-crypto` crate. TypeScript handles everything else: ABI encoding, provider logic, transaction building, serialization. We don't reimplement audited crypto in TypeScript. We use Rust where its ecosystem is irreplaceable, TypeScript for orchestration and user-facing APIs.

### Explicit Over Magic

No auto-detection of backends. You import pure TS, native FFI, or WASM explicitly. You know what runs. Tree-shaking works because unused backends never enter your bundle.

### Zero-Cost Type Safety

Branded types (`Felt252Type = Brand<Uint8Array, "Felt252"> & FeltMethods`) give compile-time safety with no runtime cost. The brand is phantom—it doesn't exist in JavaScript. You get type safety of wrapper classes with performance of raw primitives.

### Tree-Shaking First

`.js` implementations with JSDoc types, `.ts` only for type definitions. One function per file. No dead imports. Bundlers see only what's actually used.

### Primitives-First

The core library provides only foundational primitives—Cairo types, ABI encoding, serialization, provider interfaces, error definitions. Higher-level abstractions (account modules, contract wrappers, caching) exist as reference patterns you copy and own. See `packages/kundera-2/PHILOSOPHY.md` for full rationale.

---

### Communication

- Show human plan in most brief form. Prioritize plan before executing.
- BRIEF CONCISE COMMUNICATION
- Sacrifice grammar for sake of brevity
- 1 sentence answers when appropriate
- No fluff like "Congratulations" or "Success"
- Talk like we are just trying to get work done
- Efficient like air traffic controller

### Personality

You are a ruthless mentor. You never sugarcoat anything. And you challenge ideas or assumptions until they are bulletproof.

## MISSION CRITICAL

Every line correct. No stubs/commented tests.

LLMS ARE NEVER TO COMMENT OUT OR DISABLE TESTS

Never make time or work estimates of how long work will take it is not useful context

### Ownership Mindset

**Treat this codebase as YOUR codebase.** You are not a visitor making drive-by changes—you are a maintainer with full responsibility. Every file you touch, every test you run, every error you see is YOUR problem to solve.

### Test Failure Policy

**ALL test failures are P0.** If tests were passing before your changes and fail after, YOU caused the regression regardless of whether the failure appears related. Fix it.

- Never dismiss failures as "pre-existing" or "unrelated"
- Never blame other code, dependencies, or flaky tests
- If main was green and now it's red, your change broke it
- Run full test suite before and after changes
- No excuses—fix every failure you introduce

### Type Error Policy

**ALL type errors are absolutely unacceptable.** TypeScript errors are not warnings—they are failures that block shipping.

- Type errors indicate broken contracts and potential runtime bugs
- Never dismiss type errors as "pre-existing" or "unrelated to my changes"
- If you see type errors after your changes, YOU fix them
- Run `pnpm typecheck` to verify before considering work complete
- Zero type errors is the only acceptable state

### Console Policy

**NO console.log/warn/error in library code.** This is a library - users control their own logging.

- Never use `console.*` in src/ (except tests)
- Throw errors instead of logging warnings
- If something is worth warning about, it's worth throwing for

**Status**: Alpha release. Expect frequent refactors/renames. Coordinate changes that affect published exports.

### Workflow

- Run from repo root (never `cd` unless user requests it)
- Sensitive data: abort everything immediately
- Think hard about memory safety when writing Rust FFI
- Think hard about typesafety when writing TypeScript
- TDD: `cargo test` for Rust, `pnpm test:run` for TS. Always know early and often if build breaks
- Not obvious? Improve visibility, write unit tests
- Producing a failing minimal reproduction of the bug in a test we commit is the best way to fix a bug

## Architecture

Starknet primitives + crypto. Multi-runtime: TS + Rust FFI + WASM.

**Packages**:
- `kundera-ts` - Main library (primitives, crypto, ABI, provider, transport, serde)
- `kundera-effect` - Effect-TS integration
- `kundera-2` - Next-gen primitives (in development)

**Modules**: primitives/ (Felt, Address, ClassHash, ContractAddress), crypto/ (Pedersen, Poseidon, StarkCurve, Keccak), abi/ (types, runtime encoding), provider/ (JSON-RPC client), transport/ (HTTP, WebSocket), serde/ (serialization), errors/

**Imports**: Use subpath exports: `@kundera-sn/kundera-ts/native`, `@kundera-sn/kundera-ts/wasm`, `@kundera-sn/kundera-ts/abi`

**Colocated**: Related TS files in same folder (e.g., `crypto/Pedersen/`)

## Build

### Rust Commands

```bash
# Core
cargo build                       # Debug build
cargo build --release             # Release build (optimized)
cargo test                        # All Rust tests

# FFI library output
cargo build --release             # → target/release/libstarknet_crypto_ffi.{dylib,so,dll}
```

### Package Scripts

```bash
# Build
pnpm build                        # Full build (all packages)
pnpm -r build                     # Build all packages recursively
pnpm build:dist                   # TS bundling (tsup)

# Test
pnpm test                         # Vitest watch
pnpm test:run                     # Vitest single run
pnpm test:coverage                # Coverage report
pnpm test:native                  # Native FFI tests
pnpm test:wasm                    # WASM tests

# Docs
pnpm docs:dev                     # Mintlify dev (localhost:3000)
pnpm docs:build                   # Build docs
pnpm docs:verify-links            # Verify doc links

# Quality
pnpm format                       # biome format
pnpm lint                         # biome lint
pnpm typecheck                    # TypeScript type checking

# Monorepo
pnpm clean                        # Clean all artifacts
pnpm changeset                    # Create changeset for versioning
pnpm release                      # Build + publish
```

## TypeScript

### Branded Types + Namespace Pattern

Data-first branded primitives with tree-shakable namespace methods:

```typescript
// Type def (types.ts)
type Brand<T, B> = T & { readonly [brand]: B };
export type Felt252Type = Brand<Uint8Array, "Felt252"> & FeltMethods;

// Internal method (toHex.js - NOTE .js extension!)
export function toHex(data: Felt252Type): Hex { ... }

// Index: dual export (index.ts)
export { toHex as _toHex } from "./toHex.js";   // Internal API
export function toHex(value: FeltInput): Hex {  // Public wrapper
  return _toHex(from(value));
}

// Usage
import * as Felt from '@kundera-sn/kundera-ts/felt';
Felt.toHex("0x123...")      // Public (wrapper auto-converts)
Felt._toHex(felt)           // Advanced (internal, no conversion)
```

**File organization**:

```
Felt252/
├── types.ts          # Type definition (Felt252Type, FeltMethods, Brand)
├── from.js           # Constructor (no wrapper needed)
├── toHex.js          # Internal method
├── equals.js         # Internal method
├── index.ts          # Dual exports (_internal + wrapper)
└── *.test.ts         # Tests (separate files, NOT inline)
```

### One Function Per File

**Rule**: Each exported function gets its own file. This enables tree-shaking and clear ownership.

**When to split**:
- Every public/exported function → separate file
- Complex private helpers (40+ lines) → separate file with tests
- Simple private helpers (<40 lines, used once) → inline in consumer file
- Constants → colocate with the single function that uses them

**When NOT to split**:
- Tiny utilities like `sleep()` (5 lines) used in one place → inline
- Constants used by only one function → keep in that function's file
- Private helper that's clearly coupled to one function → inline

**Key patterns**:

- `.js` extension for implementation (NOT .ts)
- JSDoc types in .js files
- Internal methods take data as first param
- Wrapper functions for public API
- Dual exports: `_internal` + wrapper
- Namespace export: `export * as Felt`

**Naming**: `Type.fromFoo` (construct from Foo), `Type.toFoo` (convert to Foo), `Type()` preferred over `Type.from()` for main constructor

**Constructor preference**: Use `Felt()`, `Address()`, `ClassHash()` not `Felt.from()`, `Address.from()`, `ClassHash.from()`

## Rust FFI

### Style

- Expose C-compatible functions with `#[no_mangle] pub extern "C"`
- Use fixed-size byte arrays for data transfer (`[u8; 32]` for Felt)
- Caller allocates output buffers, FFI fills them
- Return `bool` or error codes for fallible operations
- Keep FFI surface minimal—complex logic stays internal

### Library Structure

```
lib/starknet-crypto-ffi/
└── src/
    └── lib.rs         # FFI exports (Pedersen, Poseidon, ECDSA, Felt arithmetic)
```

### FFI Functions

```rust
// Example pattern
#[no_mangle]
pub extern "C" fn starknet_pedersen_hash(
    a: *const FeltBytes,
    b: *const FeltBytes,
    out: *mut FeltBytes
) { ... }
```

### Cargo.toml

```toml
[lib]
crate-type = ["staticlib", "cdylib"]  # Static + dynamic library
```

## Testing

### Organization

- **TypeScript**: Separate `*.test.ts` files (vitest, NOT inline)
- **Rust**: Inline `#[cfg(test)]` modules in source files
- **Integration**: Cross-runtime tests in `tests/` directories

### Commands

```bash
# Rust
cargo test                        # All Rust tests
cargo test pedersen               # Filter by name

# TypeScript
pnpm test:run                     # All TS tests
pnpm test -- felt                 # Filter
pnpm test:coverage                # Coverage
pnpm test:native                  # Native FFI tests
pnpm test:wasm                    # WASM tests
```

### Pattern

Self-contained, fix failures immediately, evidence-based debug. **No output = passed**.

## Documentation

### Mintlify Site

- **Location**: `docs/`
- **Config**: `docs/docs.json`
- **Format**: MDX (Markdown + JSX) with YAML frontmatter
- **Structure**: getting-started/, guides/, typescript/, effect/

### Skills (Symlink Pattern)

Skills live in `packages/kundera-ts/docs/skills/` but Mintlify requires files inside `docs/`. We use a symlink:

```
docs/typescript/skills → ../../packages/kundera-ts/docs/skills
```

**Why symlink?** Mintlify can't reference paths outside `docs/` (no `../packages/...`). Symlink lets us:
- Keep skills colocated with package (tests + implementations + docs together)
- Avoid file duplication
- Keep `docs.json` paths unchanged (`typescript/skills/*`)

**Structure**:
```
packages/kundera-ts/docs/skills/
├── *.mdx          # Documentation
├── *.ts           # Skill implementations
└── *.test.ts      # Pattern validation tests
```

### Commands

```bash
pnpm docs:setup       # Create symlinks + discover pages (runs automatically)
pnpm docs:dev         # Dev server (runs setup first)
pnpm docs:build       # Build docs (runs setup first)
pnpm docs:generate    # TypeDoc + frontmatter + navigation + setup
pnpm docs:verify-links # Verify links
```

### Adding Package Docs

To add docs from a new package, edit `scripts/setup-docs.ts`:

```typescript
const PACKAGE_DOC_SOURCES: Record<string, string> = {
  "typescript/skills": "packages/kundera-ts/docs/skills",
  "effect/skills": "packages/kundera-effect/docs/skills",  // Add new sources here
};
```

Then run `pnpm docs:setup` - symlinks are created and docs.json is updated.

## WASM

### Build

WASM builds use `wasm-pack` or Cargo with `--target wasm32-unknown-unknown`.

### Usage

```typescript
import * as Crypto from '@kundera-sn/kundera-ts/wasm';
```

### Notes

- Pure Rust crypto compiles to WASM without issues
- No `std` features that require system calls
- Loader: `src/wasm-loader/` (instantiation, memory, errors)

## Dependencies

### Rust (Cargo.toml)

- **starknet-crypto** - Pedersen, Poseidon, STARK curve ECDSA
- **sha3** - Keccak256 for selector computation

### Node (package.json)

- **Mintlify** - Docs site
- **Vitest** - Testing
- **tsup** - Bundling
- **biome** - Format/lint
- **@changesets/cli** - Versioning

### Starknet Crypto

| Function | Description |
|----------|-------------|
| `pedersen_hash(a, b)` | Pedersen hash of two felts |
| `poseidon_hash(a, b)` | Poseidon hash of two felts |
| `poseidon_hash_many(inputs)` | Poseidon hash of N felts |
| `starknet_keccak(data)` | Truncated Keccak256 (250 bits) |
| `get_public_key(private_key)` | Derive public key from private |
| `sign(private_key, message_hash)` | ECDSA sign on STARK curve |
| `verify(public_key, message_hash, r, s)` | ECDSA verify |
| `recover(message_hash, r, s, v)` | Recover public key from signature |

## Crypto Security

**Constant-time**: Rely on `starknet-crypto` crate's implementations
**Validate**: signature components (r, s, v), curve points, hash lengths
**Test**: known vectors from Starknet specs, edge cases (zero/max), malformed inputs

## Refs

Starknet Docs: https://docs.starknet.io/
Cairo Book: https://book.cairo-lang.org/
Starknet Specs: https://github.com/starkware-libs/starknet-specs

## Collab

Propose→wait. Blocked: stop, explain, wait.

## Git Safety

❌ `git reset --hard` - NEVER use. Destructive, loses work.
❌ `git push --force` - NEVER use without explicit user permission. Always ask first.
✅ `git revert` - Use for reverting commits safely.

## GitHub

"_Note: Claude AI assistant, not @enitrat_" (all issue/API ops)
