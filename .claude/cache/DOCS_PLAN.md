# kundera-effect Documentation Plan

## Target Audience

### Primary Users
- **Effect-TS developers** building Starknet dapps - assume Effect knowledge, teach Starknet patterns
- **Starknet developers** new to Effect - assume Starknet knowledge, teach Effect patterns
- **Full-stack developers** evaluating libraries - need clear comparison with alternatives (starknet.js, viem-style APIs)

### Skill Level Assumptions
- Comfortable with TypeScript and async patterns
- May or may not know Effect-TS (docs should work for both)
- Understands blockchain basics (transactions, accounts, gas, events)

---

## Doc Structure (proposed)

### Structure follows voltaire-effect and kundera-ts patterns:
```
docs/effect/
├── getting-started/
│   ├── installation.mdx
│   ├── quickstart.mdx
│   └── first-request.mdx
├── concepts/
│   ├── services-and-layers.mdx
│   ├── error-handling.mdx
│   ├── request-policies.mdx
│   └── wallet-vs-account.mdx
├── guides/
│   ├── reading-contract-data.mdx
│   ├── wallet-integration.mdx
│   ├── transaction-lifecycle.mdx
│   ├── working-with-presets.mdx
│   ├── custom-provider-config.mdx
│   ├── testing-with-mocks.mdx
│   └── event-filtering.mdx (already exists in shared/)
├── services/
│   ├── provider.mdx (EXISTS - already documented)
│   ├── wallet-provider.mdx
│   ├── contract.mdx (EXISTS - needs update)
│   ├── contract-write.mdx (EXISTS - needs update)
│   ├── contract-registry.mdx (EXISTS - needs update)
│   ├── transaction.mdx
│   ├── chain.mdx
│   ├── fee-estimator.mdx (EXISTS - needs review)
│   ├── nonce-manager.mdx (EXISTS - needs review)
│   └── transport.mdx
├── modules/
│   ├── jsonrpc.mdx (EXISTS - needs expansion)
│   ├── primitives.mdx (EXISTS - needs review)
│   └── presets.mdx
└── api-reference/
    └── (generated TypeDoc content)
```

---

## Getting Started

### Installation & Setup
**File**: `getting-started/installation.mdx`

**Content**:
1. **Installation**
   - `pnpm add @kundera-sn/kundera-effect @kundera-sn/kundera-ts effect`
   - Peer dependencies explanation (why Effect is peer dep)
   - Optional: `@effect/vitest` for testing

2. **Package exports overview**
   ```typescript
   import { Services, JsonRpc, Presets, Primitives } from "@kundera-sn/kundera-effect";
   import { TransportError, RpcError } from "@kundera-sn/kundera-effect/errors";
   ```

3. **Runtime requirements**
   - Node.js 18+
   - Browser with StarknetWindowObject for wallet integration
   - Link to kundera-ts runtime docs (native vs WASM)

**Prerequisites**: TypeScript basics, package manager knowledge

---

### Quickstart
**File**: `getting-started/quickstart.mdx`

**Content**:
1. **Simplest possible program** - block number
   ```typescript
   import { Effect } from "effect";
   import { Presets, JsonRpc } from "@kundera-sn/kundera-effect";

   const program = JsonRpc.blockNumber().pipe(
     Effect.provide(Presets.SepoliaProvider())
   );

   const blockNum = await Effect.runPromise(program);
   ```

2. **With error handling**
   ```typescript
   const safeProgram = program.pipe(
     Effect.catchTags({
       TransportError: (e) => Effect.succeed(-1),
       RpcError: (e) => Effect.succeed(-1)
     })
   );
   ```

3. **With retries**
   ```typescript
   import { Schedule } from "effect";
   import { Services } from "@kundera-sn/kundera-effect";

   const resilient = JsonRpc.blockNumber().pipe(
     Services.withRetrySchedule(Schedule.recurs(2)),
     Effect.provide(Presets.SepoliaProvider())
   );
   ```

4. **Next steps** - links to wallet integration, contract calls, testing

**Code examples**: All runnable as-is, copy-paste ready

---

### First Request
**File**: `getting-started/first-request.mdx`

**Content**:
1. **Anatomy of an Effect program**
   - Import Effect and kundera modules
   - Build Effect with `Effect.gen` or pipes
   - Provide dependencies with layers
   - Run with `Effect.runPromise`

