# Implementation Report: kundera-effect Services Audit (6 core services)
Generated: 2026-02-08T12:00:00Z

## Task
Audit and fix 6 service files in `packages/kundera-effect/src/services/` for Effect-TS best practices compliance:
- NonceManagerService.ts
- TransactionService.ts
- WalletProviderService.ts
- ContractWriteService.ts
- FeeEstimatorService.ts
- ContractRegistry.ts

## Audit Results (Per-File)

### NonceManagerService.ts
| Check | Result |
|-------|--------|
| No console.log/warn/error | PASS |
| No `let` for shared mutable state | PASS |
| No manual retry loops | PASS (N/A) |
| No Date.now() inside Effect.gen | PASS |
| No hardcoded RPC method strings | PASS -- uses `Rpc.ChainIdRequest()`, `Rpc.GetNonceRequest()` |
| All errors use Data.TaggedError | PASS -- `NonceError` |
| Layer uses `satisfies *Shape` | PASS -- `satisfies NonceManagerServiceShape` |
| All functions use Effect.gen/flatMap | PASS |
| No undocumented `as T` casts | PASS -- no casts |
| No unused imports/dead code | PASS |
| **Race condition in consume()** | **FIXED** -- `Ref.get` + `Ref.update` replaced with atomic `Ref.modify` |
| **Race condition in increment()** | **FIXED** -- `getDelta` + `setDelta` replaced with single `Ref.update` |

### TransactionService.ts
| Check | Result |
|-------|--------|
| No console.log/warn/error | PASS |
| No `let` for shared mutable state | PASS |
| No manual retry loops | PASS -- uses `Effect.retry` + `Schedule` |
| No Date.now() inside Effect.gen | PASS |
| No hardcoded RPC method strings | PASS -- uses `Rpc.GetTransactionReceiptRequest()` |
| All errors use Data.TaggedError | PASS -- `TransactionError`, `RpcError`, `WalletError` |
| Layer uses `satisfies *Shape` | PASS -- `satisfies TransactionServiceShape` |
| All functions use Effect.gen/flatMap | PASS |
| No undocumented `as T` casts | PASS |
| No unused imports/dead code | PASS |

### WalletProviderService.ts
| Check | Result |
|-------|--------|
| No console.log/warn/error | PASS |
| No `let` for shared mutable state | PASS |
| No manual retry loops | PASS |
| No Date.now() inside Effect.gen | PASS |
| No hardcoded RPC method strings | N/A -- wallet methods are SNIP standard strings, not Starknet RPC |
| All errors use Data.TaggedError | PASS -- `WalletError`, `RpcError` |
| Layer uses `satisfies *Shape` | PASS -- `satisfies WalletProviderServiceShape` |
| All functions use Effect.gen/flatMap | PASS |
| `as T` cast on line 146 | PASS -- documented trust boundary (lines 144-145) |
| No unused imports/dead code | PASS |
| **Retry FiberRefs not applied** | **DOCUMENTED** -- added JSDoc explaining the limitation |

### ContractWriteService.ts
| Check | Result |
|-------|--------|
| No console.log/warn/error | PASS |
| No `let` for shared mutable state | PASS |
| No manual retry loops | PASS |
| No Date.now() inside Effect.gen | PASS |
| No hardcoded RPC method strings | PASS -- delegates to FeeEstimatorService/TransactionService |
| All errors use Data.TaggedError | PASS -- `ContractError` |
| Layer uses `satisfies *Shape` | PASS -- `satisfies ContractWriteServiceShape` |
| All functions use Effect.gen/flatMap | PASS |
| EstimatableTransaction imported from FeeEstimatorService | PASS -- line 24 |
| No unused imports/dead code | PASS |

### FeeEstimatorService.ts
| Check | Result |
|-------|--------|
| No console.log/warn/error | PASS |
| No `let` for shared mutable state | PASS |
| No manual retry loops | PASS |
| No Date.now() inside Effect.gen | PASS |
| No hardcoded RPC method strings | PASS -- uses `Rpc.EstimateFeeRequest()` |
| All errors use Data.TaggedError | PASS (type-only imports) |
| Layer uses `satisfies *Shape` | PASS -- `satisfies FeeEstimatorServiceShape` |
| All functions use Effect.gen/flatMap | PASS |
| No undocumented `as T` casts | PASS |
| No unused imports/dead code | PASS |

### ContractRegistry.ts
| Check | Result |
|-------|--------|
| No console.log/warn/error | PASS |
| No `let` for shared mutable state | PASS |
| No manual retry loops | PASS (N/A) |
| No Date.now() inside Effect.gen | PASS (N/A) |
| No hardcoded RPC method strings | PASS (N/A) |
| Not a Context.Tag (intentional) | PASS -- documented in JSDoc |
| All `as` casts documented | PASS -- comments on lines 33, 40-41, 45 |
| No unused imports/dead code | PASS |

## Changes Made

### 1. NonceManagerService.ts -- Atomic nonce operations

**File:** `/Users/msaug/workspace/kundera/packages/kundera-effect/src/services/NonceManagerService.ts`

`consume()` had a race condition: `Ref.get(deltasRef)` followed by `Ref.update(deltasRef, ...)` are two separate operations. If two fibers call `consume()` concurrently for the same address, both read the same delta and both increment by 1, producing duplicate nonces.

Fixed by replacing with `Ref.modify` which atomically reads and updates in a single operation:

```typescript
// Before (non-atomic):
const delta = yield* getDelta(key);
const nonce = onChainNonce + delta;
yield* setDelta(key, delta + 1n);

// After (atomic):
const delta = yield* Ref.modify(deltasRef, (deltas) => {
  const currentDelta = deltas.get(key) ?? 0n;
  const next = new Map(deltas);
  next.set(key, currentDelta + 1n);
  return [currentDelta, next] as const;
});
return onChainNonce + delta;
```

Same fix applied to `increment()` -- replaced `getDelta` + `setDelta` with a single `Ref.update`:

```typescript
// Before (non-atomic):
const delta = yield* getDelta(key);
yield* setDelta(key, delta + 1n);

// After (atomic):
return Ref.update(deltasRef, (deltas) => {
  const currentDelta = deltas.get(key) ?? 0n;
  const next = new Map(deltas);
  next.set(key, currentDelta + 1n);
  return next;
});
```

### 2. WalletProviderService.ts -- Document retry limitation

**File:** `/Users/msaug/workspace/kundera/packages/kundera-effect/src/services/WalletProviderService.ts`

Added JSDoc to `makeWalletProviderService` documenting that retry FiberRefs (`withRetries`, `withRetrySchedule`) have no effect on wallet calls. Only `RequestOptions.timeoutMs` is forwarded.

## Test Results
- Total: 63 tests across 14 files
- Passed: 63
- Failed: 0
- Type errors: 0

## Notes
- All 6 files already complied with the majority of best practices checks. Prior work (Rpc.*Request() migration, EstimatableTransaction dedup) was already complete.
- The `getDelta` and `setDelta` helpers remain because `get` (read-only) still uses `getDelta` and `reset` still uses `setDelta`. These are fine as non-atomic standalone operations.
- No architecture changes made. Context.Tag + satisfies pattern is consistent across all services.
