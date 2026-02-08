# kundera-effect Audit

**Date:** 2026-02-08
**All tests passing:** 14 files, 57 tests, 0 failures
**Typecheck:** Clean, 0 errors
**console.log in library src/:** None (clean)

---

## File Structure

```
packages/kundera-effect/
  package.json
  tsconfig.json
  tsconfig.build.json
  tsup.config.ts
  README.md
  docs/index.mdx
  src/
    index.ts                       # Entry: re-exports errors + namespaced modules
    errors.ts                      # 6 Data.TaggedError classes + union type
    jsonrpc/
      index.ts                     # 28 free-function RPC wrappers over ProviderService
      __tests__/index.test.ts      # 5 tests
    presets/
      index.ts                     # Network-specific Layer factories
      __tests__/index.test.ts      # 3 tests
    primitives/
      index.ts                     # Re-exports schemas + decode helpers
      types.ts                     # Input union types (Foo | string)
      decode.ts                    # Schema.decodeUnknown/decodeUnknownSync helpers
      format.ts                    # ParseError formatters
      schema/
        index.ts                   # Barrel: exports ContractAddress, StorageKey, Felt252, ClassHash
        ContractAddress.ts         # Schema.transformOrFail: string -> ContractAddressType
        StorageKey.ts              # Schema.transformOrFail: string -> StorageKeyType
        Felt252.ts                 # Schema.transformOrFail: string -> Felt252Type
        ClassHash.ts               # Schema.transformOrFail: string -> ClassHashType
      __tests__/index.test.ts      # 3 tests
    services/
      index.ts                     # Barrel re-exports + WalletBaseStack/WalletTransactionStack
      TransportService.ts          # FiberRef config, interceptors, retry, HTTP/WS layers
      ProviderService.ts           # Thin wrapper over TransportService + FallbackProvider
      ChainService.ts              # chainId, networkName, rpcUrl
      WalletProviderService.ts     # Wallet RPC methods (SNIP standards)
      ContractService.ts           # ABI-aware read calls + contract.at() factory
      ContractWriteService.ts      # Wallet-based write calls + estimateFee
      ContractRegistry.ts          # Typed multi-contract registry builder
      FeeEstimatorService.ts       # starknet_estimateFee wrapper
      NonceManagerService.ts       # Nonce tracking with Ref-based delta map
      TransactionService.ts        # sendInvoke + waitForReceipt with polling
      __tests/
        _mocks.ts                  # Shared mock factories
        TransportService.test.ts   # 9 tests
        ProviderService.test.ts    # 7 tests
        ChainService.test.ts       # 2 tests
        WalletProviderService.test.ts  # 3 tests
        ContractService.test.ts    # 3 tests
        ContractWriteService.test.ts   # 4 tests
        ContractRegistry.test.ts   # 2 tests
        FeeEstimatorService.test.ts    # 2 tests
        NonceManagerService.test.ts    # 5 tests
        TransactionService.test.ts     # 7 tests
    testing/
      index.ts                     # Barrel: TestProvider, TestTransport
      TestProvider.ts              # Composed test layer (TestTransport + ProviderLive)
      TestTransport.ts             # Canned-response transport mock
      __tests__/index.test.ts      # 2 tests
```

---

## Module-by-Module Review

### 1. errors.ts

**Pattern:** All errors use `Data.TaggedError` -- correct per CLAUDE.md rules.
**No `Schema.TaggedError` usage anywhere -- verified.**

Six error classes:
- `TransportError` -- `{ operation, message, cause? }`
- `RpcError` -- `{ method, code, message, data? }`
- `WalletError` -- `{ operation, message, cause? }`
- `TransactionError` -- `{ operation, message, txHash?, cause? }`
- `NonceError` -- `{ address, message, cause? }`
- `ContractError` -- `{ contractAddress, functionName, stage, message, cause? }`

`KunderaError` union type exports all six.