2. **Layer composition**
   ```typescript
   const stack = Layer.mergeAll(
     Presets.SepoliaProvider(),
     SomeOtherLayer
   );
   const program = myEffect.pipe(Effect.provide(stack));
   ```

3. **Reading vs writing**
   - JsonRpc for read operations (no wallet needed)
   - WalletProviderService for write operations (wallet required)

4. **Common pitfalls**
   - Forgetting to provide layers → type error showing missing services
   - Not handling errors → unhandled promise rejection
   - Providing layers in wrong order → dependency not satisfied

**Interactive elements**: Link to kundera-effect-cli example repo

---

## Core Concepts

### Services & Layers (Effect Mental Model)
**File**: `concepts/services-and-layers.mdx`

**Content**:
1. **What is a Service?**
   - Context.Tag - named dependency
   - ServiceShape - interface definition
   - Live Layer - implementation with `Layer.effect`

2. **Dependency graph**
   ```
   TransportService
     └─ ProviderService
          ├─ ChainService
          ├─ ContractService
          └─ FeeEstimatorService

   WalletProviderService (independent)
     └─ TransactionService
          └─ ContractWriteService
   ```

3. **Why Layers?**
   - Compile-time dependency tracking
   - Test mocking without monkey-patching
   - Runtime configuration (HTTP vs WebSocket, mainnet vs testnet)

4. **Layer composition patterns**
   - `Layer.merge` - independent services
   - `Layer.provide` - satisfy dependency
   - `Layer.succeed` - static value injection

5. **Common patterns**
   - Use presets for standard configs
   - Use `WalletBaseStack` / `WalletTransactionStack` for wallet flows
   - Use `Layer.mergeAll` to compose many layers

**Visual aids**: Dependency graph diagram

---

### Error Handling
**File**: `concepts/error-handling.mdx`

**Content**:
1. **Tagged errors in Effect**
   - Every error is a `Data.TaggedError` with `_tag` field
   - Type-safe error handling with `Effect.catchTag` / `Effect.catchTags`

2. **kundera-effect error types**
   - `TransportError` - network, timeout, connection failures
   - `RpcError` - JSON-RPC protocol errors (contract revert, invalid params)
   - `WalletError` - wallet interactions (user rejection, no wallet found)
   - `TransactionError` - transaction submission/polling failures
   - `NonceError` - nonce management issues
   - `ContractError` - ABI encoding/decoding errors

3. **Handling errors**
   ```typescript
   const program = JsonRpc.call(...).pipe(
     Effect.catchTags({
       RpcError: (e) => {
         if (e.code === CONTRACT_ERROR) {
           return Effect.fail(new MyCustomError({ ... }));
         }
         return Effect.fail(e);
       },
       TransportError: (e) => Effect.retry(Schedule.exponential("100 millis"))
     })
   );
   ```

4. **Error inspection**
   - `error._tag` - discriminate error type
   - `error.message` - human-readable description
   - `error.cause` - underlying error (if any)
   - RpcError-specific: `error.code`, `error.data`

5. **Best practices**
   - Always handle both TransportError and RpcError for RPC calls
   - Use `Effect.catchAll` for generic fallback
   - Log errors before rethrowing: `Effect.tapError(Effect.logError)`

**Code examples**: Each error type with realistic handler

---

### Request Policies (Fiber-Local Config)
**File**: `concepts/request-policies.mdx`

**Content**:
1. **What are request policies?**
   - Timeout, retry, tracing, interceptors
   - Applied via `FiberRef` (fiber-local, not global)
   - Scoped to a specific Effect execution

2. **Available policies**
   ```typescript
   import { Services } from "@kundera-sn/kundera-effect";

   Services.withTimeout("5 seconds")
   Services.withRetries(3)
   Services.withRetrySchedule(Schedule.exponential("100 millis"))
   Services.withRetryDelay("1 second")
   Services.withTracing(true)
   Services.withRequestInterceptor((ctx) => { ... })
   Services.withResponseInterceptor((ctx) => { ... })
   Services.withErrorInterceptor((ctx) => { ... })
   ```

3. **Policy composition**
   ```typescript
   const resilient = JsonRpc.blockNumber().pipe(
     Services.withTimeout("10 seconds"),
     Services.withRetrySchedule(Schedule.recurs(2))
   );
   ```

4. **Interceptor patterns**
   - Request logging
   - Response transformation
   - Error enrichment
   - Rate limiting

