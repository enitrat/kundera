# Stale API Usage Report
Generated: 2026-02-07

## Summary

Found **35+ files** with stale API usage after the JSON-RPC refactoring. The codebase was refactored to use `provider.request(Rpc.XxxRequest(...))` pattern but documentation still shows old APIs.

---

## Critical Issues

### 1. `starknet_call` Function — KILLED, Still Referenced

**Status**: Function was DELETED in refactor, but docs still import/call it

**Found in 26 locations:**

#### TypeScript Docs (Both `/docs` and `/packages/kundera-ts/docs`)

| File | Lines | Issue |
|------|-------|-------|
| `docs/typescript/overview.mdx` | 38, 48, 104, 116, 134 | Imports `starknet_call`, shows usage examples |
| `packages/kundera-ts/docs/overview.mdx` | 38, 48, 104, 116, 134 | Duplicate of above (symlinked?) |
| `docs/typescript/api/jsonrpc.mdx` | 42 | Migration table references `starknet_call` |
| `packages/kundera-ts/docs/api/jsonrpc.mdx` | 42 | Duplicate |
| `docs/typescript/skills/contract-read.mdx` | 6, 47 | "Built on `starknet_call`" |
| `packages/kundera-ts/docs/skills/contract-read.mdx` | 6, 47 | Duplicate |
| `docs/typescript/skills/contract-multicall.mdx` | 62, 63, 64 | JSON examples with method: "starknet_call" |
| `packages/kundera-ts/docs/skills/contract-multicall.mdx` | 62, 63, 64 | Duplicate |
| `docs/typescript/skills/http-provider.mdx` | 32 | Example shows `method: 'starknet_call'` |
| `packages/kundera-ts/docs/skills/http-provider.mdx` | 32 | Duplicate |

#### Effect Docs

| File | Lines | Issue |
|------|-------|-------|
| `docs/effect/primitives/contract-address.mdx` | 320 | JSON example: `method: "starknet_call"` |
| `docs/effect/guides/error-handling.mdx` | 39, 146, 242, 347 | `Rpc.starknet_call()` usage (Effect version) |
| `docs/effect/modules/jsonrpc.mdx` | 39 | `Rpc.starknet_call()` example |
| `docs/effect/modules/abi.mdx` | 386 | JSON example |
| `docs/effect/modules/transport.mdx` | 63 | `Transport.createRequest('starknet_call', ...)` |

#### Shared/Guide Docs

| File | Lines | Issue |
|------|-------|-------|
| `docs/shared/architecture.mdx` | 99, 102, 204, 226 | Imports + usage + diagrams |
| `docs/shared/why-kundera.mdx` | 64, 92, 102 | Comparison examples |
| `docs/guides/migration-from-starknetjs.mdx` | 392 | Migration example |

#### Generated API Docs

| File | Lines | Issue |
|------|-------|-------|
| `docs/generated-api/jsonrpc/namespaces/Rpc.mdx` | 160 | `method: "starknet_call"` |
| `docs/generated-api/provider.mdx` | 1131 | Schema definition (long type) |
| `docs/generated-api/abi.mdx` | 1512 | Comment: "ready for starknet_call" |

#### Type Definitions (Not Docs, But Stale)

| File | Lines | Issue |
|------|-------|-------|
| `types/abi/calldata.d.ts` | 79 | JSDoc: "ready for starknet_call" |
| `types/rpc/methods/call.d.ts` | 6 | Exports dead `starknet_call` function |
| `types/rpc/methods/index.d.ts` | 16 | Re-exports `starknet_call` |

**What it should be:**

```typescript
// OLD (DEAD)
import { starknet_call } from '@kundera-sn/kundera-ts/jsonrpc';
const result = await starknet_call(transport, request, 'latest');

// NEW (CORRECT)
import { Rpc } from '@kundera-sn/kundera-ts/jsonrpc';
const result = await provider.request(Rpc.CallRequest(request, 'latest'));
```

---

### 2. `provider.getBlockNumber()` — Method Does NOT Exist

**Status**: HttpProvider has no `getBlockNumber()` method, docs incorrectly show it

**Found in 13 locations:**

