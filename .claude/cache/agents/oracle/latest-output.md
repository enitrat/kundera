# Research Report: Voltaire & Starknet TS Library Integration Test Patterns
Generated: 2026-02-06

## Summary

Voltaire (evmts/voltaire) has **no true integration tests** against live nodes/devnets. All 4,332 test files are unit tests using mocks (InMemoryProvider, MockRpcClient, TestTransport, vi.fn fetch mocks). The Starknet ecosystem's canonical integration test pattern comes from **starknet.js**, which runs against a live starknet-devnet-rs process with predeployed accounts, conditional test gates, and a global setup that auto-detects the environment.

## Questions Answered

### Q1: Does Voltaire have integration tests?
**Answer:** No real integration tests. All tests are unit tests with mocks. The closest is `ForkProvider.mock.test.ts` which uses `MockRpcClient` (an in-memory state store implementing the EIP-1193 `Provider` interface), and `InMemoryProvider.test.ts` which tests a full in-process provider. Neither makes network calls.
**Confidence:** High (verified by reading test files, CI configs, and vitest configs)

### Q2: What do Voltaire's tests cover?
**Answer:** Extensive unit test coverage across:
- **RPC request builders** (one test per `eth_*` method, testing request shape only)
- **Provider layer** (HttpProvider with fetch mocks, InMemoryProvider with in-memory state, ForkProvider with MockRpcClient, TypedProvider type-level tests)
- **Effect services** (Provider, Transport, RpcBatch, BlockStream, RateLimiter, Account, Contract, Signer, Cache, NonceManager -- all with mock TransportService layers)
- **Primitives** (Address, Block, Transaction, Abi encoding/decoding, etc.)
- **Crypto** (Keccak256, Secp256k1, SHA256, etc.)
**Confidence:** High

### Q3: How do they handle test infrastructure?
**Answer:** Three-layer mock strategy:
1. **`TestTransport`** (Effect): A `Layer.Layer<TransportService>` that takes a `Record<string, unknown>` mapping method names to responses. Supports `TransportError` instances for error simulation. This is the primary testing primitive.
2. **`MockRpcClient`** (TS): Full EIP-1193 `Provider` implementation with in-memory accounts/blocks/storage. Used for ForkProvider testing.
3. **`InMemoryProvider`** (TS): Complete in-process provider with mining modes, snapshot/revert, and Anvil/Hardhat compatibility methods.
4. **`vi.fn()` fetch mocks** for HttpProvider (currently skipped, awaiting EIP-1193 migration).
**Confidence:** High

### Q4: What test patterns do they use?
**Answer:**
- **Request builder tests**: Pure function tests validating `{ method, params }` shape (no provider needed)
- **Effect service tests**: `Effect.gen` + `Effect.provide(mockLayer)` + `Effect.runPromise`, using `@effect/vitest`'s `it.effect()`
- **Type-level tests**: `expectTypeOf()` for compile-time type safety verification
- **Error path tests**: `Effect.exit` + `Exit.isFailure()` for Effect; `expect(...).rejects.toThrow()` for TS
- **Vitest config**: Single-threaded pool, 30s timeout, `@effect/vitest` for Effect tests, separate configs per package
**Confidence:** High

### Q5: What does the Starknet ecosystem use for integration tests?
**Answer:** starknet.js is the gold standard. It uses **starknet-devnet-rs** (a local Rust node) with the **starknet-devnet** npm package (`DevnetProvider`) for devnet API calls. Key patterns:
- **Global setup** (`jestGlobalSetup.ts`): Auto-detects devnet vs testnet, resolves predeployed accounts via `DevnetProvider.getPredeployedAccounts()`, sets env vars
- **Conditional gates**: `describeIfDevnet`, `describeIfTestnet`, `describeIfRpc` -- skip suites based on `IS_DEVNET`, `IS_RPC`, `IS_TESTNET` env vars
- **Block creation**: `createBlockForDevnet()` helper forces block production on devnet
- **Real transactions**: Tests execute actual `account.execute()` calls, wait for receipts, verify state changes
- **Spec version detection**: Tests auto-detect RPC spec version and skip incompatible tests
**Confidence:** High