5. **Why fiber-local?**
   - Different effects can have different policies
   - No global state mutation
   - Composable and predictable

**Key insight**: Contrast with global config (e.g., axios defaults) - fiber-local is better for Effect

---

### Wallet vs Account
**File**: `concepts/wallet-vs-account.mdx`

**Content**:
1. **Two modes of operation**
   - **WalletProviderService** - Browser wallet (ArgentX, Braavos) via SNIP standards
   - **AccountService** (future) - Direct private key signing, server-side use cases

2. **When to use wallet**
   - User-facing dapps
   - Browser environment
   - Transactions require user approval
   - Example: DEX swap, NFT mint

3. **When to use account** (future feature)
   - Bots, scripts, automation
   - Server-side transactions
   - No user interaction needed
   - Example: Market maker bot, oracle updater

4. **Wallet integration flow**
   ```typescript
   const program = Effect.gen(function* () {
     const wallet = yield* WalletProviderService;
     const accounts = yield* wallet.requestAccounts();
     const txHash = yield* wallet.execute([call]);
     return txHash;
   });
   ```

5. **Migration path**
   - Document that AccountService is coming
   - Link to GitHub issue for tracking

**Note**: This doc is critical because many users will ask "how do I sign without a wallet?"

---

## Guides

### Guide: Reading Contract Data
**File**: `guides/reading-contract-data.mdx`

**Content**:
1. **Overview**
   - ContractService for read-only calls
   - ABI required for type-safe encoding/decoding
   - No wallet needed (public RPC node sufficient)

2. **Method 1: Direct JsonRpc.call**
   ```typescript
   const result = yield* JsonRpc.call({
     contract_address: "0x...",
     entry_point_selector: selector("balanceOf"),
     calldata: [ownerAddress]
   }, "latest");
   // Returns raw string[] - manual decoding needed
   ```

3. **Method 2: ContractService.readContract**
   ```typescript
   import erc20Abi from "./erc20.abi.json";

   const contract = yield* ContractService;
   const balance = yield* contract.readContract({
     abi: erc20Abi,
     address: "0x...",
     functionName: "balanceOf",
     args: [ownerAddress],
     blockId: "latest"
   });
   // Returns decoded value with inferred type
   ```

4. **Method 3: ContractFactory (type-safe)**
   ```typescript
   const erc20Abi = [...] as const;

   const token = yield* ContractFactory(address, erc20Abi);
   const balance = yield* token.read.balanceOf(owner);
   // Full type inference from ABI
   ```

5. **Method 4: ContractRegistry (recommended for apps)**
   ```typescript
   const registry = makeContractRegistry({
     usdc: { address: "0x...", abi: usdcAbi },
     dai: { address: "0x...", abi: daiAbi }
   });

   const contracts = yield* registry;
   const balance = yield* contracts.usdc.read.balanceOf(owner);
   ```

6. **Best practices**
   - Use ContractRegistry for known contracts (cleaner, testable)
   - Use ContractFactory for dynamic contract addresses
   - Use raw JsonRpc.call only for one-off queries or missing ABI

**Prerequisites**: Basic Effect.gen, Layer.provide knowledge

---

### Guide: Wallet Integration
**File**: `guides/wallet-integration.mdx`

**Content**:
1. **Overview**
   - WalletProviderService wraps StarknetWindowObject (SNIP-X standard)
   - Supports ArgentX, Braavos, and other SNIP-compliant wallets
   - Requires user interaction for transactions

2. **Detecting wallets**
   ```typescript
   if (typeof window !== "undefined" && window.starknet_argentX) {
     // ArgentX detected
   }
   ```

3. **Creating wallet stack**
   ```typescript
   import { Presets } from "@kundera-sn/kundera-effect";

   const stack = Presets.SepoliaWalletStack({
     swo: window.starknet_argentX,
     rpcUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8" // optional
   });
   ```

4. **Requesting account access**
   ```typescript
   const program = Effect.gen(function* () {
     const wallet = yield* WalletProviderService;
     const accounts = yield* wallet.requestAccounts();
     return accounts[0];
   });
   ```

5. **Executing transactions**
   ```typescript
   const tx = yield* wallet.execute([
     {
       contract_address: "0x...",
       entry_point: "transfer",
       calldata: [recipient, amount]
     }
   ]);
   ```