| File | Line | Context | Fix |
|------|------|---------|-----|
| `docs/index.mdx` | 23 | Effect example: `ProviderService.getBlockNumber()` | OK — Effect services have this method |
| `docs/index.mdx` | 37 | **TS example: `await provider.getBlockNumber()`** | ❌ Change to `provider.request(Rpc.BlockNumberRequest())` |
| `docs/typescript/guides/provider/providers.mdx` | 28 | States provider **doesn't** have this method ✓ | OK — correctly documents the limitation |
| `packages/kundera-ts/docs/guides/provider/providers.mdx` | 28 | Duplicate ✓ | OK |
| `docs/effect/overview.mdx` | 339 | Effect: `provider.getBlockNumber()` | OK — Effect provider has this |
| `docs/effect/guides/react-integration.mdx` | 110 | Effect example | OK |
| `docs/effect/guides/testing.mdx` | 28, 57 | Effect test examples | OK |
| `docs/guides/typescript-to-effect.mdx` | 19, 29, 100, 110, 185 | Comparison (shows TS vs Effect) | Line 19, 100: ❌ Fix TS side |
| `docs/guides/migration-from-starknetjs.mdx` | 79, 427 | Migration examples | ❌ Fix both |

**Issue breakdown:**
- **Effect examples (8 occurrences)**: CORRECT — `ProviderService` has typed methods
- **TypeScript examples (5 occurrences)**: INCORRECT — `HttpProvider` does NOT have `getBlockNumber()`

**What it should be:**

```typescript
// OLD (WRONG for HttpProvider)
const provider = new HttpProvider("https://...");
const block = await provider.getBlockNumber();

// NEW (CORRECT)
import { Rpc } from '@kundera-sn/kundera-ts/jsonrpc';
const block = await provider.request(Rpc.BlockNumberRequest());
```

---

### 3. `ContractAddress.from()` vs `ContractAddress()`

**Status**: Per CLAUDE.md line 218, should use constructor form `ContractAddress()` not `ContractAddress.from()`

**Found in 20+ locations:**

| File | Lines | Issue |
|------|-------|-------|
| `docs/typescript/primitives/contract-address.mdx` | 47, 52 | Shows `ContractAddress.from()` API |
| `docs/typescript/concepts/error-handling.mdx` | 17, 42, 70, 77, 88, 117, 138, 153 | All examples use `.from()` |
| `docs/typescript/concepts/branded-types.mdx` | 30, 42, 61, 62, 65, 90, 114 | Constructor examples + note on line 90 |
| `docs/typescript/concepts/type-safe-values.mdx` | 33, 57, 93 | Usage examples |

**Note**: Line 90 in `branded-types.mdx` says:
> "All Kundera documentation shows the **recommended API** using constructors like `ContractAddress.from()`, `ClassHash.from()`, etc."

This directly contradicts CLAUDE.md which says:
> "**Constructor preference**: Use `Felt()`, `Address()`, `ClassHash()` not `Felt.from()`, `Address.from()`, `ClassHash.from()`"

**Decision needed**: Is the constructor `ContractAddress()` or `ContractAddress.from()`? Docs say `.from()`, CLAUDE.md says bare constructor.

---

### 4. `ClassHash.from()` vs `ClassHash()`

**Status**: Same issue as ContractAddress

**Found in 20+ locations:**

| File | Lines | Issue |
|------|-------|-------|
| `docs/typescript/primitives/class-hash.mdx` | 31, 36 | Shows `ClassHash.from()` API |
| `docs/typescript/concepts/branded-types.mdx` | 31, 90 | Usage + recommendation |
| `docs/typescript/concepts/type-safe-values.mdx` | 34, 58 | Examples |
| `docs/typescript/api/primitives.mdx` | 106 | API reference signature |
| `docs/effect/primitives/contract-address.mdx` | 38, 389 | Effect examples (Effect uses `.from()`) |
| `docs/effect/primitives/index.mdx` | 36, 142, 264, 365 | Multiple Effect examples |
| `docs/effect/primitives/class-hash.mdx` | 25, 40 | Effect API |
| `docs/effect/modules/crypto.mdx` | 234, 235, 274, 319 | Crypto operations |
| `docs/getting-started/quickstart.mdx` | 85 | Quickstart example |

