# Voltaire Effect Reference: Patterns, Philosophy & Gap Analysis for Kundera Effect

> This document extracts architecture, patterns, and design decisions from **voltaire-effect** (the EVM Effect library) to guide development of **kundera-effect** (Starknet). It explains the *cause* behind each pattern so future sessions understand *why* things are built the way they are.

---

## 1. Philosophy: Why Effect for Blockchain Libraries?

**Problem:** Traditional blockchain libraries (ethers.js, starknet.js, viem) share these defects:
- Errors are `throw`/`try-catch` — untyped, invisible in function signatures
- Retries are implicit magic (`retryCount: 3` buried in config)
- State management uses module-level singletons — untestable, non-composable
- No composability — you can't override timeout for a single call without forking config

**Effect solves all of these** through:
- **Typed error channel** — every function declares what can fail in its return type
- **Explicit retry/timeout** — `Schedule` is a first-class value, not hidden config
- **Services + Layers** — dependency injection without globals, swappable for tests
- **FiberRef** — scoped configuration per-call without mutating shared state

### The Three-Layer Architecture

| Layer | Purpose | When |
|-------|---------|------|
| **Schema** | Validation, type coercion | Parsing user input, RPC responses |
| **Effect** | Composable operations | Chaining transformations, error handling |
| **Services** | Stateful resources | Provider calls, wallet signing |

### The Golden Rule: Decode -> Use -> Provide

```typescript
const program = Effect.gen(function* () {
  const addr = yield* S.decode(Address.Hex)(rawInput)     // 1. decode at boundary
  return yield* getBalance(addr, 'latest')                 // 2. use free functions
})
await Effect.runPromise(program.pipe(Effect.provide(ProviderLayer)))  // 3. provide at edge
```

---

## 2. Service Architecture

### Pattern: `Context.Tag` + Shape + `Layer.effect` + `satisfies`

Every service follows this 4-part structure:

```typescript
// 1. Shape type (contract)
export interface FooServiceShape {
  readonly doThing: (input: A) => Effect.Effect<B, FooError>;
}

// 2. Context.Tag class (identifier)
export class FooService extends Context.Tag("@app/FooService")<
  FooService,
  FooServiceShape
>() {}

// 3. Layer implementation (wiring)
export const FooLive: Layer.Layer<FooService, never, BarService> =
  Layer.effect(FooService, Effect.gen(function* () {
    const bar = yield* BarService;
    return {
      doThing: (input) => bar.request(...),
    } satisfies FooServiceShape;  // MUST use satisfies
  }));
```

**Why `satisfies` not `as`?** `satisfies` verifies the object matches the shape *without widening*. `as` would silence type errors.

**Why `Context.Tag` not `Effect.Service`?** Voltaire and kundera-effect both use `Context.Tag` for services. `Effect.Service` with `accessors: true` is a newer pattern (from the Effect Best Practices skill) that auto-generates convenience methods. Either works — the key is consistency.

### Free Functions Over Service Methods

**Cause:** Users shouldn't need to `yield* ProviderService` to call `getBlockNumber()`. That's ceremony, not value.

**Effect:** All RPC methods are top-level free functions that internally use `ProviderService`:

```typescript
// voltaire pattern (and kundera's jsonrpc/ pattern)
export const getBlockNumber = (options?: RequestOptions) =>
  Effect.flatMap(ProviderService, (provider) =>
    provider.request<bigint>('eth_blockNumber', [], options)
  );
```

**kundera-effect already does this** in `jsonrpc/index.ts` — 28 free functions that use `Rpc.*Request()` builders.

### FiberRef for Per-Request Configuration

**Cause:** Users need different timeouts/retries for different calls without modifying the service.

**Effect:** Module-level `FiberRef`s + helper functions:

```typescript
const timeoutRef = FiberRef.unsafeMake<Duration | undefined>(undefined);

export const withTimeout = (timeout: DurationInput) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.locally(effect, timeoutRef, Duration.decode(timeout));

// Usage: scoped to this call only
getBalance(addr).pipe(withTimeout("5 seconds"))
```

**kundera-effect already has this** in `TransportService.ts` (timeout, retries, retrySchedule, tracing, interceptors).

---

## 3. Schema Validation Pipeline (Trust Boundaries)

### The Critical Pattern: `S.declare` + `S.transformOrFail`

This is the **most important pattern** for converting untrusted input to validated branded types.

#### Step 1: Declare the output type guard

```typescript
// VOLTAIRE (correct)
const AddressTypeSchema = S.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: "Address" },
);
```

#### Step 2: Transform from wire format

