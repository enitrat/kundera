# Missing Primitives & Services Audit

## What Exists (verified)

### Services ✓
- **TransportService** - HTTP/WebSocket transport with interceptors, retries, timeout, tracing
- **ProviderService** - JSON-RPC request/response wrapper over TransportService
- **WalletProviderService** - Browser wallet integration (StarknetWindowObject)
- **ChainService** - Chain ID and network name resolution
- **ContractService** - Read-only contract calls with ABI encoding/decoding
- **ContractWriteService** - Write contract calls via wallet
- **FeeEstimatorService** - Fee estimation for transactions
- **NonceManagerService** - Nonce tracking and management
- **TransactionService** - Transaction submission and receipt polling
- **ContractRegistry** - Type-safe contract registry builder (not a service, utility)

### JSON-RPC Wrappers ✓
All wrapped in `jsonrpc/index.ts`:
- `specVersion` - starknet_specVersion
- `chainId` - starknet_chainId
- `blockNumber` - starknet_blockNumber
- `blockHashAndNumber` - starknet_blockHashAndNumber
- `syncing` - starknet_syncing
- `call` - starknet_call
- `estimateFee` - starknet_estimateFee
- `estimateMessageFee` - starknet_estimateMessageFee
- `getStateUpdate` - starknet_getStateUpdate
- `getBlockTransactionCount` - starknet_getBlockTransactionCount
- `getStorageAt` - starknet_getStorageAt
- `getNonce` - starknet_getNonce
- `getClassHashAt` - starknet_getClassHashAt
- `getClassAt` - starknet_getClassAt
- `getClass` - starknet_getClass
- `getBlockWithTxHashes` - starknet_getBlockWithTxHashes
- `getBlockWithTxs` - starknet_getBlockWithTxs
- `getBlockWithReceipts` - starknet_getBlockWithReceipts
- `getTransactionByHash` - starknet_getTransactionByHash
- `getTransactionByBlockIdAndIndex` - starknet_getTransactionByBlockIdAndIndex
- `getTransactionReceipt` - starknet_getTransactionReceipt
- `getTransactionStatus` - starknet_getTransactionStatus
- `getMessagesStatus` - starknet_getMessagesStatus
- `getEvents` - starknet_getEvents
- `getStorageProof` - starknet_getStorageProof
- `addInvokeTransaction` - starknet_addInvokeTransaction
- `addDeclareTransaction` - starknet_addDeclareTransaction
- `addDeployAccountTransaction` - starknet_addDeployAccountTransaction
- `simulateTransactions` - starknet_simulateTransactions
- `traceTransaction` - starknet_traceTransaction
- `traceBlockTransactions` - starknet_traceBlockTransactions

### Presets ✓
- `MainnetProvider(options?)` - HTTP provider for mainnet
- `SepoliaProvider(options?)` - HTTP provider for Sepolia testnet
- `DevnetProvider(options?)` - HTTP provider for local devnet
- `createProvider(url, options)` - Custom HTTP provider
- `createFallbackProvider(endpoints)` - Fallback provider with multiple endpoints
- `MainnetWalletBaseStack(options)` - Mainnet wallet base (provider + wallet + contract + nonce + fee + chain)
- `SepoliaWalletBaseStack(options)` - Sepolia wallet base stack
- `DevnetWalletBaseStack(options)` - Devnet wallet base stack
- `MainnetWalletStack(options)` - Mainnet wallet full stack (base + transaction + contract write)
- `SepoliaWalletStack(options)` - Sepolia wallet full stack
- `DevnetWalletStack(options)` - Devnet wallet full stack

### Error Types ✓
- `TransportError` - Transport failures (network, timeout, connection)
- `RpcError` - JSON-RPC errors (invalid params, method not found, contract revert)
- `WalletError` - Wallet interaction failures (user rejection, no wallet)
- `TransactionError` - Transaction submission/receipt failures
- `NonceError` - Nonce management issues
- `ContractError` - ABI encoding/decoding or contract call failures

### Primitives/Schemas ✓
- `Schema.Felt252.Hex` - Effect Schema for Felt252 hex validation
- `Schema.ContractAddress.Hex` - Effect Schema for ContractAddress hex validation
- `Schema.StorageKey.Hex` - Effect Schema for StorageKey hex validation
- `Schema.ClassHash.Hex` - Effect Schema for ClassHash hex validation
- Namespace exports: `Felt252.Hex`, `ContractAddress.Hex`, etc.
- Helper functions: `decodeContractAddress`, `decodeStorageKey`, `decodeFelt252`, `decodeClassHash`
- Format functions: `formatContractAddress`, `formatFelt252`, etc.

### Testing Utilities ✓
- `TestTransport` - Mock transport for testing
- `TestProvider` - Mock provider for testing
- Located in `testing/` module

### Examples ✓
- `kundera-effect-cli` - CLI app demonstrating usage (commands: block-number, chain-id, block, balance, nonce, class-hash, storage, tx, tx-status, tx-receipt)

---

## Missing RPC Wrappers

**None** - All 37 Starknet JSON-RPC methods have wrappers in `jsonrpc/index.ts`.

**Note on subscriptions**: The 5 subscription methods (`starknet_subscribe*`, `starknet_unsubscribe`) are intentionally deferred. Comment in code states:
> "Subscription RPC methods are intentionally deferred. These methods are push-based and should be exposed as `Effect.Stream` wrappers once a WebSocket subscription API is added."