6. **Writing via ContractWriteService**
   ```typescript
   const contractWrite = yield* ContractWriteService;
   const txHash = yield* contractWrite.invoke({
     abi: erc20Abi,
     address: tokenAddress,
     functionName: "transfer",
     args: [recipient, amount]
   });
   ```

7. **Error handling**
   - User rejection → `WalletError`
   - Transaction revert → `RpcError` with revert reason
   - Network failure → `TransportError`

8. **Testing wallet flows**
   - Mock WalletProviderService with `Layer.succeed`
   - Simulate user approval/rejection

**Key examples**: Full wallet connect + transaction flow

---

### Guide: Transaction Lifecycle
**File**: `guides/transaction-lifecycle.mdx`

**Content**:
1. **Overview**
   - Submit transaction → get hash
   - Poll for receipt → wait for confirmation
   - TransactionService handles polling automatically

2. **Submit and wait**
   ```typescript
   const tx = yield* TransactionService;
   const receipt = yield* tx.sendInvokeAndWait({
     calls: [{ contract_address, entry_point, calldata }],
     pollInterval: "2 seconds",
     maxAttempts: 30
   });
   ```

3. **Manual polling**
   ```typescript
   const txHash = yield* wallet.execute([call]);
   const receipt = yield* tx.waitForReceipt(txHash, {
     pollInterval: "2 seconds",
     maxAttempts: 30
   });
   ```

4. **Receipt status**
   - `ACCEPTED_ON_L2` - Confirmed on L2
   - `ACCEPTED_ON_L1` - Confirmed on L1 (finalized)
   - `REJECTED` - Transaction failed

5. **Error scenarios**
   - Transaction not found → retry
   - Transaction reverted → RpcError with revert reason
   - Timeout → TransactionError after maxAttempts

6. **Fee estimation**
   ```typescript
   const feeEstimator = yield* FeeEstimatorService;
   const estimate = yield* feeEstimator.estimateFee([tx]);
   ```

7. **Nonce management**
   - NonceManagerService tracks nonces automatically
   - Handles concurrent transactions from same account

**Visual aids**: Transaction state diagram

---

### Guide: Working with Presets
**File**: `guides/working-with-presets.mdx`

**Content**:
1. **What are presets?**
   - Pre-composed layers for common configurations
   - Mainnet, Sepolia, Devnet out of the box
   - Wallet stacks for browser integration

2. **Provider presets**
   ```typescript
   Presets.MainnetProvider()
   Presets.SepoliaProvider()
   Presets.DevnetProvider()
   Presets.createProvider(url, options)
   Presets.createFallbackProvider([
     { url: "https://primary.com", priority: 1 },
     { url: "https://fallback.com", priority: 2 }
   ])
   ```

3. **Wallet stack presets**
   ```typescript
   Presets.MainnetWalletBaseStack({ swo })
   // Provides: ProviderService, WalletProviderService, ContractService,
   //           NonceManagerService, FeeEstimatorService, ChainService

   Presets.MainnetWalletStack({ swo })
   // Adds: TransactionService, ContractWriteService
   ```

4. **When to use each**
   - **Provider presets** - Read-only operations (block queries, contract reads)
   - **WalletBaseStack** - Wallet + reads + fee estimation
   - **WalletStack** - Full wallet integration with transaction handling

5. **Customizing presets**
   ```typescript
   const customStack = Layer.mergeAll(
     Presets.SepoliaProvider(),
     MyCustomServiceLive
   );
   ```

6. **Environment-based selection**
   ```typescript
   const getProvider = (network: string) => {
     switch (network) {
       case "mainnet": return Presets.MainnetProvider();
       case "sepolia": return Presets.SepoliaProvider();
       case "devnet": return Presets.DevnetProvider();
     }
   };
   ```

**Best practices**: Start with presets, customize only when needed

---

### Guide: Custom Provider Configuration
**File**: `guides/custom-provider-config.mdx`

**Content**:
1. **Why customize?**
   - Private RPC endpoint
   - Custom retry logic
   - Request/response logging
   - Rate limiting

2. **Building from scratch**
   ```typescript
   import { Services } from "@kundera-sn/kundera-effect";

   const customProvider = Layer.mergeAll(
     Services.HttpTransportLive("https://my-node.com", {
       timeout: 30000,
       headers: { "x-api-key": "..." }
     }),
     Services.ProviderLive
   );
   ```