**Findings:**
- GOOD: Consistent shape across all errors. Each has `message` and `cause?`.
- GOOD: `ContractError.stage` is `"encode" | "request" | "decode"` -- useful for debugging.
- GOOD: Re-exports `StarknetRpcErrorCode` from kundera-ts for consumer type safety.
- MINOR: `RpcError.code` accepts `StarknetRpcErrorCode | number` -- the `| number` escape hatch is pragmatic since RPC nodes return arbitrary error codes.

### 2. TransportService.ts (370 lines)

**Pattern:** `Context.Tag` + `TransportServiceShape` + Layer factories. Uses `FiberRef` for fiber-local configuration.

**Findings:**
- GOOD: Full FiberRef-based configuration (timeout, retries, retryDelay, retrySchedule, tracing, interceptors) -- exactly what the CLAUDE.md prescribes.
- GOOD: `withInterceptors` composes all three interceptor types in one call.
- GOOD: `WebSocketTransportLive` uses `Layer.scoped` with `Effect.acquireRelease` -- correct resource management.
- GOOD: Request ID via `Ref.make(0)` + `Ref.updateAndGet` -- no mutable `let`.
- GOOD: `satisfies TransportServiceShape` on all return objects.

**Issues:**
- **P2 - `Date.now()` inside Effect.gen:** Lines 202, 263, 271, 277 use `Date.now()` for duration tracking. The CLAUDE.md anti-pattern table says "Use `Clock.currentTimeMillis`" instead. In practice this works but breaks testability with `TestClock`. Since it's only used for interceptor context (logging), this is low severity but inconsistent with Effect idioms.
- **P3 - Single `let` in `withInterceptors`:** Line 140 uses `let next = effect` then reassigns. This is acceptable since it's purely local pipeline composition, not shared mutable state. Idiomatic alternative: pipe chain.

### 3. ProviderService.ts (185 lines)

**Pattern:** Thin wrapper forwarding `TransportService.request`. Plus `FallbackHttpProviderLive` for multi-endpoint failover.

**Findings:**
- GOOD: `ProviderLive` is minimal -- just delegates to transport. No logic duplication.
- GOOD: `FallbackHttpProviderLive` implements smart retry: retryable RPC errors (internal, server range, timeout keywords) retry within endpoint; non-retryable RPC errors fail fast without trying next endpoint.
- GOOD: `FallbackHttpProviderFromUrls` convenience factory.
- GOOD: Uses `Effect.retry` + `Schedule.spaced` -- no manual loops.

**Issues:**
- **P2 - Bypasses TransportService for fallback:** `FallbackHttpProviderLive` creates its own `httpTransport()` instances directly and manages `createRequest`/`requestIdRef` independently, bypassing `TransportService`. This means FiberRef-based configuration (withTimeout, withRetries, withTracing, interceptors) does NOT apply to fallback provider requests. This is a significant architectural gap -- a user who sets `withTimeout("5 seconds")` will get no timeout on fallback provider calls.
- **P3 - Dual import of error types:** Line 8 imports `RpcError` and `TransportError` as type-only, then line 19 re-imports them as value (renamed to `RpcErrorData` / `TransportErrorData`). This is correct but awkward -- could use a single value import for both.

### 4. ChainService.ts (87 lines)

**Pattern:** Standard service pattern.

**Findings:**
- GOOD: Chain ID detection with known mainnet/sepolia/integration hex values.
- GOOD: Devnet inference from localhost-like URLs.
- **P2 - Hardcoded RPC method string:** Line 69 uses `provider.request("starknet_chainId", ...)` instead of `Rpc.ChainIdRequest()`. The CLAUDE.md anti-pattern list says "DO NOT hardcode RPC method strings -- use `Rpc.*Request()` builders." Same applies to NonceManagerService, FeeEstimatorService, TransactionService.
- **P3 - No caching of chainId:** Each call to `chainId()` or `networkName()` makes a fresh RPC request. For a value that never changes per network, this could use `Effect.cached` or `Effect.cachedWithTTL`.

### 5. WalletProviderService.ts (218 lines)

**Pattern:** Standard service pattern wrapping `walletTransport` from kundera-ts.

**Findings:**
- GOOD: Full coverage of SNIP wallet methods (12 methods).
- GOOD: `normalizeRequestAccounts` handles legacy `silentMode` -> `silent_mode` mapping.
- GOOD: All methods properly typed with specific return types.
- GOOD: Request ID via `Ref`.

