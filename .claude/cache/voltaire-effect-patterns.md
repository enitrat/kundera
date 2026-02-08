# Voltaire Effect Patterns: Comprehensive Reference

A deep analysis of `voltaire-effect` (v0.3.1) -- an Effect-TS integration for Ethereum. This document extracts architectural patterns, design philosophy, and implementation details to inform `kundera-effect` development for Starknet.

---

## 1. Architectural Overview

### Package Structure

```
voltaire-effect/
  src/
    primitives/        # Schema-validated domain types (Address, Hex, Block, etc.)
    services/          # Effect services (Transport, Provider, Contract, Signer, etc.)
    crypto/            # Crypto services (Keccak, Secp256k1, etc.)
    jsonrpc/           # JSON-RPC schemas (Effect Schema for request/response validation)
    blockchain/        # Blockchain service (block storage abstraction)
    contract/          # EventStream service
    block/             # Block fetching utilities
    stream/            # Streaming utilities
    native/            # Bun-only FFI transports
    utils/             # Unit conversion utilities
```

### Subpath Exports

```json
{
  ".":           "services, contracts, provider",
  "./primitives": "Address, Hex, Bytes32, etc.",
  "./crypto":    "Keccak, secp256k1, etc.",
  "./services":  "all services",
  "./native":    "Bun-only FFI transports",
  "./jsonrpc":   "JSON-RPC schemas"
}
```

### Dependency Graph

```
TransportService (foundation)
  ^
  |
ProviderService (reads from transport)
  ^
  |-- free functions: getBalance(), getBlockNumber(), call(), etc.
  |-- Contract (read/write/simulate/events)
  |-- Signer (requires AccountService + ProviderService + TransportService)
```

The key insight: **TransportService is the only service that touches the network**. Everything else is layered on top.

---

## 2. Service Architecture

### The Core Pattern: Tag + Shape + Layer

Every service follows a three-part structure:

**1. Shape (interface):**
```typescript
// TransportService.ts
export type TransportShape = {
  readonly request: <T>(
    method: string,
    params?: unknown[],
  ) => Effect.Effect<T, TransportError>;
};
```

**2. Tag (Context.Tag):**
```typescript
// TransportService.ts
export class TransportService extends Context.Tag("TransportService")<
  TransportService,
  TransportShape
>() {}
```

Uses `Context.Tag` class pattern -- the tag IS the class. The string `"TransportService"` is the discriminator. The generic params `<TransportService, TransportShape>` bind the tag to its shape.

**3. Layer (implementation):**
```typescript
// Provider.ts (live implementation)
export const Provider = Layer.effect(
  ProviderService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    return {
      request: <T>(method: string, params?: unknown[]) =>
        transport.request<T>(method, params),
    };
  }),
);
```

### Why This Pattern Matters

- **Type signature encodes dependencies**: `Effect<A, E, ProviderService>` tells you this needs a provider
- **Testability**: Swap `Provider` for `Layer.succeed(ProviderService, mockImpl)`
- **Composition**: `Layer.mergeAll(Signer.Live, Provider, HttpTransport(url))`
- **Tree-shaking**: Unused services never enter the bundle

### Anti-pattern: Service Methods vs Free Functions

