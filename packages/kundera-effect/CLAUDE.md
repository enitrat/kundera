# kundera-effect

Effect-TS integration for Starknet via kundera-ts. Thin Effect wrappers over kundera-ts primitives -- no reimplementation.

## Philosophy

### kundera-ts is the source of truth

kundera-effect wraps kundera-ts. It does NOT reimplement crypto, ABI encoding, transport, or RPC logic. If kundera-ts provides a function, use it. If kundera-ts provides a type, import it. Never duplicate.

Specifically:
- **Wire types** come from `@kundera-sn/kundera-ts/jsonrpc` (BlockWithTxs, FeeEstimate, etc.)
- **Primitives** come from `@kundera-sn/kundera-ts` (Felt252Type, ContractAddressType, etc.)
- **Transport** comes from `@kundera-sn/kundera-ts/transport` (httpTransport, webSocketTransport)
- **RPC request builders** come from `@kundera-sn/kundera-ts/jsonrpc` (Rpc.CallRequest, etc.)
- **ABI encoding** comes from `@kundera-sn/kundera-ts/abi`

### Effect-native, not Effect-wrapped

Don't just slap `Effect.tryPromise` around imperative code. Use Effect's vocabulary:

| Instead of | Use |
|---|---|
| Manual retry loops | `Effect.retry` + `Schedule` |
| `for` + `continue`/`break` | `Effect.firstSuccessOf`, `Effect.forEach` |
| Mutable `let` state | `Ref`, `FiberRef` |
| `Date.now()` inside Effect.gen | `Clock.currentTimeMillis` |
| `try/catch` | `Effect.tryPromise`, `Effect.catchTag` |
| Raw `Promise.race` | `Effect.timeout` |
| Manual polling | `Effect.retry` with `Schedule.spaced` |
| Callback-based APIs | `Effect.async` |

### Voltaire is the reference implementation

This library follows the same architecture as `voltaire-effect` (Ethereum Effect library). When unsure about a pattern, check how Voltaire does it. Key alignment points:

- Services are `Context.Tag` + `*Shape` type + `Layer.effect` make function
- Errors are `Data.TaggedError` with `{ input, message, cause?, context? }`
- Operations are free functions that depend on services via Effect's type system
- Testing uses `@effect/vitest` with `TestTransport` utilities
- Presets compose layers for common configurations
- `FiberRef` for fiber-local configuration (timeout, retries, interceptors)

---

## Architecture

```
src/
  errors.ts          # All error types (Data.TaggedError)
  index.ts           # Entry point (namespaced re-exports)
  jsonrpc/           # Free-function RPC wrappers over ProviderService
    index.ts         # One function per RPC method
    __tests__/
  presets/            # Layer composition presets (Mainnet, Sepolia, etc.)
    index.ts
    __tests__/
  services/           # Context.Tag services with Layer implementations
    TransportService.ts
    ProviderService.ts
    ChainService.ts
    WalletProviderService.ts
    ContractService.ts
    ContractWriteService.ts
    ContractRegistry.ts
    FeeEstimatorService.ts
    NonceManagerService.ts
    TransactionService.ts
    SignerService.ts
    RawProviderService.ts
    index.ts          # Barrel + stack presets
    __tests__/
```

### Layer Dependency Graph

```
TransportService (HTTP/WS connection)
  └─ ProviderService (JSON-RPC request/response)
       ├─ ChainService (chain ID, network name)
       ├─ FeeEstimatorService (fee estimation)
       ├─ NonceManagerService (nonce tracking)
       ├─ ContractService (read calls, ABI encoding)
       └─ RawProviderService (untyped passthrough)

WalletProviderService (browser wallet via SNIP standards)
  └─ TransactionService (send + wait for receipt)
       ├─ ContractWriteService (write calls via wallet)
       └─ SignerService (facade over wallet + tx)
```

---

## Enforced Patterns

### Service Definition

Every service MUST follow this structure:

```typescript
// 1. Shape type (always exported)
export interface FooServiceShape {
  readonly doThing: (input: A) => Effect.Effect<B, FooError>;
}

// 2. Context.Tag class
export class FooService extends Context.Tag("@kundera/FooService")<
  FooService,
  FooServiceShape
>() {}

// 3. Layer implementation
export const FooLive: Layer.Layer<FooService, never, BarService> =
  Layer.effect(
    FooService,
    Effect.gen(function* () {
      const bar = yield* BarService;
      return {
        doThing: (input) => bar.request(...),
      } satisfies FooServiceShape;  // MUST use satisfies
    }),
  );
```

**Naming conventions:**
- Tag class: `FooService` (always suffixed)
- Shape type: `FooServiceShape`
- Layer: `FooLive` (no "Service" suffix)
- Tag string: `"@kundera/FooService"`

### Error Definition

All errors MUST use `Data.TaggedError`:

```typescript
export class FooError extends Data.TaggedError("FooError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
```