**Issues:**
- **P3 - No retry/timeout support:** Unlike `TransportService`, the wallet provider does not read FiberRef config. `withTimeout`/`withRetries` has no effect on wallet calls. The `options?: RequestOptions` parameter is accepted but only `timeoutMs` is used (passed to transport), while `retries`/`retrySchedule` are ignored.

### 6. ContractService.ts (186 lines)

**Pattern:** Standard service pattern. ABI-aware read calls with `compileCalldata`/`decodeOutput` from kundera-ts.

**Findings:**
- GOOD: Uses `Rpc.CallRequest()` builder (the only service that does).
- GOOD: `Contract()` free function for ergonomic access.
- GOOD: `at()` factory creates bound `ContractInstance` with `read()` and `readRaw()`.
- GOOD: Proper error staging: `"encode"` for calldata compilation, `"decode"` for output parsing.
- GOOD: `parseResponseItem` validates each felt string from the response.

### 7. ContractWriteService.ts (200 lines)

**Pattern:** Standard service pattern. Depends on `TransactionService` + `FeeEstimatorService`.

**Findings:**
- GOOD: `toWalletInvokeParams` helper cleanly separates ABI encoding from wallet invocation.
- GOOD: Both `invoke` and `invokeAndWait` variants.
- GOOD: `invokeContract` / `invokeContractAndWait` for ABI-typed calls.

**Issues:**
- **P2 - Duplicated `EstimatableTransaction` type:** Defined at line 31 as a local private `type`, identical to `FeeEstimatorService.ts` line 15 which exports it. The ContractWriteService should import from FeeEstimatorService instead of redeclaring. The barrel `services/index.ts` exports it from FeeEstimatorService (line 75), so the public API is fine, but the internal duplication is unnecessary.

### 8. ContractRegistry.ts (49 lines)

**Pattern:** Not a `Context.Tag` service -- intentionally an Effect-returning function (documented in comment). Uses `ContractService` dependency.

**Findings:**
- GOOD: Clean generic type inference with `InferContractRegistry<TConfig>`.
- GOOD: Comment explains why it's not a Context.Tag (generic per call site).
- GOOD: `satisfies` not applicable here (plain object return), but the mapped type is correct.

### 9. FeeEstimatorService.ts (62 lines)

**Pattern:** Standard service pattern.

**Findings:**
- GOOD: Minimal, focused. Just wraps `starknet_estimateFee`.
- **P2 - Hardcoded RPC method string:** Line 49 uses `"starknet_estimateFee"` instead of `Rpc.EstimateFeeRequest()`.

### 10. NonceManagerService.ts (156 lines)

**Pattern:** Standard service pattern with `Ref`-based delta tracking.

**Findings:**
- GOOD: Smart nonce management: on-chain nonce + local delta. `consume` auto-increments, `reset` clears.
- GOOD: Per-chain, per-address keying with `toNonceKey`.
- GOOD: `parseNonce` validates hex nonce from provider.

**Issues:**
- **P2 - Hardcoded RPC method strings:** Lines 74, 100, 118 use raw `"starknet_chainId"` and `"starknet_getNonce"` strings.
- **P3 - No concurrency protection on consume:** If two fibers call `consume()` concurrently for the same address, both read the same delta from the Ref, both increment by 1, and they get the same nonce. The `Ref.get` + `Ref.update` are not atomic as a unit. Would need `Ref.modify` or a semaphore for true concurrent safety.

### 11. TransactionService.ts (163 lines)

**Pattern:** Standard service pattern. Depends on `ProviderService` + `WalletProviderService`.

**Findings:**
- GOOD: `isReceiptPending` has both code-based and message-based detection for pending receipts.
- GOOD: Uses `Effect.retry` + `Schedule.recurs` + `Schedule.addDelay` + `Schedule.whileInput` -- exactly the Effect-native polling pattern prescribed in CLAUDE.md.
- GOOD: Converts exhausted polling to `TransactionError` with attempt count.
- GOOD: Non-pending RPC errors are re-thrown immediately (no unnecessary retries).