3. **Adding interceptors**
   ```typescript
   const withLogging = Services.withRequestInterceptor((ctx) => {
     console.log(`[${ctx.method}]`, ctx.params);
     return ctx;
   });

   const program = JsonRpc.blockNumber().pipe(
     withLogging,
     Effect.provide(customProvider)
   );
   ```

4. **Custom retry policy**
   ```typescript
   import { Schedule } from "effect";

   const aggressiveRetry = Services.withRetrySchedule(
     Schedule.exponential("50 millis").pipe(
       Schedule.intersect(Schedule.recurs(5))
     )
   );
   ```

5. **Fallback provider with custom health check**
   ```typescript
   const fallback = Presets.createFallbackProvider([
     { url: "https://primary.com", priority: 1, weight: 2 },
     { url: "https://secondary.com", priority: 2, weight: 1 }
   ]);
   ```

6. **WebSocket provider**
   ```typescript
   const wsProvider = Services.WebSocketProviderLive("wss://my-node.com");
   ```

**Prerequisites**: Understanding of services and layers

---

### Guide: Testing with Mocks
**File**: `guides/testing-with-mocks.mdx`

**Content**:
1. **Testing philosophy**
   - Mock services, not HTTP
   - Use `@effect/vitest` for Effect-native testing
   - Provide test layers instead of monkey-patching

2. **Basic mock pattern**
   ```typescript
   import { describe, expect, it } from "@effect/vitest";

   const TestProvider = Layer.succeed(ProviderService, {
     request: (method, params) => Effect.succeed({ result: "mock" })
   });

   it.effect("calls provider", () =>
     Effect.gen(function* () {
       const result = yield* JsonRpc.blockNumber();
       expect(result).toBe(42);
     }).pipe(Effect.provide(TestProvider))
   );
   ```

3. **Using TestTransport**
   ```typescript
   import { TestTransport } from "@kundera-sn/kundera-effect/testing";

   const mockTransport = TestTransport([
     { method: "starknet_blockNumber", result: 100 },
     { method: "starknet_chainId", result: "0x534e5f4d41494e" }
   ]);
   ```

4. **Mocking wallet interactions**
   ```typescript
   const TestWallet = Layer.succeed(WalletProviderService, {
     requestAccounts: () => Effect.succeed(["0xUSER"]),
     execute: (calls) => Effect.succeed("0xTXHASH")
   });
   ```

5. **Mocking contract calls**
   ```typescript
   const TestContract = Layer.succeed(ContractService, {
     readContract: ({ functionName }) => {
       if (functionName === "balanceOf") {
         return Effect.succeed(1000n);
       }
       return Effect.fail(new ContractError({ ... }));
     }
   });
   ```

6. **Testing error paths**
   ```typescript
   const FailingProvider = Layer.succeed(ProviderService, {
     request: () => Effect.fail(new RpcError({
       method: "starknet_call",
       code: CONTRACT_ERROR,
       message: "execution reverted"
     }))
   });
   ```

7. **Snapshot testing with receipts**
   ```typescript
   const receipt = yield* tx.waitForReceipt(txHash);
   expect(receipt).toMatchSnapshot();
   ```

**Prerequisites**: Basic vitest knowledge, Effect.gen understanding

---

## API Reference (Per-Service Pages)

### Template for each service page:

#### Service: [ServiceName]
**File**: `services/[service-name].mdx`

**Structure**:
1. **Overview** (2-3 sentences)
   - What this service does
   - When to use it
   - Dependencies

2. **Import**
   ```typescript
   import { Services } from "@kundera-sn/kundera-effect";
   ```

3. **Shape type**
   ```typescript
   export interface FooServiceShape {
     readonly doThing: (input: A) => Effect.Effect<B, FooError>;
   }
   ```

4. **Layer**
   - `Services.FooLive` - constructor signature
   - Required dependencies (in type)

5. **Usage**
   ```typescript
   const program = Effect.gen(function* () {
     const foo = yield* FooService;
     return yield* foo.doThing(input);
   });
   ```

6. **Error types**
   - List all possible errors from this service
   - Link to error handling guide

7. **Methods** (for each method on ServiceShape)
   - Signature
   - Parameters
   - Return type
   - Example
   - Error cases

8. **Related services**
   - Links to dependencies
   - Links to consumers

---

### Specific Service Pages