```typescript
export const Hex: S.Schema<AddressType, string> = S.transformOrFail(
  S.String,            // from: any string
  AddressTypeSchema,   // to: validated AddressType
  {
    strict: true,
    decode: (s, _, ast) => {
      try {
        return ParseResult.succeed(Address(s));
      } catch (e) {
        return ParseResult.fail(
          new ParseResult.Type(ast, s, (e as Error).message)
        );
      }
    },
    encode: (addr) => ParseResult.succeed(Address.toHex(addr)),
  },
).annotations({
  identifier: "Address.Hex",
  title: "Ethereum Address",
  description: "A 20-byte Ethereum address as a hex string.",
  message: () => "Invalid Ethereum address",
});
```

### Gap: kundera-effect uses `Schema.Any` cast

```typescript
// KUNDERA (weak - current)
const Felt252TypeSchema = Schema.Any as Schema.Schema<Felt252Type>;
```

This tells Effect Schema "any value is a valid Felt252Type" — a type-level lie. Safe only because `transformOrFail.decode` validates via the constructor. But if someone extracts `Felt252TypeSchema` standalone, it accepts anything.

```typescript
// FIX: Replace with S.declare
const Felt252TypeSchema = S.declare<Felt252Type>(
  (u): u is Felt252Type =>
    u instanceof Uint8Array && u.length === 32,
  { identifier: "Felt252" },
);
```

### Multiple Encoding Schemas Per Primitive

Voltaire provides `Address.Hex`, `Address.Bytes`, `Address.Checksummed`. kundera-effect only has `*.Hex`.

**Recommendation:** Add `Felt252.Bytes`, `ContractAddress.Bytes` etc. for binary protocols.

---

## 4. Error Handling

### Pattern: `Data.TaggedError` with structured fields

```typescript
export class TransportError extends Data.TaggedError("TransportError")<{
  readonly input: { code: number; message: string; data?: unknown };
  readonly code: number;
  readonly message: string;
  readonly cause?: unknown;
}> {}
```

**Design principles:**
1. Every error has a unique `_tag` string
2. Every error has `message: string`
3. Most errors have `cause?: unknown` for wrapping
4. Some have `input` for the original failing value
5. No `Schema.TaggedError` — `Data.TaggedError` is lighter and sufficient for non-serialized errors

**kundera-effect does this correctly** — 6 error types, all `Data.TaggedError`, consistent structure.

### Voltaire Has Granular RPC Errors

Voltaire has per-error-code classes (`ProviderNotFoundError`, `ProviderResponseError`, `ProviderTimeoutError`). kundera-effect has a single `RpcError` with a `code` field.

**Trade-off:** Granular errors enable `Effect.catchTag("ContractNotFoundError", ...)` for specific handling. Single `RpcError` requires checking `error.code` manually. Consider splitting as the library matures.

---

## 5. Layer Composition

### The Golden Rule: Compose layers before providing

```typescript
// WRONG: multiple Effect.provide calls
program.pipe(
  Effect.provide(Signer.Live),
  Effect.provide(Provider),
  Effect.provide(HttpTransport(rpcUrl))
)

// RIGHT: compose once, provide once
const AppLayer = Layer.mergeAll(Signer.Live, Provider)
  .pipe(Layer.provide(HttpTransport(rpcUrl)))
program.pipe(Effect.provide(AppLayer))
```

**kundera-effect does this** with `WalletBaseStack` and `WalletTransactionStack` in `services/index.ts`.

---

## 6. Testing Patterns

### TestTransport (mock at transport level)

```typescript
const TestLayer = Provider.pipe(
  Layer.provide(TestTransport({
    eth_blockNumber: '0x1234',
    eth_getBalance: '0xde0b6b3a7640000'
  }))
)
```

**kundera-effect has this** — `TestTransport` + `TestProvider` in `testing/`.

### CryptoLive / CryptoTest Bundles

Voltaire bundles all crypto services into `CryptoLive` (production) and `CryptoTest` (deterministic mocks). kundera-effect doesn't have this yet.

---

## 7. What Voltaire Has That Kundera Needs

### Features We're Missing

| Feature | Priority | What Voltaire Does |
|---------|----------|-------------------|
| **Block/Event Streaming** | High | `makeBlockStream()` with `.watch()` + `.backfill()` returning `Effect.Stream`. Reorg detection. |
| **Contract Factory with .read/.write** | High | `yield* Contract(addr, abi)` returns typed instance with `.read.balanceOf()`, `.write.transfer()` |
| **Request Batching** | Medium | `HttpTransport({ batch: { batchSize: 50, wait: 10 } })` auto-batches concurrent RPC calls |
| **`readContract` free function** | Medium | `readContract({ address, abi, functionName, args })` without creating Contract instance |
| **`simulateContract`** | Medium | Validate writes before sending — returns result + prepared request |
| **Per-code RPC errors** | Low | `ContractNotFoundError`, `BlockNotFoundError` etc. for precise `catchTag` |
| **`Effect.Config` integration** | Low | `Config.string("RPC_URL")` with validation, instead of plain string params |
| **Cache layer** | Low | Response caching for immutable data (chainId, class hashes) |
| **Metrics/Observability** | Low | `Metric.counter`, structured logging with spans |