**Issues:**
- **P2 - Hardcoded RPC method string:** Line 101 uses `"starknet_getTransactionReceipt"`.

### 12. services/index.ts (166 lines)

**Pattern:** Barrel re-exports + stack presets.

**Findings:**
- GOOD: Clean barrel with explicit named exports from each service file.
- GOOD: `WalletBaseStack` and `WalletTransactionStack` compose layers correctly.
- GOOD: Stack return types explicitly list all provided services.

**Issues:**
- **P3 - Verbose inline `import()` types in stack return signatures:** Lines 120-126, 150-157 use `import("./ProviderService.js").ProviderService` instead of regular imports. This is probably to avoid circular deps at the barrel level. Functional but ugly.

### 13. jsonrpc/index.ts (340 lines)

**Pattern:** Free functions that use `Rpc.*Request()` builders and delegate to `ProviderService`.

**Findings:**
- GOOD: All 28 wrappers use `Rpc.*Request()` builders -- consistent and correct.
- GOOD: Branded type inputs (Felt252Type, ContractAddressType, etc.) ensure type safety at the boundary.
- GOOD: All return `Effect.Effect<T, TransportError | RpcError, ProviderService>`.
- GOOD: Comment at end explains subscription methods are deferred to `Effect.Stream`.
- GOOD: `getStorageProof` has clean hex mapping for branded types.

### 14. primitives/ (schemas + decode + format)

**Pattern:** `Schema.transformOrFail` with kundera-ts constructors as validators.

**Findings:**
- GOOD: All 4 schemas (Felt252, ContractAddress, ClassHash, StorageKey) follow identical pattern.
- GOOD: Bidirectional: `decode` (string -> branded type) and `encode` (branded type -> hex string).
- GOOD: Proper `annotations` with identifier, title, description, message.
- GOOD: `decode.ts` exports both async (`decodeUnknown`) and sync (`decodeUnknownSync`) variants.
- GOOD: `format.ts` exports both tree and array formatters for ParseError.

**Issues:**
- **P3 - `Schema.Any as Schema.Schema<Felt252Type>` escape hatch:** Each schema file (e.g., Felt252.ts line 5) creates the target schema with `Schema.Any as Schema.Schema<Felt252Type>`. This is a type-level lie -- it tells Effect Schema that "any value is a valid Felt252Type" which is only safe because the `transformOrFail` decode function actually validates via the kundera-ts constructor. If someone extracted just the `Felt252TypeSchema` and used it standalone, it would accept anything. The cast is documented implicitly by context but not by comment.
- **P3 - Unused `types.ts` input types:** `ContractAddressInput`, `StorageKeyInput`, etc. are exported but never used within kundera-effect itself. They may be useful for consumers but are dead exports within the package.

### 15. presets/index.ts (66 lines)

**Pattern:** Convenience factories for common Layer compositions.

**Findings:**
- GOOD: Three networks (Mainnet, Sepolia, Devnet) with sensible default URLs.
- GOOD: Both read-only (`MainnetProvider`) and full wallet stacks (`MainnetWalletStack`).
- GOOD: `toWalletStackOptions` DRYs the options mapping.

### 16. testing/ (TestTransport + TestProvider)

**Pattern:** Canned-response mocks for tests.

**Findings:**
- GOOD: `TestTransport` returns `RpcError` for unmocked methods -- tests fail clearly.
- GOOD: `TestProvider` composes `TestTransport` + `ProviderLive` -- matches production wiring.
- GOOD: Supports error injection via `TransportError` or `RpcError` instances as mock values.

**Issues:**
- **P3 - `requestRaw` dies:** TestTransport's `requestRaw` calls `Effect.dieMessage`. This is a defect (unrecoverable) rather than a typed error. If any code path accidentally uses `requestRaw` in tests, it will crash with an unhelpful message instead of a test failure.

---

## CLAUDE.md vs Reality

### Documented but Missing Services

The CLAUDE.md architecture section lists:
- `SignerService` -- **does not exist**. No file, no reference anywhere.
- `RawProviderService` -- **does not exist**. No file, no reference anywhere.

