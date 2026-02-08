# Voltaire-Effect: Consumer-Facing API & Usage Patterns

Deep-dive analysis of the voltaire-effect library's consumer API, based on the cheatsheet, all 13 example docs, the getting-started guide, layers doc, recipes, provider service doc, testing doc, and the main entry point (`src/index.ts`).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Package Exports & Entry Points](#2-package-exports--entry-points)
3. [Core Pattern: Decode-Use-Provide](#3-core-pattern-decode-use-provide)
4. [Creating a Client/Provider](#4-creating-a-clientprovider)
5. [Making RPC Calls (Free Functions)](#5-making-rpc-calls-free-functions)
6. [Error Handling](#6-error-handling)
7. [Schema Validation (Branded Types)](#7-schema-validation-branded-types)
8. [Layer Composition Patterns](#8-layer-composition-patterns)
9. [Contract Interactions](#9-contract-interactions)
10. [Stream / Subscription Patterns](#10-stream--subscription-patterns)
11. [Batch / Multicall Patterns](#11-batch--multicall-patterns)
12. [Transaction Signing & Sending](#12-transaction-signing--sending)
13. [Wallet Creation (HD Wallet)](#13-wallet-creation-hd-wallet)
14. [Testing Patterns](#14-testing-patterns)
15. [Retry, Timeout, Resilience](#15-retry-timeout-resilience)
16. [Layer Presets (Multi-Chain)](#16-layer-presets-multi-chain)
17. [Complete End-to-End Examples](#17-complete-end-to-end-examples)
18. [Key Differences from kundera-effect (Starknet)](#18-key-differences-from-kundera-effect-starknet)

---

## 1. Architecture Overview

voltaire-effect organizes functionality into **three layers**:

| Layer | Purpose | Use When |
|-------|---------|----------|
| **Schema** | Validation, type coercion via `effect/Schema` | Parsing user input, API responses |
| **Effect** | Composable operations | Chaining transformations, error handling |
| **Services** | Stateful resources (Provider, Signer, etc.) | Provider calls, wallet signing |

Key services:
- `ProviderService` / `Provider` - JSON-RPC request layer, used by free functions
- `SignerService` / `Signer` - Signs & sends transactions
- `AccountService` - Local or JSON-RPC account abstraction
- `TransportService` - HTTP, WebSocket, Browser transports
- `CryptoLive` / `CryptoTest` - All crypto services bundled
- `DebugService` / `EngineApiService` - Advanced node APIs
- `BlockStreamService` / `EventStream` - Streaming services

---

## 2. Package Exports & Entry Points

### Subpath exports (package.json)

```
"."           -> main entry (everything)
"./primitives" -> schema wrappers for all Ethereum types
"./crypto"     -> crypto service modules
"./services"   -> service definitions and implementations
"./native"     -> native FFI implementations
"./jsonrpc"    -> JSON-RPC types and schemas
```

### Main entry (`src/index.ts`)

The main entry re-exports:
- **Primitives** as namespace exports: `Address`, `Hex`, `Hash`, `Block`, `Transaction`, `Uint`, etc. (~150+ namespaces)
- **Crypto** as namespace exports: `Keccak256`, `Secp256k1`, `SHA256`, `Bip39`, `HDWallet`, `EIP712`, etc.
- **Services** via barrel: `Provider`, `Signer`, `Contract`, `HttpTransport`, `TestTransport`, all free functions, etc.
- **Standards**: `ERC20`, `ERC721`, `ERC1155`, `ERC165`
- **Utilities**: `Stream`, `Unit`, `Auth`, `BlockUtils`
- **Error types**: `TransportError`, `ContractCallError`, `MulticallError`, etc.

### Import patterns

```typescript
// Free functions + services from main
import { getBlockNumber, getBalance, Provider, HttpTransport } from 'voltaire-effect'

// Primitives from subpath
import * as Address from 'voltaire-effect/primitives/Address'

// Crypto from subpath
import { Secp256k1Live, KeccakLive } from 'voltaire-effect/crypto'

// Services from subpath
import { makeBlockStream } from 'voltaire-effect/services'

// Or from main entry
import { Effect, Layer, Schedule } from 'effect'
import * as S from 'effect/Schema'
```

---

## 3. Core Pattern: Decode-Use-Provide

The fundamental usage pattern is **Decode -> Use -> Provide**:

```typescript
import { Layer } from 'effect'

// 1. Compose layers (build the dependency graph)
const ProviderLayer = Provider.pipe(
  Layer.provide(HttpTransport('https://eth.llamarpc.com'))
)

// 2. Write your program using free functions
const program = Effect.gen(function* () {
  const addr = yield* S.decode(Address.Hex)(input)     // decode
  return yield* getBalance(addr, 'latest')             // use free function
})

// 3. Provide layers at the edge
await Effect.runPromise(program.pipe(Effect.provide(ProviderLayer)))
```

**Critical rule**: Always compose layers BEFORE providing. Never chain multiple `Effect.provide` calls.

```typescript
// WRONG - multiple provides
program.pipe(
  Effect.provide(Signer.Live),
  Effect.provide(Provider),
  Effect.provide(HttpTransport(rpcUrl))
)

// CORRECT - compose once, provide once
const AppLayer = Layer.mergeAll(Signer.Live, Provider).pipe(
  Layer.provide(HttpTransport(rpcUrl))
)
program.pipe(Effect.provide(AppLayer))
```

---

## 4. Creating a Client/Provider

### Simple HTTP Provider

```typescript
const ProviderLayer = Provider.pipe(
  Layer.provide(HttpTransport('https://eth.llamarpc.com'))
)
```

### HTTP with config

```typescript
const ProviderLayer = Provider.pipe(
  Layer.provide(HttpTransport({
    url: 'https://eth.llamarpc.com',
    timeout: '30 seconds',
    retrySchedule: Schedule.exponential('500 millis').pipe(
      Schedule.jittered,
      Schedule.compose(Schedule.recurs(5))
    )
  }))
)
```

### HTTP with batching

```typescript
HttpTransport({
  url: '...',
  batch: { batchSize: 50, wait: 10 }
})
```

### WebSocket

```typescript
WebSocketTransport('wss://eth.llamarpc.com')
```

### Browser (window.ethereum)

```typescript
BrowserTransport
```

### Provider factory helpers (presets)

```typescript
// One-liner presets
MainnetProvider('https://eth.llamarpc.com')
OptimismProvider('https://mainnet.optimism.io')
ArbitrumProvider('https://arb1.arbitrum.io/rpc')
BaseProvider('https://mainnet.base.org')

// Generic for any network
createProvider('https://rpc.ftm.tools')

// Full service stack (includes Chain, FeeEstimator, NonceManager, Cache)
MainnetFullProvider('https://eth.llamarpc.com')
```

---

## 5. Making RPC Calls (Free Functions)

voltaire-effect exposes all provider operations as **free functions** -- the idiomatic Effect.ts pattern. You do NOT need to yield a service first.

### Block queries

```typescript
yield* getBlockNumber()
yield* getBlock({ blockTag: 'latest' })
yield* getBlock({ blockTag: 'latest', includeTransactions: true })
yield* getBlock({ blockHash: '0x...' })
yield* getBlockReceipts({ blockTag: 'latest' })
```

### Account state

```typescript
yield* getBalance('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'latest')
yield* getTransactionCount('0x1234...')
yield* getCode('0x1234...')
yield* getStorageAt('0x1234...', '0x0')
```

### Transactions

```typescript
yield* getTransaction(txHash)
yield* getTransactionReceipt(txHash)
yield* waitForTransactionReceipt('0x1234...', { confirmations: 3, timeout: '60 seconds' })
```

### Logs

```typescript
yield* getLogs({
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  topics: [TRANSFER_TOPIC],
  fromBlock: '0x1312D00',
  toBlock: 'latest'
})
```

### Gas pricing

```typescript
yield* Effect.all({
  gasPrice: getGasPrice(),
  maxPriorityFee: getMaxPriorityFeePerGas(),
  feeHistory: getFeeHistory(4, 'latest', [25, 50, 75])
})
```

### Call & estimate

```typescript
yield* call({ to, data })
yield* estimateGas({ to, data, value })
```

### Contract reads (without Contract factory)

```typescript
yield* readContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: ['0x1234...']
})

// Multi-return
const [reserve0, reserve1, timestamp] = yield* readContract({
  address: pairAddress,
  abi: pairAbi,
  functionName: 'getReserves'
})
```

### Multicall (typed)

```typescript
const results = yield* multicall({
  contracts: [
    { address: daiAddress, abi: erc20Abi, functionName: 'balanceOf', args: [user] },
    { address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: [user] }
  ],
  allowFailure: true  // default
})
// results: [{ status: 'success', result: 1000n }, ...]
```

### Parallel queries (Effect.all)

```typescript
// Named (preferred for self-documenting code)
const { blockNumber, balance, chainId } = yield* Effect.all({
  blockNumber: getBlockNumber(),
  balance: getBalance(addr),
  chainId: getChainId()
})

// Collection with concurrency
yield* Effect.forEach(addresses, (addr) => getBalance(addr), { concurrency: 5 })
```

---

## 6. Error Handling

### Tagged errors (catch by tag)

```typescript
program.pipe(
  Effect.catchTag('TransportError', (e) => Effect.succeed(0n)),
  Effect.catchTag('ParseError', (e) => Effect.succeed(fallback)),
)

// Or multiple at once
program.pipe(
  Effect.catchTags({
    TransportError: () => Effect.succeed(0n),
    ProviderResponseError: () => Effect.succeed(0n),
    ContractCallError: () => Effect.fail(new Error('Read failed')),
    ContractWriteError: () => Effect.fail(new Error('Write failed')),
  })
)
```

### Error types available

- `TransportError` - RPC communication failure
- `ProviderResponseError` - Unexpected RPC response
- `ProviderNotFoundError` - Missing resource
- `ProviderValidationError` - Invalid ABI or function
- `ContractCallError` - Contract read failure
- `ContractWriteError` - Contract write failure
- `ContractEventError` - Event query failure
- `MulticallError` - Batch-level multicall failure
- `ParseError` - Schema validation failure
- `TimeoutException` - Timeout exceeded
- `SignerError` - Signing failure
- `AccountError` - Account operation failure
- `BlockStreamError` - Block streaming failure
- `InsufficientBalance` (custom user-defined)

### Custom error types

```typescript
class InsufficientBalance extends Data.TaggedError('InsufficientBalance')<{
  readonly required: bigint
  readonly available: bigint
}> {}

const program = Effect.gen(function* () {
  const balance = yield* getBalance(address, 'latest')
  if (balance < requiredAmount) {
    return yield* Effect.fail(new InsufficientBalance({ required: requiredAmount, available: balance }))
  }
  return balance
}).pipe(
  Effect.catchTag('InsufficientBalance', (e) => Effect.succeed(e.available))
)
```

### Fallback RPC pattern

```typescript
const primary = Effect.gen(function* () {
  return yield* getBlockNumber()
}).pipe(withTimeout('3 seconds'), Effect.provide(PrimaryLayer))

const backup = Effect.gen(function* () {
  return yield* getBlockNumber()
}).pipe(Effect.provide(BackupLayer))

const program = primary.pipe(Effect.orElse(() => backup))
```

### Graceful degradation with Option

```typescript
const balance = yield* getBalance(address, 'latest').pipe(
  Effect.map(Option.some),
  Effect.catchAll(() => Effect.succeed(Option.none()))
)
return { address, balance: Option.getOrElse(balance, () => 0n) }
```

### Inspect Exit

```typescript
const exit = await Effect.runPromiseExit(program)
Exit.match(exit, {
  onSuccess: (balance) => console.log('Balance:', balance),
  onFailure: (cause) => console.error('Error:', cause)
})
```

---

## 7. Schema Validation (Branded Types)

Schemas decode raw inputs into Voltaire branded types. Uses `effect/Schema`.

### Basic decode

```typescript
import * as Address from 'voltaire-effect/primitives/Address'
import * as S from 'effect/Schema'

// Sync decode (throws on failure)
const addr = S.decodeSync(Address.Hex)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')

// Effect-based decode (typed error)
const addr = yield* S.decode(Address.Hex)('0x...')

// Either-based decode (no throw)
const result = S.decodeEither(Address.Hex)('invalid-address')
Either.match(result, {
  onLeft: (error) => console.error('Invalid:', error),
  onRight: (addr) => console.log('Valid:', addr)
})
```

### Encoding (round-trip)

```typescript
const hex = S.encodeSync(Address.Hex)(addr)

// Checksummed encoding requires KeccakService
const checksummed = await Effect.runPromise(
  S.encode(Address.Checksummed)(addr).pipe(Effect.provide(KeccakLive))
)
```

### Various type schemas

```typescript
// Hex
const hex = S.decodeSync(Hex.String)('0x1234abcd')

// Uint256
const value = S.decodeSync(Uint.Uint256)('1000000000000000000')

// Block number
const blockNum = S.decodeSync(Block.Number)('0x1234')
const latest = S.decodeSync(Block.Tag)('latest')

// Transaction
const tx = S.decodeSync(Transaction.EIP1559Schema)({ ... })

// Address from bytes
const addr = yield* S.decode(Address.Bytes)(new Uint8Array(20).fill(1))
```

### Custom schema composition

```typescript
const TransferRequestSchema = S.Struct({
  from: Address.Hex,
  to: Address.Hex,
  amount: Uint.Uint256,
  memo: S.optional(S.String)
})

const request = S.decodeSync(TransferRequestSchema)({
  from: '0x742d35...',
  to: '0xd8dA6B...',
  amount: '1000000000000000000'
})
```

### Batch validation

```typescript
const program = Effect.gen(function* () {
  return yield* Effect.all(
    addresses.map(addr =>
      S.decode(Address.Hex)(addr).pipe(
        Effect.map(a => ({ address: addr, valid: true, parsed: a })),
        Effect.catchAll(() => Effect.succeed({ address: addr, valid: false, parsed: null }))
      )
    )
  )
})
```

---

## 8. Layer Composition Patterns

### Composition operators

| Pattern | Use When |
|---------|----------|
| `Layer.mergeAll(A, B, C)` | Independent layers (no deps between them) |
| `A.pipe(Layer.provide(B))` | A depends on B |
| `Layer.provideMerge(A, B)` | Add B's services while keeping A |

### Provider-only setup

```typescript
const ProviderLayer = Provider.pipe(
  Layer.provide(HttpTransport('https://eth.llamarpc.com'))
)
```

### Full signer stack

```typescript
const CryptoLayer = Layer.mergeAll(Secp256k1Live, KeccakLive)
const TransportLayer = HttpTransport('https://eth.llamarpc.com')
const DepsLayer = Layer.mergeAll(CryptoLayer, TransportLayer)
const SignerLayer = Signer.fromPrivateKey(privateKey, Provider).pipe(
  Layer.provide(DepsLayer)
)
```

### Full wallet setup from mnemonic

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
```

---

## 9. Contract Interactions

### Contract factory

```typescript
const erc20Abi = [
  { type: 'function', name: 'balanceOf', inputs: [...], outputs: [...], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'transfer', inputs: [...], outputs: [...], stateMutability: 'nonpayable' },
  { type: 'event', name: 'Transfer', inputs: [...] }
] as const

const token = yield* Contract('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', erc20Abi)
```

### Read operations

```typescript
yield* token.read.balanceOf('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
yield* token.read.symbol()
yield* token.read.decimals()

// Parallel reads
yield* Effect.all({
  symbol: token.read.symbol(),
  decimals: token.read.decimals(),
  balance: token.read.balanceOf(user)
})
```

### Write operations (requires Signer)

```typescript
yield* token.write.transfer('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 100_000_000n)
```

### Simulate (dry run before sending)

```typescript
yield* token.simulate.transfer('0x70997970...', 100_000_000n)
```

### Event queries

```typescript
yield* token.getEvents('Transfer', { fromBlock: 18000000n, toBlock: 18000100n })

// With indexed parameter filters
yield* usdc.getEvents('Transfer', {
  fromBlock: 18000000n,
  toBlock: 18100000n,
  args: { from: VITALIK }
})
```

### Complete ERC20 workflow

```typescript
const program = Effect.gen(function* () {
  const token = yield* Contract(usdcAddress, erc20Abi)

  const { symbol, decimals } = yield* Effect.all({
    symbol: token.read.symbol(),
    decimals: token.read.decimals()
  })
  const balanceBefore = yield* token.read.balanceOf(recipient)
  const txHash = yield* token.write.transfer(recipient, 100_000_000n)
  yield* waitForTransactionReceipt(txHash, { confirmations: 1 })
  const balanceAfter = yield* token.read.balanceOf(recipient)

  return { symbol, decimals, txHash, transferred: balanceAfter - balanceBefore }
}).pipe(Effect.provide(SignerLayer))
```

---

## 10. Stream / Subscription Patterns

### Block streaming

```typescript
import { makeBlockStream } from 'voltaire-effect/services'

const program = Effect.gen(function* () {
  const blockStream = yield* makeBlockStream()

  yield* Stream.runForEach(
    blockStream.watch({ include: 'transactions' }),
    (event) => {
      if (event.type === 'reorg') {
        return Effect.log(`Reorg! Removed ${event.removed.length} blocks`)
      }
      const block = event.blocks[0]
      return Effect.log(`Block ${block?.header.number}: ${block?.transactions.length} txs`)
    }
  )
}).pipe(Effect.provide(HttpTransport('https://eth.llamarpc.com')))
```

### Include levels

```typescript
blockStream.backfill({ fromBlock, toBlock, include: 'header' })       // fastest
blockStream.backfill({ fromBlock, toBlock, include: 'transactions' }) // with txs
blockStream.backfill({ fromBlock, toBlock, include: 'receipts' })     // most data
```

### Reorg handling

```typescript
yield* Stream.runForEach(
  blockStream.watch({ include: 'transactions' }),
  (event) => {
    if (event.type === 'reorg') {
      return Effect.gen(function* () {
        for (const removed of event.removed) {
          yield* Effect.log(`Rollback block ${removed.number}`)
        }
        for (const added of event.added) {
          yield* Effect.log(`Apply block ${added.header.number}`)
        }
        yield* Effect.log(`Common ancestor: ${event.commonAncestor.number}`)
      })
    }
    // Normal blocks...
    return Effect.void
  }
)
```

### Backfill + watch (historical to live)

```typescript
const backfill = blockStream.backfill({ fromBlock: 18000000n, toBlock: 'latest', include: 'header' })
const watch = blockStream.watch({ include: 'header' })
const combined = Stream.concat(backfill, watch)

yield* Stream.runForEach(Stream.take(combined, 200), (event) =>
  Effect.log(`Block batch: ${event.blocks.map(b => b.header.number).join(', ')}`)
)
```

### Stream processing with operators

```typescript
const summaries = blockStream.backfill({ fromBlock, toBlock, include: 'transactions' }).pipe(
  Stream.flatMap((event) => Stream.fromIterable(event.blocks)),
  Stream.map((block) => ({
    number: block.header.number,
    txCount: block.transactions.length,
    gasUsed: block.header.gasUsed,
  })),
  Stream.filter((b) => b.txCount > 0),
  Stream.take(50)
)
const results = yield* Stream.runCollect(summaries)
```

### Cancellation via Fiber

```typescript
const fiber = yield* Effect.fork(
  Stream.runForEach(
    blockStream.watch({ include: 'header' }),
    (event) => Effect.log(`Block ${event.blocks[0]?.header.number}`)
  )
)
yield* Effect.sleep("30 seconds")
yield* Fiber.interrupt(fiber)
```

### Event streaming (contract events)

```typescript
const usdc = yield* Contract(USDC_ADDRESS, transferAbi)

// Historical
const events = yield* usdc.getEvents('Transfer', {
  fromBlock: 18000000n,
  toBlock: 18000100n
})

// Live watching with BlockStream
yield* Stream.runForEach(
  blockStream.watch({ include: 'header' }),
  (event) => Effect.gen(function* () {
    for (const block of event.blocks) {
      const events = yield* usdc.getEvents('Transfer', {
        fromBlock: BigInt(block.header.number),
        toBlock: BigInt(block.header.number)
      })
      for (const ev of events) {
        yield* Effect.log(`LIVE: ${ev.args.from} -> ${ev.args.to} | ${ev.args.value}`)
      }
    }
  })
)
```

---

## 11. Batch / Multicall Patterns

### Low-level aggregate3

```typescript
import { aggregate3 } from 'voltaire-effect'
import * as ERC20 from 'voltaire-effect/standards/ERC20'

const calls = yield* Effect.forEach(addresses, (addr) =>
  Effect.map(
    ERC20.encodeBalanceOf(addr as `0x${string}`),
    (callData): MulticallCall => ({
      target: USDC,
      callData,
      allowFailure: true
    })
  )
)

const results = yield* aggregate3(calls)

// Process results
const balances = yield* Effect.forEach(results, (result, i) => {
  if (!result.success) {
    return Effect.succeed({ address: addresses[i], balance: null, error: 'Call failed' })
  }
  return Effect.map(
    ERC20.decodeUint256(result.returnData),
    (balance) => ({ address: addresses[i], balance, error: null })
  )
})
```

### High-level multicall (typed)

```typescript
const results = yield* multicall({
  contracts: [
    { address: daiAddress, abi: erc20Abi, functionName: 'balanceOf', args: [user] },
    { address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: [user] }
  ],
  allowFailure: true
})
```

### Either pattern for results

```typescript
const results = rawResults.map((result, i) =>
  result.success
    ? Either.right({ address: addresses[i], data: result.returnData })
    : Either.left({ address: addresses[i], message: 'Call failed' })
)

// Partition
const [failures, successes] = Array.partition(results, Either.isLeft)
```

---

## 12. Transaction Signing & Sending

### Simple ETH transfer

```typescript
const program = Effect.gen(function* () {
  const signer = yield* SignerService
  return yield* signer.sendTransaction({
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    value: 1000000000000000000n
  })
}).pipe(
  withTimeout('30 seconds'),
  Effect.provide(SignerLayer)
)
```

### EIP-1559 transaction

```typescript
yield* signer.sendTransaction({
  to: '0x70997970...',
  value: 1000000000000000000n,
  maxFeePerGas: 50000000000n,
  maxPriorityFeePerGas: 2000000000n
})
```

### Sign message (EIP-191)

```typescript
yield* signer.signMessage(Hex.fromString('Hello, Ethereum!'))
```

### Sign typed data (EIP-712)

```typescript
yield* signer.signTypedData(typedData)
```

### Browser wallet (MetaMask)

```typescript
const BrowserLayer = Layer.mergeAll(
  Signer.Live,
  JsonRpcAccount(userAddress),
  Provider
).pipe(Layer.provide(BrowserTransport))
```

### Send and wait for confirmation

```typescript
const txHash = yield* signer.sendTransaction({ to: '0x...', value: 1000000000000000000n })
const receipt = yield* waitForTransactionReceipt(txHash, { confirmations: 3, timeout: '60 seconds' })
```

### Signer layer composition

```typescript
// From private key
const SignerLayer = Signer.fromPrivateKey(privateKey, Provider).pipe(
  Layer.provide(Layer.mergeAll(CryptoLayer, TransportLayer))
)

// Explicit with LocalAccount
const SignerLayer2 = Signer.fromProvider(Provider, LocalAccount(privateKey)).pipe(
  Layer.provide(TransportLayer)
)
```

---

## 13. Wallet Creation (HD Wallet)

### Generate new wallet

```typescript
const generateWallet = Effect.gen(function* () {
  const mnemonic = Bip39.generateMnemonic(256)
  const seed = yield* Effect.promise(() => Bip39.mnemonicToSeed(mnemonic))
  const root = HDWallet.fromSeed(seed)
  const account = HDWallet.deriveEthereum(root, 0, 0)
  const privateKey = HDWallet.getPrivateKey(account)

  const secp = yield* Secp256k1Service
  const keccak = yield* KeccakService
  const publicKey = yield* secp.getPublicKey(privateKey)
  const addressBytes = yield* keccak.hash(publicKey.slice(1))
  const address = A.fromBytes(addressBytes.slice(-20))

  return { mnemonic, privateKey: Hex.fromBytes(privateKey), address: A.toHex(address) }
})
```

### Restore from mnemonic

```typescript
const AccountLayer = MnemonicAccount(mnemonic).pipe(
  Layer.provide(Layer.mergeAll(Secp256k1Live, KeccakLive))
)

const program = Effect.gen(function* () {
  const account = yield* AccountService
  return account.address
}).pipe(Effect.provide(AccountLayer))
```

### Derive multiple addresses

```typescript
const makeAccountLayer = (index: number) =>
  MnemonicAccount(mnemonic, { index }).pipe(Layer.provide(CryptoLayer))

const deriveAddresses = (count: number) =>
  Effect.gen(function* () {
    const addresses: string[] = []
    for (let i = 0; i < count; i++) {
      const result = yield* Effect.gen(function* () {
        const account = yield* AccountService
        return account.address
      }).pipe(Effect.provide(makeAccountLayer(i)))
      addresses.push(result)
    }
    return addresses
  })
```

### Encrypted mnemonic storage

Uses `AesGcmService` + `KeccakService` for encrypt/decrypt.

---

## 14. Testing Patterns

### TestTransport (mock RPC)

```typescript
const TestLayer = Provider.pipe(
  Layer.provide(TestTransport({
    eth_blockNumber: () => '0x1234',
    eth_getBalance: (params) => params[0] === '0xRich...' ? '0xde0b6b3a7640000' : '0x0',
    eth_call: (params) => params[0]?.data?.startsWith('0x70a08231')
      ? '0x0000000000000000000000000000000000000000000000000000000005f5e100'
      : '0x'
  }))
)
```

### Static responses (simpler form)

```typescript
TestTransport({
  'eth_getBalance': '0xde0b6b3a7640000',
  'eth_blockNumber': '0x1234',
  'eth_chainId': '0x1'
})
```

### Error mocking

```typescript
TestTransport({
  'eth_getBalance': new TransportError({ code: -32000, message: 'timeout' })
})
```

### CryptoTest layer

```typescript
import { CryptoTest } from 'voltaire-effect'

// Deterministic crypto outputs
const testProgram = program.pipe(Effect.provide(CryptoTest))
```

### Composing test layers

```typescript
const TestLayer = Layer.mergeAll(
  Provider.pipe(Layer.provide(TestTransport({ 'eth_getBalance': '0x0' }))),
  CryptoTest
)
```

### Integration test with Anvil

```typescript
const TestLayer = Layer.mergeAll(
  Provider,
  Signer.Live,
  LocalAccount(Hex.fromHex('0xac0974bec...')),
  HttpTransport({
    url: 'http://localhost:8545',
    timeout: '10 seconds',
    retrySchedule: Schedule.recurs(1)
  })
)
```

### Property-based testing

```typescript
await fc.assert(fc.asyncProperty(
  fc.hexaString({ minLength: 40, maxLength: 40 }),
  async (hex) => {
    const addr = S.decodeSync(Address.Hex)(`0x${hex}`)
    const encoded = S.encodeSync(Address.Hex)(addr)
    const roundTripped = S.decodeSync(Address.Hex)(encoded)
    expect(Address.equals(addr, roundTripped)).toBe(true)
  }
))
```

---

## 15. Retry, Timeout, Resilience

### Per-request overrides (FiberRef-based)

```typescript
// Timeout
getBalance(addr).pipe(withTimeout("5 seconds"))

// Retry
getBalance(addr).pipe(withRetrySchedule(Schedule.recurs(1)))

// Disable cache
getBlockNumber().pipe(withoutCache)

// Enable tracing
getBalance(addr).pipe(withTracing())
```

### Exponential backoff with jitter

```typescript
getBalance(addr).pipe(
  withRetrySchedule(
    Schedule.exponential("500 millis").pipe(
      Schedule.jittered,
      Schedule.compose(Schedule.recurs(5))
    )
  )
)
```

### Transport-level defaults

```typescript
HttpTransport({
  url: 'https://eth.llamarpc.com',
  timeout: '30 seconds',
  retrySchedule: Schedule.exponential('500 millis').pipe(
    Schedule.jittered,
    Schedule.compose(Schedule.recurs(5))
  )
})
```

### Timeout with fallback

```typescript
const program = Effect.gen(function* () {
  return yield* getBlock({ blockTag: 'latest', includeTransactions: true })
}).pipe(
  withTimeout('10 seconds'),
  Effect.catchTag('TimeoutException', () => Effect.succeed(null))
)
```

---

## 16. Layer Presets (Multi-Chain)

### Multi-chain with swappable presets

```typescript
const getBlockNumber = Effect.gen(function* () {
  return yield* getBlockNum()
})

const [mainnet, optimism, arbitrum, base] = await Promise.all([
  Effect.runPromise(getBlockNumber.pipe(Effect.provide(MainnetProvider('...')))),
  Effect.runPromise(getBlockNumber.pipe(Effect.provide(OptimismProvider('...')))),
  Effect.runPromise(getBlockNumber.pipe(Effect.provide(ArbitrumProvider('...')))),
  Effect.runPromise(getBlockNumber.pipe(Effect.provide(BaseProvider('...'))))
])
```

### Full service stack preset

```typescript
const program = Effect.gen(function* () {
  const chain = yield* ChainService
  const feeEstimator = yield* FeeEstimatorService
  const nonceManager = yield* NonceManagerService
  const cache = yield* CacheService

  const blockNumber = yield* getBlockNumber()
  const fees = yield* feeEstimator.estimate()
  const nonce = yield* nonceManager.getNextNonce(addr)

  return { chain: chain.name, chainId: chain.id, blockNumber, fees, nonce }
}).pipe(Effect.provide(MainnetFullProvider('https://eth.llamarpc.com')))
```

### Custom network

```typescript
const fantomProvider = createProvider('https://rpc.ftm.tools')
await Effect.runPromise(program.pipe(Effect.provide(fantomProvider)))
```

---

## 17. Complete End-to-End Examples

### Uniswap V2 Indexer (100 lines)

A standalone example that:
1. Makes raw `fetch()` RPC calls with fallback across 3 public RPCs
2. Uses `Effect.retry(Schedule.exponential(...))` for resilience
3. Decodes Swap events via manual hex slicing (topics for indexed params, data for non-indexed)
4. Pre-computes keccak256 topic hashes (hardcoded, not computed at runtime)
5. Extends to SQLite storage with `@effect/sql-sqlite-bun`
6. Extends to HTTP API with `@effect/platform-bun`

Key pattern -- RPC fallback:
```typescript
const tryUrl = (url: string) =>
  Effect.tryPromise({
    try: async () => { /* fetch + parse */ },
    catch: (e) => new RpcError(`${url}: ${e}`),
  }).pipe(
    Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(2))))
  )

return RPC_URLS.slice(1).reduce(
  (acc, url) => acc.pipe(Effect.orElse(() => tryUrl(url))),
  tryUrl(RPC_URLS[0]!)
)
```

### Complete ERC20 workflow

Read token info -> transfer -> wait for confirmation -> verify balance change. Uses `Contract` factory with `.read`, `.write`, `waitForTransactionReceipt`.

### Uniswap V2 swap

Real-world pattern: query router for amounts out, calculate slippage, set deadline, execute swap.

---

## 18. Key Differences from kundera-effect (Starknet)

| Aspect | voltaire-effect (Ethereum) | kundera-effect (Starknet) |
|--------|---------------------------|--------------------------|
| **Free functions** | Yes - `getBlockNumber()`, `getBalance()` etc. are top-level | Currently service-method style |
| **Provider setup** | `Provider.pipe(Layer.provide(HttpTransport(...)))` | `TransportService`-based |
| **Contract factory** | `yield* Contract(addr, abi)` returning `.read./.write./.simulate./.getEvents()` | Not yet available |
| **Multicall** | `aggregate3()` and typed `multicall()` | Not available (no Multicall3 on Starknet) |
| **Layer presets** | `MainnetProvider()`, `OptimismProvider()`, etc. | Not yet available |
| **TestTransport** | `TestTransport({ method: response })` | Not yet available |
| **Per-request overrides** | `withTimeout()`, `withRetrySchedule()`, `withoutCache()` via FiberRef | Not yet available |
| **Block streaming** | `makeBlockStream()` with `.watch()` and `.backfill()` returning Effect Streams | Not yet available |
| **Event streaming** | `contract.getEvents()` + BlockStream for live watching | Not yet available |
| **Crypto services** | `CryptoLive`/`CryptoTest` bundling all crypto | Not yet integrated |
| **Schema primitives** | ~150+ namespace exports for all Ethereum types | Fewer Starknet-specific types |
| **ERC standards** | `ERC20`, `ERC721`, `ERC1155` encoding utilities | Not applicable (Cairo contracts) |
| **HD Wallet** | `MnemonicAccount`, `HDWallet`, `Bip39` | Different derivation path needed |
| **Browser support** | `BrowserTransport` for EIP-1193 | Different (wallet_api) |

### Patterns to adopt for kundera-effect

1. **Free functions over service methods** - `getBlockNumber()` instead of `yield* provider; provider.getBlockNumber()`
2. **TestTransport** - Simple mock transport for testing
3. **withTimeout / withRetrySchedule** - FiberRef-based per-request overrides
4. **Layer presets** - `MainnetProvider()` one-liner setup
5. **Contract factory** - `Contract(addr, abi)` with `.read./.write.` interface
6. **Block/Event streaming** - `makeBlockStream()` with backfill + watch
7. **CryptoLive / CryptoTest** - Bundled crypto layers for production and testing
8. **Always compose layers before providing** - Anti-pattern: multiple `Effect.provide` calls

### Effect patterns consistently used

1. `Effect.gen(function* () { ... })` - Generator syntax for sequential effects
2. `yield*` - Unwrap effects inside generators
3. `Effect.all({ named: effect })` - Parallel named effects (preferred over array)
4. `Effect.forEach(items, fn, { concurrency })` - Collection with concurrency
5. `Effect.catchTag` / `Effect.catchTags` - Tagged error handling
6. `Effect.orElse` - Fallback on failure
7. `Effect.provide(layer)` - Dependency injection at the edge
8. `Layer.mergeAll` / `Layer.provide` / `Layer.provideMerge` - Layer composition
9. `Stream.runForEach` / `Stream.runCollect` - Stream consumption
10. `Stream.flatMap` / `Stream.map` / `Stream.filter` / `Stream.take` - Stream operators
11. `Schedule.exponential(...).pipe(Schedule.jittered, Schedule.compose(Schedule.recurs(n)))` - Retry schedules
12. `S.decode` / `S.decodeSync` / `S.decodeEither` - Schema validation
13. `Data.TaggedError` - Custom error types with `_tag` for `catchTag`
14. `Fiber.interrupt` - Cancellation
15. `Effect.runPromise` / `Effect.runPromiseExit` - Running effects