**Rules:**
- Unique `_tag` string matching class name
- Always include `message: string`
- Optional `cause?: unknown` for underlying errors
- NO `Schema.TaggedError` (use Data.TaggedError for lightweight errors)
- NO custom constructors unless absolutely necessary

### JSONRPC Wrappers

Each RPC method wrapper MUST:
1. Import and use `Rpc.*Request()` builders from kundera-ts
2. Return `Effect.Effect<T, TransportError | RpcError, ProviderService>`
3. Accept optional `RequestOptions` as last parameter

```typescript
import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";

export const call = <T = string[]>(
  payload: FunctionCall,
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<T, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.CallRequest(payload, blockId);
  return request(method, params, options);
};
```

### Retry and Polling

NEVER use manual loops for retry/polling. Use Effect.retry + Schedule:

```typescript
// Retry with backoff
Effect.retry(
  Schedule.exponential("100 millis").pipe(
    Schedule.intersect(Schedule.recurs(3))
  )
)

// Polling with fixed interval
Effect.retry(
  Schedule.spaced("2 seconds").pipe(
    Schedule.whileInput((error: RpcError) => isReceiptPending(error)),
    Schedule.intersect(Schedule.recurs(maxAttempts))
  )
)

// Fallback across endpoints
Effect.firstSuccessOf(
  endpoints.map((url) => makeRequest(url).pipe(Effect.retry(retrySchedule)))
)
```

### Mutable State

NEVER use `let` inside or outside Effect.gen for shared state. Use:

```typescript
// For counter/accumulator
const ref = yield* Ref.make(0);
const next = yield* Ref.updateAndGet(ref, (n) => n + 1);

// For fiber-local config
const timeoutRef = FiberRef.unsafeMake<number | undefined>(undefined);
export const withTimeout = (ms: number) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.locally(effect, timeoutRef, ms);
```

### Testing

Tests MUST use `@effect/vitest`:

```typescript
import { describe, expect, it } from "@effect/vitest";

describe("FooService", () => {
  it.effect("does thing", () =>
    Effect.gen(function* () {
      const result = yield* fooService.doThing(input);
      expect(result).toBe(expected);
    }).pipe(Effect.provide(testLayer))
  );
});
```

**Mock pattern:**
```typescript
const TestFoo = (overrides?: Partial<FooServiceShape>) =>
  Layer.succeed(FooService, {
    doThing: () => Effect.succeed(defaultValue),
    ...overrides,
  });
```

Shared mocks go in `__tests__/_mocks.ts`.

### Layer Composition

```typescript
// Merge independent layers
Layer.mergeAll(layerA, layerB, layerC)

// Provide dependency
LayerThatNeedsFoo.pipe(Layer.provide(FooLive))

// Static config
Layer.succeed(ChainService, { chainId: "0x534e5f4d41494e" })

// Scoped resources (WebSocket)
Layer.scoped(Tag, Effect.acquireRelease(acquire, release))

// Preset factory
export const MainnetProvider = (url?: string) =>
  ProviderLive.pipe(
    Layer.provide(HttpTransportLive(url ?? DEFAULT_MAINNET_URL))
  );
```

---

## Build

```bash
pnpm build              # Build via tsup
pnpm test:run           # Run tests (vitest)
pnpm typecheck          # Type checking
```

### tsup config

Entry points: `src/index.ts`, `src/errors.ts`, `src/services/index.ts`, `src/jsonrpc/index.ts`, `src/presets/index.ts`

External: `effect`, `@kundera-sn/kundera-ts`, `@kundera-sn/kundera-ts/*`

---

## Package Exports

```
@kundera-sn/kundera-effect          # Main entry (namespaced)
@kundera-sn/kundera-effect/errors   # Error types
@kundera-sn/kundera-effect/services # All services + stack presets
@kundera-sn/kundera-effect/jsonrpc  # Free-function RPC wrappers
@kundera-sn/kundera-effect/presets  # Network presets
```

---

## Dependencies

- `effect` - Core Effect library (peer dependency)
- `@kundera-sn/kundera-ts` - Starknet primitives, types, transport (peer dependency)

No other runtime dependencies. Keep it minimal.

---

## Anti-patterns (DO NOT)

- DO NOT reimplement logic that exists in kundera-ts
- DO NOT hardcode RPC method strings -- use `Rpc.*Request()` builders
- DO NOT use manual retry/polling loops -- use `Effect.retry` + `Schedule`
- DO NOT use `let` for shared mutable state -- use `Ref`/`FiberRef`
- DO NOT use `Schema.TaggedError` for errors -- use `Data.TaggedError`
- DO NOT put operations inside service methods -- prefer free functions
- DO NOT duplicate mock implementations in tests -- use shared factories
- DO NOT use raw `vitest` -- use `@effect/vitest`
- DO NOT cast `as T` without documenting the trust boundary
- DO NOT use `console.*` in library code