These are documented in the architecture diagram but were never implemented.

### Documented Anti-Patterns Found

| Anti-Pattern | Location | Status |
|---|---|---|
| Hardcoded RPC method strings | ChainService, NonceManager, FeeEstimator, TransactionService | **FOUND** - 6 instances |
| `Date.now()` inside Effect.gen | TransportService (4 instances) | **FOUND** |
| `let` for shared state | TransportService (1 instance, local-only) | MINOR |
| Schema.TaggedError | Nowhere | CLEAN |
| console.* in library code | Nowhere | CLEAN |
| Manual retry loops | Nowhere | CLEAN -- all use Effect.retry |

---

## Issues Summary

### P1 - Critical

None found. The package is clean and functional.

### P2 - Should Fix

| # | Issue | Location | Description |
|---|---|---|---|
| 1 | FallbackProvider bypasses FiberRef config | `ProviderService.ts` | `FallbackHttpProviderLive` creates raw transports, ignoring `withTimeout`/`withRetries`/interceptors. Users expect fiber-local config to work uniformly. |
| 2 | Hardcoded RPC method strings | ChainService:69, NonceManager:74/100/118, FeeEstimator:49, TransactionService:101 | Should use `Rpc.*Request()` builders per CLAUDE.md rules. 6 occurrences across 4 files. |
| 3 | `Date.now()` instead of `Clock` | TransportService:202/263/271/277 | Breaks testability with `TestClock`. Should use `Clock.currentTimeMillis` or `Effect.clockWith`. |
| 4 | Duplicated `EstimatableTransaction` type | ContractWriteService:31 vs FeeEstimatorService:15 | Identical type defined in two files. ContractWriteService should import from FeeEstimatorService. |
| 5 | CLAUDE.md lists nonexistent services | CLAUDE.md architecture | `SignerService` and `RawProviderService` are documented but don't exist. Doc is misleading. |

### P3 - Nice to Have