## Detailed Findings

### Finding 1: Voltaire TestTransport Pattern (Effect)
**Source:** `packages/voltaire-effect/src/services/Transport/TestTransport.ts`

The primary testing primitive. Creates a mock `TransportService` layer from a method->response map.

```typescript
import { TestTransport, Provider, TransportError } from 'voltaire-effect'

// Happy path
const TestLayer = Provider.pipe(
  Layer.provide(TestTransport({
    'eth_getBalance': '0xde0b6b3a7640000',
    'eth_blockNumber': '0x1234',
  }))
)

// Error simulation
const FailingLayer = Provider.pipe(
  Layer.provide(TestTransport({
    'eth_call': new TransportError({ code: -32000, message: 'execution reverted' }),
  }))
)

// Usage in test
it.effect("fetches balance", () =>
  Effect.gen(function* () {
    const result = yield* getBalance("0x1234...")
    expect(result).toBe(1000000000000000000n)
  }).pipe(Effect.provide(TestLayer))
)
```

**Key insight:** Responses are matched by method name only (params ignored). This is simple but means you can't test parameter-dependent behavior at the transport level.

### Finding 2: Voltaire MockRpcClient Pattern (TS)
**Source:** `packages/voltaire-ts/src/provider/test-utils/MockRpcClient.ts`

Full in-memory EIP-1193 provider with account state management.

```typescript
const mockRpc = new MockRpcClient()
mockRpc.setAccount("0x1234...", {
  balance: 1000000000000000000n,
  nonce: 5n,
  code: "0x6080604052",
  storage: new Map([[0n, 42n]]),
})
mockRpc.setBlock({ number: 1000n, hash: "0xa...", ... })

// Then use as provider
const provider = new ForkProvider({
  fork: { forkUrl: "http://...", forkBlockNumber: 1000n },
  rpcClient: mockRpc,
  chainId: 1,
})
const balance = await provider.request({ method: "eth_getBalance", params: [...] })
```

### Finding 3: Voltaire InMemoryProvider
**Source:** `packages/voltaire-ts/src/provider/InMemoryProvider.ts`

Complete in-process provider supporting:
- Configurable chain ID and initial accounts
- Block production (auto, interval, manual mining)
- Snapshot/revert (Anvil/Hardhat compatible methods)
- Full `eth_*` method set
- `destroy()` cleanup

```typescript
const provider = new InMemoryProvider({
  chainId: 1337,
  accounts: [
    { address: "0x742d...", balance: "0x56bc75e2d63100000" }, // 100 ETH
  ],
})
const chainId = await provider.request({ method: "eth_chainId" }) // "0x539"
provider.destroy()
```

### Finding 4: starknet.js Devnet Integration Pattern
**Source:** `starknet-io/starknet.js/__tests__/`

The canonical Starknet integration test setup:

**Global setup flow:**
1. `jestGlobalSetup.ts` -> `strategyResolver.execute()`
2. Detect devnet: POST `starknet_syncing` to `localhost:5050`
3. Resolve accounts: `DevnetProvider.getPredeployedAccounts()` -> set `TEST_ACCOUNT_ADDRESS` + `TEST_ACCOUNT_PRIVATE_KEY`
4. Detect spec version: `provider.getSpecVersion()`
5. Initialize devnet history: Execute 3 transfers to create tip history

**Conditional test gates:**
```typescript
const describeIf = (condition: boolean) => condition ? describe : describe.skip
export const describeIfDevnet = describeIf(process.env.IS_DEVNET === 'true')
export const describeIfTestnet = describeIf(process.env.IS_TESTNET === 'true')
```

**Test instance creation:**
```typescript
export async function createTestProvider() {
  return Provider.create({
    nodeUrl: process.env.TEST_RPC_URL,
    specVersion: process.env.RPC_SPEC_VERSION,
  })
}
export const getTestAccount = (provider) =>
  new Account({ provider, address: process.env.TEST_ACCOUNT_ADDRESS, ... })
```

**Block creation helper:**
```typescript
export const createBlockForDevnet = async () => {
  if (process.env.IS_DEVNET !== 'true') return
  const devnet = new DevnetProvider({ url: process.env.TEST_RPC_URL })
  await devnet.createBlock()
}
```