This is correct - subscriptions need `Effect.Stream` not one-shot Effects.

---

## Missing Services

### 1. AccountService (HIGH PRIORITY)
**Why needed**: Direct account abstraction support for signing and sending transactions without browser wallet dependency.

**What it should provide**:
- Deploy account from private key
- Sign transactions
- Execute transactions
- Multi-call support
- Nonce management integration

**Usage pattern**:
```typescript
const program = Effect.gen(function* () {
  const account = yield* AccountService;
  const result = yield* account.execute([
    { contract_address, entry_point, calldata }
  ]);
  return result;
});
```

**Note**: This is the biggest gap. Users need programmatic signing, not just wallet-based flows.

### 2. EventService (MEDIUM PRIORITY)
**Why needed**: Event filtering and subscription is a common pattern. While `getEvents` exists, a service could add:
- Continuous event polling with Effect.Stream
- Event filtering helpers
- Type-safe event decoding from ABI

**What it should provide**:
```typescript
const events = yield* EventService;
const stream = events.watchEvents({
  address: contractAddr,
  eventName: "Transfer",
  abi: erc20Abi
});
```

### 3. BatchService (LOW PRIORITY)
**Why needed**: Optimize multiple read calls into a single RPC batch request.

**What it should provide**:
- Queue multiple `call` requests
- Send as single JSON-RPC batch
- Return array of results

**Note**: Can be built on top of existing ProviderService. Not critical since HTTP pipelining handles most cases.

---

## Missing Presets

### 1. TestProvider Preset (MEDIUM PRIORITY)
**Why needed**: Testing documentation shows `TestTransport` and `TestProvider` exist but there's no preset for common test scenarios.

**What it should provide**:
```typescript
export const TestProviderPreset = (mockResponses: MockResponse[]) =>
  Layer.mergeAll(
    TestTransport(mockResponses),
    ProviderLive
  );
```

### 2. FallbackProviderFromUrls Preset (EXISTS but not documented)
**Status**: Code shows `FallbackHttpProviderFromUrls` exists in services/index.ts but not re-exported in presets.

**Fix needed**: Add to presets/index.ts:
```typescript
export const FallbackProvider = FallbackHttpProviderFromUrls;
```

---

## Missing Error Types

**None identified**. Current error types cover all failure modes:
- Network/transport failures → TransportError
- RPC protocol errors → RpcError
- Wallet interactions → WalletError
- Transaction lifecycle → TransactionError
- Nonce issues → NonceError
- Contract ABI/calls → ContractError

---

## Missing Primitives/Schemas

### 1. Domain Primitives (LOW PRIORITY)
kundera-ts has domain primitives (BlockHeader, Block, Transaction, Receipt, Event, StateUpdate, FeeEstimate, Trace) with `fromRpc.js` converters.

**Status**: kundera-effect doesn't wrap these with Effect Schema yet.

**Why low priority**: Users can import directly from kundera-ts. Effect Schema wrappers would add validation but aren't critical for core workflows.

**If implemented**: Add to `primitives/schema/`:
- `BlockHeader.ts` - Effect Schema wrapper
- `Transaction.ts` - Effect Schema wrapper
- `Receipt.ts` - Effect Schema wrapper
- etc.

### 2. Uint256/Uint128 Schemas (LOW PRIORITY)
Common Cairo types but users can validate inline with Schema.compose.

---

## Priority Ranking

### P0 (Critical - Blocks Core Use Cases)
1. **AccountService** - Non-wallet signing and transaction execution
   - Impact: Without this, kundera-effect is wallet-only. Server-side use cases blocked.
   - Effort: Medium (wrap kundera-ts account, integrate with existing services)

### P1 (High Value - Significant UX Improvement)
2. **TestProvider Preset** - Easier testing setup
   - Impact: Reduces boilerplate in tests
   - Effort: Low (compose existing TestTransport + ProviderLive)

3. **EventService with Stream support** - Continuous event monitoring
   - Impact: Common pattern (DEX monitoring, wallet tracking)
   - Effort: Medium (Effect.Stream + polling loop)

### P2 (Nice to Have - Quality of Life)
4. **FallbackProviderFromUrls preset export** - Already exists, just needs export
   - Impact: Discoverability
   - Effort: Trivial

5. **BatchService** - Optimize multiple reads
   - Impact: Performance for multi-call scenarios
   - Effort: Medium (batch queue + flush)

### P3 (Future Enhancements)
6. **Domain Primitive Schemas** - Effect Schema wrappers for Block, Transaction, etc.
   - Impact: Type safety at decode boundary
   - Effort: High (8 primitives × 3 files each)

7. **Subscription Stream wrappers** - Effect.Stream for starknet_subscribe* methods
   - Impact: Real-time event/block subscriptions
   - Effort: High (WebSocket lifecycle + Effect.Stream + backpressure)

---

## Recommendations

### Immediate Action (Before 1.0)
- Implement **AccountService** - this is the biggest gap blocking non-wallet use cases
- Add **TestProvider preset** - improves DX for testing

### Post-1.0
- Add **EventService with streaming** once WebSocket subscriptions are stable
- Consider **BatchService** if performance becomes an issue

### Not Needed Now
- Domain primitive schemas - users can import from kundera-ts directly
- Subscription streams - defer until WebSocket subscription patterns stabilize in Starknet ecosystem