**Pattern observed:**
- **TypeScript docs**: Mix of `ClassHash.from()` and constructor form
- **Effect docs**: Consistently use `ClassHash.from()` (Effect primitives return Effects)

**Hypothesis**: Effect wrappers use `.from()` because validation is effectful. Pure TS uses bare constructor?

---

## Development/Internal Docs

### `development/INTEGRATION_TESTING.md`

**Line 30**: Lists RPC methods tested, includes:
> "`getBlockNumber`, `getBlockWithTxHashes`, ..."

**Context**: This is a research doc about starknet.js testing, NOT Kundera API docs. The method names refer to starknet.js provider methods, not Kundera.

**Verdict**: NOT a bug — this doc describes external library patterns.

---

## Type Definition Files (Not Docs, But Exposed)

### `types/abi/calldata.d.ts`

**Line 79**: JSDoc comment says:
> "Returns selector and calldata ready for starknet_call or execute."

Should be:
> "Returns selector and calldata ready for provider.request() or account.execute()."

### `types/rpc/methods/call.d.ts`

**Line 6**: Exports dead function:
```typescript
export declare function starknet_call(
  transport: Transport,
  request: FunctionCall,
  blockId?: BlockId
): Promise<string[]>;
```

**Status**: Type def for function that was deleted. Should be removed or marked deprecated.

### `types/rpc/methods/index.d.ts`

**Line 16**: Re-exports the dead function:
```typescript
export { starknet_call } from './call.js';
```

---

## Recommendations

### Immediate Actions (P0)

1. **Kill `starknet_call` references** in all TypeScript docs
   - Replace with `provider.request(Rpc.CallRequest(...))`
   - Update migration guides
   - Remove from API reference

2. **Fix TypeScript `getBlockNumber()` examples**
   - Line 37 in `docs/index.mdx`
   - Lines 19, 100 in `docs/guides/typescript-to-effect.mdx`
   - Lines 79, 427 in `docs/guides/migration-from-starknetjs.mdx`

3. **Remove dead type definitions**
   - Delete `types/rpc/methods/call.d.ts` (or mark `@deprecated`)
   - Remove export from `types/rpc/methods/index.d.ts`

### Clarification Needed (Discuss)

4. **Constructor naming convention**
   - CLAUDE.md says: `ContractAddress()`, `ClassHash()` (bare)
   - Docs say: `ContractAddress.from()`, `ClassHash.from()`
   - Effect uses: `.from()` (because effectful)
   
   **Question**: Is the convention different for TS vs Effect? If so, docs need section explaining this.

### Lower Priority (P1)

5. **Update JSDoc comments**
   - `types/abi/calldata.d.ts` line 79

6. **Audit generated API docs**
   - `docs/generated-api/*` files have stale content
   - May need re-generation or manual fixes

---

## Search Commands Used

```bash
# Pattern detection
tldr search "starknet_call" /Users/msaug/workspace/kundera
tldr search "getBlockNumber" /Users/msaug/workspace/kundera
tldr search "ContractAddress\.from\(" /Users/msaug/workspace/kundera
tldr search "ClassHash\.from\(" /Users/msaug/workspace/kundera

# File enumeration
find /Users/msaug/workspace/kundera/docs -name "*.mdx"
find /Users/msaug/workspace/kundera/packages/kundera-ts/docs -name "*.mdx"

# Full grep
grep -rn "starknet_call" /Users/msaug/workspace/kundera/docs --include="*.mdx"
grep -rn "\.getBlockNumber" /Users/msaug/workspace/kundera/docs --include="*.mdx"
grep -rn "ContractAddress\.from(" /Users/msaug/workspace/kundera/docs --include="*.mdx"
grep -rn "ClassHash\.from(" /Users/msaug/workspace/kundera/docs --include="*.mdx"
```

---

## Next Steps

1. Decide on constructor convention (bare vs `.from()`)
2. Update all TypeScript docs to use `provider.request(Rpc.*Request())`
3. Remove dead `starknet_call` function exports
4. Re-run `pnpm docs:generate` to refresh generated API docs
5. Add CI check to prevent `starknet_call` from appearing in docs