### Finding 5: Voltaire CI Configuration
**Source:** `.github/workflows/ci.yml`, `voltaire-effect-ci.yml`

- Main CI runs Zig tests only (build + `zig build test` across 4 optimization levels x 3 OSes)
- Effect CI runs lint + build only (tests commented out: "require full voltaire WASM build")
- TS CI not visible in effect CI (runs in main or separate workflow)
- No devnet/node containers in CI -- all tests are purely mock-based

## Comparison Matrix

| Aspect | Voltaire (evmts) | starknet.js |
|--------|-----------------|-------------|
| **Real node tests** | None | Yes (devnet-rs) |
| **Mock strategy** | TestTransport, MockRpcClient, InMemoryProvider | vi.fn fetch mocks (minimal) |
| **Test framework** | Vitest + @effect/vitest | Jest |
| **Conditional gates** | None (all tests always run) | describeIfDevnet/Testnet/Rpc |
| **Devnet wrapper** | N/A | starknet-devnet npm package |
| **Account setup** | Hardcoded test addresses | Auto from DevnetProvider.getPredeployedAccounts() |
| **Block production** | InMemoryProvider auto-mines | createBlockForDevnet() helper |
| **Coverage** | ~18% lines (low, many excluded) | Higher (real transactions) |
| **Effect testing** | it.effect() + Layer.provide | N/A |

## Recommendations for Kundera

### 1. Adopt Voltaire's TestTransport Pattern for Unit Tests
Create a `TestTransport` equivalent for Starknet that maps `starknet_*` method names to canned responses. This covers 80% of testing needs without network.

```typescript
// packages/kundera-effect/src/services/Transport/TestTransport.ts
export const TestTransport = (responses: Record<string, unknown>): Layer.Layer<TransportService> => ...
```

### 2. Adopt starknet.js Pattern for Integration Tests
Use starknet-devnet-rs + starknet-devnet npm package for real integration tests:
- Global setup: auto-detect devnet, fetch predeployed accounts
- Conditional gates: `describeIfDevnet` / skip in CI if no devnet
- Block helpers: `createBlockForDevnet()`
- Real RPC calls: verify actual `starknet_*` responses

### 3. Create MockRpcClient for Starknet
Equivalent to Voltaire's `MockRpcClient` but for Starknet state:
- In-memory felt storage, nonce tracking
- Support `starknet_getStorageAt`, `starknet_getNonce`, `starknet_call`, `starknet_getBlockWithTxs`
- Useful for provider tests without devnet dependency

### 4. Test Tiers
| Tier | Scope | Infrastructure | When |
|------|-------|---------------|------|
| Unit | Request builders, primitives, serde | None (pure) | Every commit |
| Mock integration | Provider + transport | TestTransport/MockRpcClient | Every commit |
| Devnet integration | Full RPC flow | starknet-devnet-rs | CI + pre-release |
| Testnet smoke | Mainnet/testnet compatibility | Sepolia node | Manual/nightly |

## Sources
1. [evmts/voltaire](https://github.com/evmts/voltaire) - Main Voltaire repository
2. [starknet-io/starknet.js](https://github.com/starknet-io/starknet.js) - Starknet JS library
3. [0xSpaceShard/starknet-devnet](https://github.com/0xSpaceShard/starknet-devnet) - Starknet devnet (Rust)
4. [0xSpaceShard/starknet-devnet-js](https://github.com/0xSpaceShard/starknet-devnet-js) - JS wrapper for devnet API
5. [keep-starknet-strange/abi-wan-kanabi](https://github.com/keep-starknet-strange/abi-wan-kanabi) - ABI parser (type-level tests only, no integration tests)
6. [Starknet devnet docs](https://0xspaceshard.github.io/starknet-devnet/docs/intro) - Devnet API reference

## Open Questions
- Does kundera-effect need its own `@effect/vitest`-compatible test layer, or can it share TestTransport with kundera-ts?
- Should the MockRpcClient support Cairo-level simulation (executing actual contract calls in-process) or just canned responses?
- Is there value in a Starknet InMemoryProvider equivalent, or is devnet-rs sufficient?