#### WalletProviderService
**File**: `services/wallet-provider.mdx`

**Content**:
- Shape: `requestAccounts`, `execute`, `signMessage` (if supported)
- Layer: `WalletProviderLive(swo: StarknetWindowObject)`
- Dependencies: None (wraps browser wallet directly)
- Errors: `WalletError` (user rejection, no wallet, disconnected)
- Example: Full wallet connection flow
- Related: ContractWriteService, TransactionService

#### TransactionService
**File**: `services/transaction.mdx`

**Content**:
- Shape: `sendInvokeAndWait`, `waitForReceipt`
- Layer: `TransactionLive` (requires ProviderService, WalletProviderService)
- Errors: `TransactionError`, `RpcError`, `TransportError`
- Example: Submit transaction and poll for receipt
- Configuration: `pollInterval`, `maxAttempts`
- Related: WalletProviderService, ContractWriteService

#### ChainService
**File**: `services/chain.mdx`

**Content**:
- Shape: `getChainId`, `getNetworkName`
- Layer: `ChainLive({ rpcUrl })` (requires ProviderService)
- Caching: ChainId is cached after first fetch (FiberRef pattern)
- Errors: `TransportError`, `RpcError`
- Example: Network detection
- Related: All services that need chain-specific logic

#### TransportService
**File**: `services/transport.mdx`

**Content**:
- Shape: `request(method, params, options)` - low-level transport
- Layer: `HttpTransportLive(url, options)`, `WebSocketTransportLive(url, options)`
- Configuration: timeout, headers, retry, interceptors
- Errors: `TransportError` (network, timeout, connection refused)
- FiberRef policies: `withTimeout`, `withRetries`, etc.
- Example: Direct transport usage (rare - usually use ProviderService)
- Related: ProviderService (consumer)

---

## Module Documentation

### JsonRpc Module
**File**: `modules/jsonrpc.mdx`

**Content**:
1. **Overview**
   - Free functions for JSON-RPC operations
   - All return `Effect<T, TransportError | RpcError, ProviderService>`
   - Thin wrappers over ProviderService.request

2. **Read operations** (grouped)
   - Chain info: `specVersion`, `chainId`, `blockNumber`, `blockHashAndNumber`, `syncing`
   - Blocks: `getBlockWithTxHashes`, `getBlockWithTxs`, `getBlockWithReceipts`, `getBlockTransactionCount`
   - State: `getStorageAt`, `getNonce`, `getStateUpdate`, `getStorageProof`
   - Contracts: `call`, `getClass`, `getClassAt`, `getClassHashAt`
   - Transactions: `getTransactionByHash`, `getTransactionByBlockIdAndIndex`, `getTransactionReceipt`, `getTransactionStatus`, `getMessagesStatus`
   - Events: `getEvents`
   - Tracing: `traceTransaction`, `traceBlockTransactions`

3. **Write operations**
   - `addInvokeTransaction`, `addDeclareTransaction`, `addDeployAccountTransaction`
   - Note: Prefer WalletProviderService or AccountService for writes

4. **Simulation & estimation**
   - `simulateTransactions`, `estimateFee`, `estimateMessageFee`

5. **Usage pattern**
   ```typescript
   const result = yield* JsonRpc.blockNumber();
   const block = yield* JsonRpc.getBlockWithTxs("latest");
   ```

6. **Request options**
   - All functions accept optional `RequestOptions` as last parameter
   - Timeout, retry, tracing applied via FiberRef policies

7. **Reference table** (all 31 methods with signature + description)

**Key insight**: JsonRpc is for direct RPC access - services provide higher-level abstractions

---

### Primitives Module
**File**: `modules/primitives.mdx`

**Content**:
1. **Overview**
   - Effect Schema wrappers for kundera-ts primitives
   - Validation at trust boundaries (user input, API responses)
   - Namespaced exports: `Primitives.Felt252.Hex`, `Primitives.ContractAddress.Hex`

2. **Available schemas**
   - `Felt252.Hex` - validates hex strings, returns `Felt252Type`
   - `ContractAddress.Hex` - validates contract address hex
   - `StorageKey.Hex` - validates storage key hex
   - `ClassHash.Hex` - validates class hash hex

3. **Usage with Schema.decodeUnknown**
   ```typescript
   import * as S from "effect/Schema";
   import { Primitives } from "@kundera-sn/kundera-effect";

   const address = yield* S.decodeUnknown(Primitives.ContractAddress.Hex)(
     "0x123..."
   );
   ```