### Patterns We Already Have (Well Done)

| Pattern | Status | Notes |
|---------|--------|-------|
| Service shape: Tag + Shape + Layer + satisfies | All 8 services | Zero deviations |
| `Data.TaggedError` for errors | 6 error types | Consistent |
| `FiberRef` per-request config | TransportService | timeout, retries, interceptors |
| `Ref` for mutable state | request IDs, nonce deltas | No `let` |
| `Effect.retry` + `Schedule` | All retry/polling | No manual loops |
| Free functions (jsonrpc/) | 28 wrappers | All use `Rpc.*Request()` builders |
| `Schema.transformOrFail` | 4 primitives | Correct pattern |
| TestTransport + TestProvider | testing/ | Good mocks |
| `@effect/vitest` | All 14 test files | No raw vitest |
| Subpath exports | 7 paths | Clean |

---

## 8. Issues Found in Kundera Effect (Code Quality)

### P2 — Should Fix

| # | Issue | Location |
|---|-------|----------|
| 1 | **FallbackProvider bypasses FiberRef config** — creates raw transports, so `withTimeout`/`withRetries`/interceptors have zero effect on fallback calls | `ProviderService.ts` |
| 2 | **6 hardcoded RPC method strings** — should use `Rpc.*Request()` builders | ChainService:69, NonceManager:74/100/118, FeeEstimator:49, TransactionService:101 |
| 3 | **`Date.now()` in Effect.gen** — breaks testability with `TestClock` | TransportService:202/263/271/277 |
| 4 | **Duplicated `EstimatableTransaction` type** — identical in ContractWriteService:31 and FeeEstimatorService:15 | ContractWriteService.ts |
| 5 | **CLAUDE.md lists nonexistent services** — `SignerService` and `RawProviderService` documented but never implemented | CLAUDE.md |

### P3 — Nice to Have

| # | Issue | Location |
|---|-------|----------|
| 1 | No chainId caching (each call fetches from network) | ChainService |
| 2 | WalletProvider ignores retry/retrySchedule FiberRefs | WalletProviderService |
| 3 | `Schema.Any as Schema.Schema<T>` escape hatch | primitives/schema/*.ts |
| 4 | NonceManager `consume()` not atomic for concurrent fibers | NonceManagerService |
| 5 | `TestTransport.requestRaw` uses `Effect.dieMessage` (unrecoverable) | testing/TestTransport.ts |

---

## 9. CLI Example Review

The CLI at `examples/kundera-effect-cli/` is a solid showcase:
- Uses `Primitives.decodeContractAddress` for boundary validation
- Uses `JsonRpc.*` free functions for reads
- Uses `Services.makeContractRegistry` for ERC20 lookups
- Clean separation: commands, config, runtime, utils

### CLI Issues

| Issue | Severity | Details |
|-------|----------|---------|
| `as Effect.Effect<unknown, unknown, never>` cast | P2 | `runtime.ts:11` erases the `R` type after `Effect.provide`. If the layer is incomplete, the type error is hidden. Should let compiler verify via `Effect.runPromise`. |
| No `Effect.catchTags` in commands | P3 | Commands use `try/catch` around `Effect.runPromise` instead of Effect-native error handling. The formatError function manually inspects `_tag` fields. Should use `Effect.catchTags` or `Effect.match` in the Effect pipeline. |

---

## 10. Recommended Implementation Roadmap

### Phase 1: Fix Current Issues
1. Replace `Schema.Any` casts with `S.declare` type guards
2. Fix 6 hardcoded RPC method strings -> `Rpc.*Request()` builders
3. Fix `FallbackProvider` to respect FiberRef config
4. Remove phantom services from CLAUDE.md
5. Deduplicate `EstimatableTransaction` type

### Phase 2: Parity with Voltaire Architecture
1. Add `readContract` free function (typed contract read without Contract instance)
2. Add `Bytes` encoding schemas alongside `Hex`
3. Add `Effect.cached` for chainId in ChainService
4. Fix CLI runtime to use proper Effect error handling

### Phase 3: Advanced Features
1. Block/Event streaming with `Effect.Stream`
2. Request batching in HttpTransport
3. `simulateContract` (simulates invoke before sending)
4. CryptoLive / CryptoTest bundles (Pedersen, Poseidon, StarkCurve)
5. Per-code RPC error classes

---

## Appendix: Reference Files

Detailed analysis documents generated during this review (in `.claude/cache/`):

| File | Contents |
|------|----------|
| `voltaire-effect-patterns.md` | Complete Voltaire architecture narrative: services, schemas, errors, crypto, layers, testing |
| `voltaire-effect-examples.md` | Every example + cheatsheet from Voltaire docs, 18 sections |
| `voltaire-schema-patterns.md` | Deep dive into Schema validation pipeline, 9 patterns, side-by-side comparison |
| `kundera-effect-audit.md` | Line-by-line review of all 16 source files, 57 tests, P2/P3 issues |
