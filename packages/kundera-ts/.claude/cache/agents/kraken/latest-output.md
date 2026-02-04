# Implementation Report: Refactor Crypto Functions to withCrypto Pattern
Generated: 2025-02-04

## Task
Refactor remaining crypto functions in `hash.ts` and `index.ts` to use the `withCrypto` higher-order function pattern for cleaner native/wasm fallback handling.

## Summary

Successfully refactored 20 crypto functions across 2 files to use the `withCrypto` helper pattern, following the same approach already used in `arithmetic.ts` and `ecdsa.ts`.

## Files Changed

### 1. `src/crypto/hash.ts`
**Before:** 63 lines
**After:** 48 lines
**Reduction:** 15 lines (24%)

Refactored functions:
- `pedersenHash` - Pedersen hash of two felts
- `poseidonHash` - Poseidon hash of two felts
- `poseidonHashMany` - Poseidon hash of multiple felts
- `snKeccak` - Kept as wrapper function (needs string-to-bytes preprocessing), delegates to internal `snKeccakBytes` using `withCrypto`

**Key change:** Import changed from `./state.js` to `./helpers.js`

### 2. `src/crypto/index.ts`
**Before:** 458 lines
**After:** 397 lines
**Reduction:** 61 lines (13%)

Refactored functions (16 total):

**Hash functions:**
- `pedersenHash`
- `poseidonHash`
- `poseidonHashMany`
- `snKeccak` (with internal `snKeccakBytes` helper)

**Felt arithmetic:**
- `feltAdd`, `feltSub`, `feltMul`, `feltDiv`
- `feltNeg`, `feltInverse`, `feltPow`, `feltSqrt`

**ECDSA:**
- `sign`, `verify`, `getPublicKey`, `recover`

**Note:** Created a local `withCrypto` helper function that uses the module's local `getNative()`/`getWasm()` functions (which access the global singleton state). This was necessary because `index.ts` has its own state management.

## Pattern Applied

Before:
```typescript
export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.pedersenHash(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmPedersenHash(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}
```

After:
```typescript
export const pedersenHash = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => Felt252(n.pedersenHash(a, b)),
  wasm: (w, a, b) => Felt252(w.wasmPedersenHash(a, b)),
});
```

## Total Line Reduction

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| hash.ts | 63 | 48 | 15 (24%) |
| index.ts | 458 | 397 | 61 (13%) |
| **Total** | **521** | **445** | **76 (15%)** |

## Test Results

```
 505 pass
 0 fail
 904 expect() calls
Ran 505 tests across 44 files. [12.95s]
```

All tests pass, confirming the refactoring maintains backward compatibility.

## Benefits of Refactoring

1. **Consistency** - All crypto modules now use the same `withCrypto` pattern
2. **Less boilerplate** - Each function reduced from ~8 lines to ~4 lines
3. **Centralized error handling** - Error message defined once in `helpers.ts`
4. **Easier maintenance** - Adding new backend or changing fallback logic requires only one change
5. **Type safety** - Generic types ensure correct argument passing

## Notes

- The `snKeccak` function retained its wrapper form because it requires string-to-bytes preprocessing before the crypto call
- The `index.ts` file defines its own local `withCrypto` instead of importing from `helpers.js` because it uses a different state management approach (local `getNative()`/`getWasm()` with global singleton)