4. **Decode helpers**
   ```typescript
   const address = yield* decodeContractAddress("0x...");
   const felt = yield* decodeFelt252("0x...");
   ```

5. **Format helpers**
   ```typescript
   formatContractAddress(addr); // 0x1234...5678 (truncated)
   formatFelt252(felt);         // 0x...
   ```

6. **When to use**
   - API boundaries (HTTP request/response)
   - User input forms
   - Config file parsing
   - NOT needed for internal type-safe flows

**Key insight**: Validation at edges, trust in the middle

---

### Presets Module
**File**: `modules/presets.mdx`

**Content**:
1. **Overview**
   - Pre-composed layers for common configurations
   - Network-specific URLs (mainnet, sepolia, devnet)
   - Wallet stacks for browser integration

2. **Provider presets**
   - `MainnetProvider(options?)` - https://starknet-mainnet.public.blastapi.io/rpc/v0_8
   - `SepoliaProvider(options?)` - https://starknet-sepolia.public.blastapi.io/rpc/v0_8
   - `DevnetProvider(options?)` - http://127.0.0.1:5050/rpc
   - `createProvider(url, options)` - Custom HTTP provider
   - `createFallbackProvider(endpoints)` - Multi-endpoint fallback

3. **Wallet stacks**
   - `MainnetWalletBaseStack({ swo, rpcUrl?, rpcTransportOptions? })`
   - `MainnetWalletStack({ swo, rpcUrl?, rpcTransportOptions? })`
   - Sepolia and Devnet variants

4. **Stack composition**
   - **BaseStack**: Provider + Wallet + Contract + Nonce + Fee + Chain
   - **FullStack**: BaseStack + Transaction + ContractWrite

5. **Decision tree**
   ```
   Read-only operations? → Provider presets
   Wallet integration?
     ├─ Only reads + fee estimation? → WalletBaseStack
     └─ Reads + writes? → WalletStack (full)
   ```

6. **Usage examples** for each preset

**Visual aids**: Decision tree diagram

---

## Examples Section

### What Example Apps to Reference

1. **kundera-effect-cli** (EXISTS)
   - Location: `examples/kundera-effect-cli/`
   - What it shows: CLI app using JsonRpc for read operations
   - Commands: block-number, chain-id, block, balance, nonce, class-hash, storage, tx, tx-status, tx-receipt
   - Link in docs: "See kundera-effect-cli for complete CLI implementation"

2. **Future examples to add**
   - **wallet-connect-demo** - Full browser wallet integration flow
   - **contract-reader** - ContractRegistry usage with multiple contracts
   - **event-monitor** - Event filtering and continuous polling
   - **transaction-bot** - Automated transaction submission (once AccountService exists)

### How to Reference Examples in Docs

In every guide, include:
```markdown
<Tip>
**Example**: See this pattern in action in [kundera-effect-cli](https://github.com/kundera-sn/kundera/tree/master/examples/kundera-effect-cli).
</Tip>
```

---

## Writing Guidelines

### Tone
- **Technical but approachable** - assume competence, avoid condescension
- **Direct and concise** - no marketing fluff ("powerful", "seamless", "cutting-edge")
- **Imperative voice** - "Use X to do Y", not "You can use X"
- **Active voice** - "TransactionService polls for receipts", not "Receipts are polled by TransactionService"

### Code Style
1. **Always show imports**
   ```typescript
   import { Effect } from "effect";
   import { Services } from "@kundera-sn/kundera-effect";
   ```

2. **Use Effect.gen, not pipe-heavy code** (easier to read)
   ```typescript
   // Good
   const program = Effect.gen(function* () {
     const result = yield* someEffect;
     return result;
   });

   // Avoid (hard to read for beginners)
   const program = someEffect.pipe(
     Effect.flatMap((x) => anotherEffect(x)),
     Effect.map((y) => transform(y))
   );
   ```

3. **Show complete runnable examples**
   - Include imports
   - Include layer provision
   - Include Effect.runPromise at the end
   - Comment what each step does

4. **Type annotations for clarity**
   ```typescript
   const address: ContractAddressType = yield* decodeContractAddress("0x...");
   ```