Voltaire initially put methods on the ProviderService shape (like viem's `client.getBalance()`). They refactored to **free functions** instead:

```typescript
// OLD: method on service
const provider = yield* ProviderService
const balance = yield* provider.getBalance(addr)

// NEW: free function (current design)
const balance = yield* getBalance(addr)
```

**Why?** The ProviderService shape is now minimal -- just `request`. All operations are free functions that internally `yield* ProviderService` and call `request`. Benefits:
- Better tree-shaking (import only the functions you use)
- No god-object with 60+ methods
- Each function is independently importable/testable
- Type signature shows exactly what service it needs

### Free Function Implementation

```typescript
// getBlockNumber.ts
export const getBlockNumber = (): Effect.Effect<
  bigint,
  TransportError | ProviderResponseError,
  ProviderService
> =>
  Effect.flatMap(ProviderService, (svc) =>
    svc.request<string>("eth_blockNumber").pipe(
      Effect.flatMap((hex) =>
        Effect.try({
          try: () => BigInt(hex),
          catch: (error) =>
            new ProviderResponseError(hex, "Invalid hex from eth_blockNumber", {
              cause: error,
            }),
        }),
      ),
    ),
  );
```

Key observations:
- Return type explicitly declares `TransportError | ProviderResponseError` -- typed error channel
- Uses `Effect.flatMap(ProviderService, ...)` to access the service -- no generator needed for simple functions
- Response parsing happens inline with `Effect.try`
- Error wrapping preserves context (the hex value that failed to parse)

### ProviderService is Deliberately Thin

```typescript
export type ProviderShape = {
  readonly request: <T>(
    method: string,
    params?: unknown[],
  ) => Effect.Effect<T, TransportError>;
};

export class ProviderService extends Context.Tag("ProviderService")<
  ProviderService,
  ProviderShape
>() {}
```

Just one method: `request`. This is effectively a thin wrapper over TransportService. The Provider layer simply delegates:

```typescript
export const Provider = Layer.effect(
  ProviderService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    return {
      request: <T>(method: string, params?: unknown[]) =>
        transport.request<T>(method, params),
    };
  }),
);
```

**Why the indirection?** It allows free functions to depend on `ProviderService` (business logic) instead of `TransportService` (infrastructure). This separation means you could provide `ProviderService` without a transport (e.g., for testing or caching).

---

## 3. Transport Layer

### TransportService: The Foundation

```typescript
export type TransportShape = {
  readonly request: <T>(
    method: string,
    params?: unknown[],
  ) => Effect.Effect<T, TransportError>;
};
```

Single method. All transports implement this. The `<T>` generic is the expected response type.

### HttpTransport

Returns `Layer.Layer<TransportService, never, HttpClient.HttpClient>` -- it provides `TransportService` but requires `HttpClient.HttpClient` (from `@effect/platform`).

Key features:
- Accepts `string | HttpTransportConfig`
- Default timeout: 30 seconds (`Duration.seconds(30)`)
- Default retry: exponential backoff starting at 1s, with jitter, max 3 retries
- Uses `@effect/platform` HttpClient for cross-platform compatibility
- Supports request batching, custom headers, fetch options
- FiberRef-based hooks for request/response interception

```typescript
export const HttpTransport = (
  options: HttpTransportConfig | string,
): Layer.Layer<TransportService, never, HttpClient.HttpClient> => {
  // ...builds Layer that wraps @effect/platform HttpClient
};
```

### Convenience Provider Factories

Rather than forcing users to compose Transport + Provider manually, Voltaire provides composed factories:

```typescript
// One-step: HttpProvider = Provider + HttpTransport
export const HttpProvider = (
  options: HttpTransportConfig | string,
): Layer.Layer<ProviderService, never, HttpClient.HttpClient> =>
  Provider.pipe(Layer.provide(HttpTransport(options)));

// Zero-dep: HttpProviderFetch = Provider + HttpTransport + FetchHttpClient
export const HttpProviderFetch = (
  options: HttpTransportConfig | string,
): Layer.Layer<ProviderService> =>
  HttpProvider(options).pipe(Layer.provide(FetchHttpClient.layer));
```

This is a key ergonomics pattern: **convenience layers for common compositions**.

### TestTransport

Dead simple mock transport for testing:

```typescript
export const TestTransport = (
  responses: Map<string, unknown> | Record<string, unknown>,
): Layer.Layer<TransportService> => {
  const responseMap =
    responses instanceof Map ? responses : new Map(Object.entries(responses));

  return Layer.succeed(TransportService, {
    request: <T>(method: string, _params: unknown[] = []) =>
      Effect.gen(function* () {
        if (!responseMap.has(method)) {
          return yield* Effect.fail(
            new TransportError({ code: -32601, message: `Method not found: ${method}` }),
          );
        }
        const response = responseMap.get(method);
        if (response instanceof TransportError) {
          return yield* Effect.fail(response);
        }
        return response as T;
      }),
  });
};
```

Usage:
```typescript
const TestLayer = Provider.pipe(
  Layer.provide(TestTransport({
    eth_blockNumber: '0x1234',
    eth_getBalance: '0xde0b6b3a7640000'
  }))
);
```

### FallbackTransport

Wraps multiple transports, automatically fails over:
```typescript
FallbackTransport([
  HttpTransport('https://primary.rpc.com'),
  HttpTransport('https://backup.rpc.com'),
  HttpTransport('https://fallback.rpc.com')
], { rank: true, retryCount: 3 })
```

Uses `SynchronizedRef` for thread-safe state tracking of failures and latency per transport.

### FiberRef-Based Per-Request Configuration

Transport overrides are scoped to the current fiber via `FiberRef`:

```typescript
// FiberRefs for overrides
export const timeoutRef = FiberRef.unsafeMake<Duration.Duration | undefined>(undefined);
export const retryScheduleRef = FiberRef.unsafeMake<Schedule | undefined>(undefined);
export const cacheEnabledRef = FiberRef.unsafeMake<boolean>(true);
export const tracingRef = FiberRef.unsafeMake<boolean>(false);

// Helper functions that set FiberRef locally
export const withTimeout = (timeout: DurationInput) => <A, E, R>(
  effect: Effect.Effect<A, E, R>
) => Effect.locally(effect, timeoutRef, Duration.decode(timeout));
```

Usage:
```typescript
// Default config
const balance = yield* getBalance(addr)

// Per-request override (doesn't affect other calls)
const fastBalance = yield* getBalance(addr).pipe(
  withTimeout("5 seconds"),
  withRetrySchedule(Schedule.recurs(1))
)
```

**Why FiberRef instead of service configuration?** FiberRefs are scoped to the current fiber -- they don't leak to other fibers or calls. This is Effect's answer to "I want different timeouts for different calls without changing the service."

---

## 4. Schema Validation Pipeline

### The Three-Layer Architecture

Voltaire organizes around three conceptual layers:

| Layer | Purpose | When |
|-------|---------|------|
| **Schema** | Validation, type coercion | Parsing user input, API responses |
| **Effect** | Composable operations | Chaining transformations, error handling |
| **Services** | Stateful resources | Provider calls, wallet signing |

### Primitive Schemas: Branded Types with Bidirectional Transform

Each primitive (Address, Hex, Bytes32, etc.) has an Effect Schema that transforms between wire format (string) and branded internal type:

```typescript
// AddressSchema.ts -- canonical type schema
export const AddressTypeSchema = S.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: "Address" },
);
```

```typescript
// Hex.ts -- bidirectional transform schema
export const Hex: S.Schema<AddressType, string> = S.transformOrFail(
  S.String,            // from: string
  AddressTypeSchema,   // to: AddressType (Uint8Array branded)
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Address(s));
      } catch (e) {
        return ParseResult.fail(
          new ParseResult.Type(ast, s, (e as Error).message),
        );
      }
    },
    encode: (addr, _options, _ast) => {
      return ParseResult.succeed(Address.toHex(addr));
    },
  },
).annotations({
  identifier: "Address.Hex",
  title: "Ethereum Address",
  description: "A 20-byte Ethereum address as a hex string...",
  examples: EXAMPLE_ADDRESSES,
  message: () => "Invalid Ethereum address: expected 40 hex characters with 0x prefix",
});
```

Key design decisions:
- `S.declare` for the canonical type (runtime check: is Uint8Array + correct length)
- `S.transformOrFail` for encoding schemas (string <-> branded type)
- Rich annotations: identifier, title, description, examples, message
- Wraps the base library's constructor (`Address(s)`) -- no reimplementation
- The Schema IS the validation. No separate validation functions.

### Schema Usage Modes

```typescript
// Sync (throws ParseError)
const addr = S.decodeSync(Address.Hex)('0x...')

// Effect (typed error)
const addr = yield* S.decode(Address.Hex)('0x...')
// Effect<AddressType, ParseError>

// Either (branching)
const result = S.decodeEither(Address.Hex)('0x...')
// Either<AddressType, ParseError>

// Encode (reverse)
const hex = S.encodeSync(Address.Hex)(addr)
```

### Composable Schema Structs

Schemas compose into larger validation structures:

```typescript
const TransferRequestSchema = S.Struct({
  from: Address.Hex,
  to: Address.Hex,
  amount: Uint.Uint256,
  memo: S.optional(S.String)
})

const request = S.decodeSync(TransferRequestSchema)({
  from: '0x742d35Cc...',
  to: '0xd8dA6BF2...',
  amount: '1000000000000000000'
})
```

### JSON-RPC Schemas

Separate from primitive schemas, JSON-RPC schemas validate wire-format requests and responses:

```typescript
// common.ts -- shared schemas
export const HexSchema = S.String.pipe(
  S.pattern(/^0x[a-fA-F0-9]*$/, {
    message: () => "Expected hex string with 0x prefix",
  }),
);

export const AddressHexSchema = S.String.pipe(
  S.pattern(/^0x[a-fA-F0-9]{40}$/, {
    message: () => "Expected 20-byte address hex string",
  }),
);

export const BlockTagSchema = S.Union(
  S.Literal("latest"),
  S.Literal("earliest"),
  S.Literal("pending"),
  S.Literal("safe"),
  S.Literal("finalized"),
  QuantityHexSchema,
);
```

```typescript
// eth/getBalance.ts
export const GetBalanceParams = S.Tuple(AddressHexSchema, BlockTagSchema);
export const GetBalanceResult = QuantityHexSchema;

export const GetBalanceRequest = S.Struct({
  jsonrpc: JsonRpcVersionSchema,
  method: S.Literal("eth_getBalance"),
  params: GetBalanceParams,
  id: S.optional(JsonRpcIdSchema),
});

export const GetBalanceResponse = S.Struct({
  jsonrpc: JsonRpcVersionSchema,
  id: JsonRpcIdSchema,
  result: GetBalanceResult,
});
```

**Observation:** These JSON-RPC schemas exist but are NOT currently used by the free functions (which do raw string manipulation). They seem to exist for validation/documentation purposes and could be integrated for stricter request/response validation.

---

## 5. Error Handling

### Tagged Errors with `Data.TaggedError`

Every error extends `Data.TaggedError`:

```typescript
export class TransportError extends Data.TaggedError("TransportError")<{
  readonly input: { code: number; message: string; data?: unknown };
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
  readonly cause?: unknown;
}> {}
```

The string `"TransportError"` is the tag. This enables `Effect.catchTag("TransportError", ...)` pattern matching.

### Error Hierarchy

```
ParseError              -- Schema decode failures (from Effect itself)
TransportError          -- Network/HTTP/WebSocket failures
ProviderResponseError   -- Invalid provider response (e.g., non-hex value)
ProviderNotFoundError   -- Missing block/tx/receipt
ProviderValidationError -- Invalid input to provider method
ProviderTimeoutError    -- Provider operation timed out
ProviderStreamError     -- Provider stream failures
ContractError           -- Base contract error
ContractCallError       -- Read operation error (extends ContractError pattern)
ContractWriteError      -- Write operation error
ContractEventError      -- Event query error
SignerError             -- Transaction signing failures
BlockchainError         -- Block storage failures
CryptoError             -- Cryptographic operation failures
BlockStreamError        -- Block streaming failures
```

### Error Design Principles

1. **Each error has an `input` field** -- the original value that caused the error
2. **Each error has a `message` field** -- human-readable description
3. **Each error has optional `cause`** -- the underlying error for debugging
4. **Each error has optional `context`** -- additional debugging metadata
5. **Constructor signature**: `(input, message?, options?)` -- consistent across all errors

```typescript
export class ProviderResponseError extends Data.TaggedError("ProviderResponseError")<{
  readonly input: unknown;
  readonly message: string;
  readonly cause?: unknown;
  readonly context?: Record<string, unknown>;
}> {
  constructor(
    input: unknown,
    message?: string,
    options?: { cause?: unknown; context?: Record<string, unknown> },
  ) {
    super({
      input,
      message: message ?? (options?.cause instanceof Error ? options.cause.message : undefined) ?? "Invalid provider response",
      cause: options?.cause,
      context: options?.context,
    });
  }
}
```

### Error Handling Patterns

```typescript
// Catch by tag
program.pipe(
  Effect.catchTag('TransportError', (e) => Effect.succeed(fallback))
)

// Catch multiple tags
program.pipe(
  Effect.catchTags({
    ParseError: () => ...,
    TransportError: () => ...,
    ProviderResponseError: () => ...,
  })
)

// Custom domain errors
class InsufficientBalance extends Data.TaggedError('InsufficientBalance')<{
  readonly required: bigint
  readonly available: bigint
}> {}

// Composing errors
const program = Effect.gen(function* () {
  const a = yield* S.decode(Address.Hex)(input)  // ParseError
  return yield* getBalance(a)                     // TransportError | ProviderResponseError
})
// Type: Effect<bigint, ParseError | TransportError | ProviderResponseError, ProviderService>
```

### Anti-pattern: Generic Error Types

Voltaire avoids `Error` or generic catch-all types. Every error is tagged and typed. You never see `catch (e: unknown)` in Effect code -- the error channel is always precise.

---

## 6. Contract Interaction Pattern

### Contract Factory

```typescript
export const Contract = <TAbi extends Abi>(
  address: AddressType | `0x${string}`,
  abi: TAbi,
): Effect.Effect<ContractInstance<TAbi>, never, ProviderService>
```

Returns an Effect that yields a `ContractInstance` with four namespaces:

```typescript
interface ContractInstance<TAbi> {
  read: { [fn: string]: (...args) => Effect<result, ContractCallError, ProviderService> }
  write: { [fn: string]: (...args) => Effect<HashType, ContractWriteError, SignerService> }
  simulate: { [fn: string]: (...args) => Effect<result, ContractCallError, ProviderService> }
  getEvents: (name, filter?) => Effect<DecodedEvent[], ContractEventError, ProviderService>
}
```

Implementation dynamically creates methods from ABI items:
- Filters view/pure functions -> `read` namespace
- Filters non-view/non-pure functions -> `write` and `simulate` namespaces
- Each method encodes args via `BrandedAbi.encodeFunction`, calls transport, decodes results

### ContractRegistryService (Multi-Contract DI)

```typescript
const Contracts = makeContractRegistry({
  USDC: { abi: erc20Abi, address: '0xA0b86991c...' },
  WETH: { abi: wethAbi, address: '0xC02aaA39b...' },
  ERC20: { abi: erc20Abi }  // no address = factory
})

// Usage
const { USDC, WETH, ERC20 } = yield* ContractRegistryService
const balance = yield* USDC.read.balanceOf(user)
const token = yield* ERC20.at(dynamicAddress)
```

The registry:
- With address: fully instantiated `ContractInstance`
- Without address: `ContractFactory` with `.at(address)` method
- Type-level distinction: `TConfig[K]["address"] extends ... ? ContractInstance : ContractFactory`

---

## 7. Crypto Service Pattern

### Service + Live + Test Triple

Every crypto module follows the same pattern:

```typescript
// 1. Shape
export interface KeccakServiceShape {
  readonly hash: (data: Uint8Array) => Effect.Effect<Keccak256Hash>;
}

// 2. Tag
export class KeccakService extends Context.Tag("KeccakService")<
  KeccakService,
  KeccakServiceShape
>() {}

// 3. Live layer (wraps base library)
export const KeccakLive = Layer.succeed(KeccakService, {
  hash: (data) => Effect.sync(() => Keccak256.hash(data)),
});

// 4. Test layer (deterministic mock)
export const KeccakTest = Layer.succeed(KeccakService, {
  hash: (_data) => Effect.sync(() => new Uint8Array(32) as Keccak256Hash),
});
```

### Bundle Layers

```typescript
// CryptoLive.ts -- all production crypto
export const CryptoLive = Layer.mergeAll(
  KeccakLive, Secp256k1Live, SHA256Live, Blake2Live,
  Ripemd160Live, Bls12381Live, Ed25519Live, P256Live,
  KZGLive, Bn254Live, Bip39Live, HMACLive, EIP712Live,
  ChaCha20Poly1305Live, KeystoreLive,
);

// CryptoTest.ts -- all test mocks
export const CryptoTest = Layer.mergeAll(
  KeccakTest, Secp256k1Test, SHA256Test, Blake2Test,
  Ripemd160Test, Ed25519Test, KZGTest, HDWalletTest,
  Bn254Test, Bip39Test, HMACTest, EIP712Test,
  ChaCha20Poly1305Test, KeystoreTest,
);
```

**Why bundle?** Common pattern: provide all crypto at once rather than assembling individual layers.

---

## 8. Layer Composition Patterns

### The Golden Rule: Compose Layers Before Providing

```typescript
// WRONG: multiple Effect.provide calls
program.pipe(
  Effect.provide(Signer.Live),
  Effect.provide(Provider),
  Effect.provide(HttpTransport(rpcUrl))
)

// RIGHT: compose layers once, provide once
const AppLayer = Layer.mergeAll(
  Signer.Live,
  Provider
).pipe(Layer.provide(HttpTransport(rpcUrl)))

program.pipe(Effect.provide(AppLayer))
```

### Composition Operators

| Pattern | When |
|---------|------|
| `Layer.mergeAll(A, B, C)` | Independent layers, no deps between them |
| `A.pipe(Layer.provide(B))` | A depends on B |
| `Layer.provideMerge(A, B)` | Add B's services while keeping A |

### Real-World Composition: Full Wallet Setup

```typescript
const CryptoLayer = Layer.mergeAll(Secp256k1Live, KeccakLive)
const TransportLayer = HttpTransport('https://eth.llamarpc.com')
const ProviderLayer = Provider.pipe(Layer.provide(TransportLayer))

const WalletLayer = Layer.mergeAll(
  Signer.Live,
  CryptoLayer,
  ProviderLayer
).pipe(
  Layer.provideMerge(MnemonicAccount(mnemonic).pipe(Layer.provide(CryptoLayer)))
)

// Single provide at the edge
await Effect.runPromise(program.pipe(Effect.provide(WalletLayer)))
```

---

## 9. Testing Patterns

### Level 1: TestTransport (most common)

Mock at transport level. No network calls.

```typescript
const TestLayer = Provider.pipe(
  Layer.provide(TestTransport({
    eth_blockNumber: '0x1234',
    eth_getBalance: '0xde0b6b3a7640000'
  }))
)

const result = await Effect.runPromise(
  getBlockNumber().pipe(Effect.provide(TestLayer))
)
expect(result).toBe(4660n)
```

### Level 2: Mock Service Directly

Replace the service entirely:

```typescript
const ProviderTest = Layer.succeed(ProviderService, {
  request: (_method, _params) => Effect.succeed(mockResponse)
})

Effect.provide(program, ProviderTest)
```

### Level 3: CryptoTest (deterministic mocks)

```typescript
const testProgram = program.pipe(Effect.provide(CryptoTest))
// All crypto returns deterministic values (e.g., zero-filled arrays)
```

### Level 4: Error Testing

```typescript
const failingTransport = TestTransport({
  eth_call: new TransportError({
    code: -32000,
    message: 'execution reverted',
    data: '0x08c379a0...'
  })
})

// Test error paths
const exit = await Effect.runPromiseExit(program.pipe(Effect.provide(failingTransport)))
expect(Exit.isFailure(exit)).toBe(true)
```

### Level 5: Integration Testing (Anvil)

```typescript
const TestLayer = Layer.mergeAll(
  Provider,
  Signer.Live,
  LocalAccount(Hex.fromHex('0xac0974...')),
  HttpTransport({
    url: 'http://localhost:8545',
    timeout: '10 seconds',
    retrySchedule: Schedule.recurs(1)
  })
)
```

---

## 10. Public API Design

### Consumer-Facing Flow: Decode -> Use -> Provide

```typescript
const ProviderLayer = Provider.pipe(
  Layer.provide(HttpTransport('https://eth.llamarpc.com'))
)

const program = Effect.gen(function* () {
  const addr = yield* S.decode(Address.Hex)(input)     // 1. decode
  return yield* getBalance(addr, 'latest')             // 2. use
})

await Effect.runPromise(program.pipe(Effect.provide(ProviderLayer)))  // 3. provide
```

### Import Organization

```typescript
import { Effect, Layer, Schedule } from 'effect'
import * as S from 'effect/Schema'
import * as Address from 'voltaire-effect/primitives/Address'
import { getBalance, getBlockNumber, Provider, HttpTransport } from 'voltaire-effect'
```

Primitives are namespace imports (`* as Address`), services/functions are named imports.

### Dual Input: Branded + Plain Hex

All public APIs accept both branded types and plain hex strings:

```typescript
export type AddressInput = AddressType | `0x${string}`;
```

This is critical for ergonomics -- users shouldn't be forced to Schema-decode before every call.

---

## 11. Key Differences from Starknet (kundera-effect implications)

### What Translates Directly

1. **TransportService pattern** -- identical. Starknet JSON-RPC works the same way.
2. **Tagged errors** -- identical. Use `Data.TaggedError` for all errors.
3. **Free functions over service methods** -- same pattern.
4. **TestTransport** -- same approach, different method names (`starknet_getBlockWithTxs` vs `eth_getBlockByNumber`).
5. **Schema validation pipeline** -- same. Use `S.transformOrFail` for Felt252 <-> hex string.
6. **FiberRef for per-request config** -- same.
7. **CryptoLive/CryptoTest bundle** -- same, but with Pedersen/Poseidon instead of Keccak/Secp256k1.
8. **Layer composition patterns** -- identical.

### What Needs Adaptation

1. **Contract interaction** -- Starknet uses Cairo ABI (different encoding), `invoke` instead of `sendTransaction`, no `simulate` equivalent (but has `estimateFee`).
2. **Account abstraction** -- Starknet has native account abstraction. No `Signer` service needed -- instead an `Account` service that can deploy, declare, invoke.
3. **Transaction types** -- Starknet has `INVOKE`, `DECLARE`, `DEPLOY_ACCOUNT` instead of EIP-1559/2930/4844.
4. **Felt252** -- replaces `uint256` as the fundamental type. Schema validation is different (252-bit bound).
5. **No ENS** -- Starknet has Starknet ID instead.
6. **Different RPC methods** -- `starknet_*` namespace.

### What to Skip

1. **EVM-specific primitives** -- Blob, AccessList, GasPrice, Uncle, etc.
2. **EIP-specific transaction types** -- Legacy, EIP-2930, EIP-4844, EIP-7702.
3. **EVM crypto** -- AES-GCM, BLS12-381, BN254, ChaCha20, etc. (unless needed).

---

## 12. Architectural Anti-Patterns (What Voltaire Avoids)

### 1. God-Object Client
viem puts everything on `publicClient` / `walletClient`. Voltaire uses free functions + services.

### 2. Implicit Retries
viem hides `retryCount: 3` in transport config. Voltaire makes retry explicit via `Schedule`.

### 3. Untyped Errors
viem throws `Error` objects. Voltaire uses `Data.TaggedError` with precise error channels.

### 4. Hidden Global State
viem uses module-level singletons. Voltaire uses Effect services -- no globals.

### 5. Magic Auto-Detection
viem auto-detects chain, gas strategy, etc. Voltaire requires explicit configuration.

### 6. Mixed Concerns
viem mixes transport config with client config. Voltaire separates Transport (how to send) from Provider (what to ask for) from Signer (who authorizes).

---

## 13. Implementation Checklist for kundera-effect

Based on Voltaire's architecture, kundera-effect should implement:

### Phase 1: Foundation
- [ ] `TransportService` (Shape + Tag + TransportError)
- [ ] `HttpTransport` layer (wrapping @effect/platform HttpClient)
- [ ] `TestTransport` layer (mock responses)
- [ ] `ProviderService` (thin wrapper, just `request`)
- [ ] `Provider` layer (delegates to transport)
- [ ] Convenience factories: `HttpProvider`, `HttpProviderFetch`

### Phase 2: Primitives
- [ ] `Felt252` schema (S.transformOrFail from hex string)
- [ ] `Address` schema (ContractAddress)
- [ ] `ClassHash` schema
- [ ] `BlockHash` schema
- [ ] JSON-RPC schemas (`starknet_*` methods)

### Phase 3: Free Functions
- [ ] `getBlockNumber()`, `getBlock()`, `getStateUpdate()`
- [ ] `call()`, `estimateFee()`
- [ ] `getTransactionByHash()`, `getTransactionReceipt()`
- [ ] `getNonce()`, `getClassAt()`, `getStorageAt()`

### Phase 4: Account + Signer
- [ ] `AccountService` (Starknet account abstraction)
- [ ] `invoke()`, `declare()`, `deployAccount()`
- [ ] Local signer (Pedersen + ECDSA)

### Phase 5: Contract
- [ ] `Contract(address, abi)` factory
- [ ] `ContractRegistryService`
- [ ] ABI encoding/decoding with Effect

### Phase 6: Crypto
- [ ] `PedersenService` (Live + Test)
- [ ] `PoseidonService` (Live + Test)
- [ ] `StarkCurveService` (ECDSA)
- [ ] `CryptoLive` / `CryptoTest` bundles

### Phase 7: Advanced
- [ ] `FallbackTransport`
- [ ] `WebSocketTransport` (for pending tx subscriptions)
- [ ] FiberRef-based per-request config
- [ ] Block streaming