| # | Issue | Location | Description |
|---|---|---|---|
| 1 | No chainId caching | ChainService | Each call fetches chain ID from network. Could use `Effect.cached`. |
| 2 | WalletProvider ignores retry FiberRefs | WalletProviderService | `RequestOptions.retries`/`retrySchedule` accepted but not applied. |
| 3 | `Schema.Any` cast for branded types | primitives/schema/*.ts | `Schema.Any as Schema.Schema<Felt252Type>` is a type-level lie, safe only because transform validates. |
| 4 | NonceManager consume not atomic | NonceManagerService | Concurrent `consume()` calls can return duplicate nonces. Needs `Ref.modify` or semaphore. |
| 5 | Unused `types.ts` input types | primitives/types.ts | `ContractAddressInput` etc. exported but never consumed internally. |
| 6 | TestTransport.requestRaw dies | testing/TestTransport.ts | Uses `Effect.dieMessage` (unrecoverable) instead of typed error. |
| 7 | tsup external missing `@kundera-sn/kundera-ts/abi` | tsup.config.ts | `@kundera-sn/kundera-ts/abi` is imported by 3 service files but not listed in tsup externals. May get bundled. |

---

## Patterns Assessment

### Good Patterns (Consistent Throughout)

1. **Service definition:** All 8 services follow `Context.Tag` + `*Shape` + `Layer.effect` + `satisfies`. Zero deviations.
2. **Error handling:** All errors are `Data.TaggedError`. No `Schema.TaggedError`, no `throw`, no `console.error`.
3. **Retry/polling:** `Effect.retry` + `Schedule` used everywhere. No manual loops.
4. **State management:** `Ref` for request IDs and nonce deltas. `FiberRef` for fiber-local config. No `let` for shared state.
5. **Testing:** All 14 test files use `@effect/vitest` with `it.effect`. Shared mocks in `_mocks.ts`. No raw vitest.
6. **Layer composition:** `Layer.merge`, `Layer.provide`, `Layer.scoped` used correctly. Stack presets compose cleanly.
7. **kundera-ts integration:** All crypto, ABI, transport, and primitive types come from kundera-ts. No reimplementation.
8. **Package exports:** 7 subpath exports matching the directory structure. `typesVersions` fallback for older TS.
9. **Tree-shaking:** `"sideEffects": false`, tsup with `treeshake: true`.
10. **Trust boundaries:** `as T` casts documented with comments explaining the trust boundary (3 locations).

### Missing Functionality (vs. Complete Effect Library)

| Feature | Status | Notes |
|---|---|---|
| WebSocket subscriptions (Effect.Stream) | Deferred | Comment in jsonrpc/index.ts acknowledges this |
| SignerService | Missing | Documented in CLAUDE.md but not implemented |
| RawProviderService | Missing | Documented in CLAUDE.md but not implemented |
| Account abstraction | Missing | No account service for managing keys/deployment |
| Multicall batching | Missing | No batch call helper |
| Event streaming/filtering | Missing | Only `getEvents` snapshot, no live stream |
| Cache layer | Missing | No response caching (chain ID, class hashes) |
| Metrics/observability | Partial | Tracing via FiberRef exists but no metrics counters |
| Effect.Config integration | Missing | URLs and options passed as plain values, not Config |

---

## Test Coverage Assessment

| Module | Test File | Tests | Coverage Quality |
|---|---|---|---|
| TransportService | 9 | Retries, interceptors, timeout, close, FiberRef overrides | **Strong** |
| ProviderService | 7 | Fallback, retry timing, unique IDs, non-retryable fast-fail | **Strong** |
| ChainService | 2 | Known network + devnet inference | Adequate |
| WalletProviderService | 3 | Accounts, silentMode mapping, invoke | Adequate |
| ContractService | 3 | Encode+decode, at() factory, missing function error | Adequate |
| ContractWriteService | 4 | invokeContract, invokeAndWait, estimateFee, missing function | **Strong** |
| ContractRegistry | 2 | Build registry, verify address delegation | Adequate |
| FeeEstimatorService | 2 | Default options, custom flags+blockId | Adequate |
| NonceManagerService | 5 | Consume increment, reset, fresh after reset, skip chainId | **Strong** |
| TransactionService | 7 | Retry polling, Felt252 hash, exhaustion, non-pending error, timing, error propagation | **Strong** |
| jsonrpc wrappers | 5 | blockNumber, receipt params, nonce params, block+index, storageProof | Adequate |
| primitives | 3 | Decode contract address, invalid address error, decode felt | Light |
| presets | 3 | createProvider, wallet base stack, wallet full stack | **Strong** |
| testing utils | 2 | Canned response, missing method error | Light |

**Total: 57 tests across 14 files.**

Missing test coverage:
- No test for `WebSocketTransportLive` or `WebSocketProviderLive`
- No test for `withTracing` producing log output
- No test for `withErrorInterceptor` combined with retries
- No test for concurrent `NonceManagerService.consume` race condition
- No test for `estimateFee` via jsonrpc wrappers (only tested via services)
- Schema encode direction (branded type -> hex string) not tested
- `decodeUnknownSync` variants not tested
- `formatParseErrorArray` not tested

---

## CLI Example Assessment

The CLI at `examples/kundera-effect-cli/` is a good showcase:
- Uses `Primitives.decodeContractAddress` for input validation at boundaries
- Uses `JsonRpc.*` free functions for read operations
- Uses `Services.makeContractRegistry` for ERC20 balance lookups
- Proper Effect error handling with `formatError` utility
- Clean separation: commands, config, runtime, utils

**Issues in CLI (example code, lower severity):**
- `console.log` used throughout (acceptable in CLI application code, not library)
- `runtime.ts` line 11 uses `as Effect.Effect<unknown, unknown, never>` cast to erase the `R` type after `Effect.provide`. This is a red flag -- if the layer doesn't satisfy all requirements, this hides the type error. Better: use `Effect.runPromise` which requires `never` and let the compiler verify.
- `config.ts` line 35: `ERC20_ABI` uses `as const` assertion on a partial ABI (only `balanceOf`). This is fine for the example but would fail on any other ERC20 method.