5. **Realistic data**
   - Use actual Starknet addresses (not "0x123")
   - Use actual mainnet/sepolia RPC URLs
   - Use actual ABIs (even if shortened)

### What to Show vs Skip

**Always show**:
- Error handling (even if brief)
- Layer provision
- Import statements
- Type annotations for non-obvious types

**Skip**:
- Exhaustive parameter documentation (link to TypeDoc)
- Implementation details of services (focus on usage)
- Edge cases unless critical for correctness

### Structure of Code Examples

```typescript
// 1. Imports
import { Effect } from "effect";
import { Services, JsonRpc } from "@kundera-sn/kundera-effect";

// 2. Setup (if needed)
const stack = Presets.SepoliaProvider();

// 3. Program logic
const program = Effect.gen(function* () {
  // 4. Service access
  const result = yield* JsonRpc.blockNumber();

  // 5. Error handling (if relevant)
  return result;
}).pipe(
  // 6. Error handling (alternate style)
  Effect.catchTags({
    TransportError: (e) => Effect.succeed(-1)
  }),
  // 7. Layer provision
  Effect.provide(stack)
);

// 8. Execution
const blockNum = await Effect.runPromise(program);
console.log(blockNum);
```

### Linking Strategy

1. **Internal links**
   - Relative MDX paths: `[ContractService](/effect/services/contract)`
   - Anchor links for sections: `[Error Types](#error-types)`

2. **External links**
   - Effect docs: `[Effect.gen](https://effect.website/docs/effect/Effect#gen)`
   - Starknet docs: `[Starknet JSON-RPC](https://github.com/starkware-libs/starknet-specs)`
   - kundera-ts: `[@kundera-sn/kundera-ts](https://kundera.dev/typescript)`

3. **Cross-package links**
   - Link to kundera-ts primitives when relevant
   - Link to voltaire-effect for Effect pattern reference

### Callout Usage

```markdown
<Info>
Background information or context.
</Info>

<Tip>
Best practice or recommendation.
</Tip>

<Warning>
Common pitfall or mistake to avoid.
</Warning>

<Note>
Future feature or limitation.
</Note>
```

**Use sparingly** - callouts should highlight critical info, not repeat body text.

---

## Documentation Workflow

### Phase 1: Core Docs (MVP for 1.0)
1. Getting Started (installation, quickstart, first request)
2. Concepts (services/layers, error handling)
3. Top 3 guides (reading contracts, wallet integration, testing)
4. Service pages for ProviderService, WalletProviderService, ContractService

**Goal**: Users can read contracts, connect wallets, write tests

### Phase 2: Complete Service Docs
5. All remaining service pages (Transaction, Chain, FeeEstimator, NonceManager, ContractWrite, Transport)
6. Module docs (JsonRpc, Primitives, Presets)

**Goal**: Full API surface documented

### Phase 3: Advanced Guides
7. Transaction lifecycle guide
8. Custom provider configuration
9. Request policies deep dive
10. Wallet vs Account concept doc (prep for AccountService)

**Goal**: Advanced users can customize everything

### Phase 4: Polish
11. API reference (generated from TypeDoc)
12. Additional examples (wallet-connect-demo, event-monitor)
13. Migration guide (from starknet.js, from get-starknet)

**Goal**: Production-ready documentation

---

## Success Metrics

### Qualitative
- User can read a contract in <5 minutes (from npm install to result)
- User understands error types without reading source code
- User knows which service to use for their use case
- User can test their code with mocks

### Quantitative
- <3 clicks from homepage to any guide
- Every service has a working code example
- Every error type has a catch handler example
- 100% of public API has JSDoc comments

---

## Open Questions

1. **AccountService priority** - Do we document the gap prominently or wait until implemented?
   - **Recommendation**: Document the gap in "Wallet vs Account" concept page, link to GitHub issue

2. **Subscription streams** - How much to mention `starknet_subscribe*` methods?
   - **Recommendation**: Mention in JsonRpc module docs, note "deferred until Effect.Stream integration"

3. **Migration guides** - Do we need starknet.js → kundera-effect migration docs?
   - **Recommendation**: Post-1.0, but mention key differences in quickstart

4. **Video tutorials** - Should we create video walkthroughs?
   - **Recommendation**: Not for MVP, but useful for marketing

5. **Interactive playground** - Embed code playground in docs?
   - **Recommendation**: Nice to have, not essential. Link to StackBlitz/CodeSandbox examples instead
