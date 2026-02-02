# Observability Analysis: kundera-effect Effect-TS Codebase
Generated: 2026-02-02

## Executive Summary

**Critical Finding: ZERO observability instrumentation detected**

The codebase contains 20 TypeScript source files with 100+ exported functions across 7 major modules (Crypto, Transport, RPC, Serde, ABI, Primitives, WASM), but lacks ANY of the Effect-TS observability best practices:

- ❌ No `Effect.fn()` spans for automatic tracing
- ❌ No `Effect.annotateCurrentSpan()` for business identifiers
- ❌ No `Effect.log()` for structured logging
- ❌ No `Metric.*` instrumentation for operations
- ❌ No `Config.*` usage for configuration management

## Codebase Overview

```
src/
  crypto/          # 23 cryptographic functions (hashing, signing, tx hashing)
  transport/       # 3 transport operations (HTTP/WebSocket)
  rpc/             # 32 Starknet RPC methods
  serde/           # 5 serialization functions
  abi/             # 17 ABI encoding/decoding operations
  primitives/      # 8 primitive type operations
  wasm/            # 15 WASM crypto operations
  native/          # 15 native crypto operations
  wasm-loader/     # 16 WASM loader operations
  errors.ts        # 5 error types
  utils/           # 1 utility (fromResult)
```

## Current Error Handling Pattern

✓ VERIFIED: All modules use consistent error handling via `Effect.try()` wrappers:

- `tryCrypto()` / `tryCryptoPromise()` - wraps crypto operations
- `tryTransport()` / `tryTransportPromise()` - wraps transport operations
- `tryRpc()` - wraps RPC calls
- `trySerde()` - wraps serialization
- `tryAbi()` - wraps ABI operations
- `tryPrimitive()` - wraps primitive operations

These wrappers capture:
- Operation name (string)
- Input data
- Expected format/constraint
- Error cause

**BUT**: These are manual error wrappers, NOT integrated with Effect-TS tracing.

## Missing Observability by Module

### 1. Crypto Module (`src/crypto/index.ts`)

**23 functions lacking instrumentation:**

| Function | Current State | Should Have |
|----------|--------------|-------------|
| `pedersenHash(a, b)` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.pedersenHash")` + span annotations for input values |
| `poseidonHash(a, b)` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.poseidonHash")` + span annotations |
| `poseidonHashMany(inputs)` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.poseidonHashMany")` + counter for input count |
| `sign(privateKey, hash)` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.sign")` + span annotation for messageHash |
| `verify(pubKey, hash, sig)` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.verify")` + counter for verification attempts |
| `computeInvokeV3Hash()` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.computeInvokeV3Hash")` + span annotation for sender address |
| `computeDeclareV3Hash()` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.computeDeclareV3Hash")` + span annotation for class hash |
| `computeDeployAccountV3Hash()` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.computeDeployAccountV3Hash")` + span annotation for contract address |
| `signRaw(privateKey, hash)` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.signRaw")` + span annotation for hash |
| `signTypedData()` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.signTypedData")` + span annotation for accountAddress |
| `hashTypedData()` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.hashTypedData")` + span annotation for domain |
| `feltAdd/Sub/Mul/Div` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.felt*")` + counter for field operations |
| `snKeccak(data)` | `tryCrypto()` wrapper only | `Effect.fn("Crypto.snKeccak")` + gauge for data size |

**Missing Metrics:**
- Counter: `crypto.operations.total` (by operation type)
- Counter: `crypto.operations.errors` (by operation type + error type)
- Histogram: `crypto.operation.duration` (by operation type)
- Gauge: `crypto.input.size` (for hash operations with arrays)

**Missing Logs:**
```typescript
Effect.log("Computing Invoke V3 transaction hash", {
  sender: payload.sender_address,
  nonce: details.nonce,
  chainId: details.chainId
})
```

### 2. Transport Module (`src/transport/index.ts`)

**3 functions lacking instrumentation:**

| Function | Current State | Should Have |
|----------|--------------|-------------|
| `request(transport, req, opts)` | `tryTransportPromise()` only | `Effect.fn("Transport.request")` + span annotation for method + URL |
| `requestBatch(transport, reqs, opts)` | `tryTransportPromise()` only | `Effect.fn("Transport.requestBatch")` + counter for batch size |
| `connect(transport)` | `tryTransportPromise()` only | `Effect.fn("Transport.connect")` + span annotation for endpoint |

**Missing Metrics:**
- Counter: `transport.requests.total` (by method, status)
- Counter: `transport.requests.errors` (by error type)
- Histogram: `transport.request.duration` (by method)
- Histogram: `transport.batch.size`
- Gauge: `transport.connections.active`

**Missing Logs:**
```typescript
Effect.log("Sending JSON-RPC request", {
  method: request.method,
  id: request.id,
  endpoint: transport.url
})
```

### 3. RPC Module (`src/rpc/index.ts`)

**32 Starknet RPC methods lacking instrumentation:**

All methods wrapped via `wrapRpcMethod()` which uses `tryRpc()`, but none have:
- Automatic span names via `Effect.fn()`
- Span annotations for block IDs, transaction hashes, contract addresses
- Structured logging for important operations
- Metrics for RPC call success/failure rates

**Critical Operations Missing Observability:**

| Function | Should Have |
|----------|-------------|
| `starknet_call(request, blockId)` | Span annotation for contract address + selector |
| `starknet_getTransactionStatus(txHash)` | Span annotation for transaction hash |
| `starknet_addInvokeTransaction(tx)` | Span annotation for sender + counter for tx submissions |
| `starknet_addDeclareTransaction(tx)` | Span annotation for class hash + counter |
| `starknet_estimateFee(tx, blockId)` | Span annotation for contract + histogram for estimated fee |
| `starknet_getEvents(filter)` | Span annotation for contract address + counter for events returned |

**Missing Metrics:**
- Counter: `rpc.calls.total` (by method, status)
- Counter: `rpc.calls.errors` (by method, error code)
- Histogram: `rpc.call.duration` (by method)
- Counter: `rpc.transactions.submitted` (by tx type)
- Histogram: `rpc.fee.estimated` (by tx type)
- Counter: `rpc.events.fetched`

### 4. Serde Module (`src/serde/index.ts`)

**5 functions lacking instrumentation:**

| Function | Current State | Should Have |
|----------|--------------|-------------|
| `serializeU256(value)` | `trySerde()` only | `Effect.fn("Serde.serializeU256")` |
| `deserializeU256(felts)` | `trySerde()` only | `Effect.fn("Serde.deserializeU256")` |
| `serializeArray(felts)` | `trySerde()` only | `Effect.fn("Serde.serializeArray")` + gauge for array length |
| `deserializeArray(felts, offset)` | `trySerde()` only | `Effect.fn("Serde.deserializeArray")` + gauge for array length |
| `serializeByteArray(data)` | `trySerde()` only | `Effect.fn("Serde.serializeByteArray")` + gauge for byte length |

**Missing Metrics:**
- Histogram: `serde.array.size` (by operation)
- Counter: `serde.operations.total` (by type)
- Counter: `serde.operations.errors` (by type)

### 5. ABI Module (`src/abi/index.ts`)

**17 functions lacking instrumentation:**

| Function | Current State | Should Have |
|----------|--------------|-------------|
| `parseAbi(abi)` | `fromResult()` wrapper only | `Effect.fn("Abi.parseAbi")` + gauge for entry count |
| `encodeCalldata(abi, fnName, args)` | `fromResult()` wrapper only | `Effect.fn("Abi.encodeCalldata")` + span annotation for function name |
| `decodeCalldata(abi, fnName, data)` | `fromResult()` wrapper only | `Effect.fn("Abi.decodeCalldata")` + span annotation for function name |
| `decodeEvent(abi, eventName, data)` | `fromResult()` wrapper only | `Effect.fn("Abi.decodeEvent")` + span annotation for event name + selector |
| `classHashFromSierra(sierra)` | `fromResult()` wrapper only | `Effect.fn("Abi.classHashFromSierra")` + span annotation for computed hash |
| `computeSelector(name)` | `tryAbi()` wrapper only | `Effect.fn("Abi.computeSelector")` + span annotation for name + result |

**Missing Metrics:**
- Counter: `abi.parse.total`
- Counter: `abi.encode.total` (by type: calldata, value)
- Counter: `abi.decode.total` (by type: calldata, event, output)
- Histogram: `abi.calldata.size`
- Counter: `abi.errors.total` (by error code)

### 6. Primitives Module (`src/primitives/Felt252/index.ts`, etc.)

**8 functions lacking instrumentation:**

| Function | Current State | Should Have |
|----------|--------------|-------------|
| `Felt252.fromHex(hex)` | `tryPrimitive()` only | `Effect.fn("Felt252.fromHex")` + counter for conversions |
| `Felt252.fromBigInt(value)` | `tryPrimitive()` only | `Effect.fn("Felt252.fromBigInt")` |
| `ShortString.encode(str)` | `tryPrimitive()` only | `Effect.fn("ShortString.encode")` + gauge for string length |
| `ShortString.decode(felt)` | `tryPrimitive()` only | `Effect.fn("ShortString.decode")` |

**Missing Metrics:**
- Counter: `primitives.conversions.total` (by type, source format)
- Counter: `primitives.conversions.errors` (by type, error reason)
- Histogram: `primitives.string.length` (for ShortString)

### 7. WASM/Native Modules

**30 functions across wasm/native/wasm-loader lacking instrumentation:**

Each module has ~15 cryptographic operations that should have:
- `Effect.fn("Wasm.pedersenHash")` / `Effect.fn("Native.pedersenHash")`
- Span annotations for backend selection (wasm vs native)
- Metrics for backend usage

**Missing Metrics:**
- Counter: `crypto.backend.operations` (by backend: wasm, native, fallback)
- Gauge: `crypto.backend.available` (wasm=1/0, native=1/0)
- Counter: `wasm.load.attempts`
- Counter: `wasm.load.failures`

## Configuration Management

❌ No `Config.*` usage detected

The codebase should use `Config.*` for:
- WASM path configuration
- Native library path configuration
- RPC endpoint URLs (in transport)
- Timeout configurations
- Retry policies

## Recommended Implementation Priority

### Phase 1: Core Operations (HIGH PRIORITY)

1. **Crypto signing/verification** (security-critical)
   - `sign()`, `verify()`, `signRaw()`, `signTypedData()`
   - Add `Effect.fn()` + span annotations + counters

2. **Transaction hash computation** (affects all transactions)
   - `computeInvokeV3Hash()`, `computeDeclareV3Hash()`, `computeDeployAccountV3Hash()`
   - Add `Effect.fn()` + span annotations for tx identifiers

3. **RPC transaction submission** (user-facing, critical path)
   - `starknet_addInvokeTransaction()`, `starknet_addDeclareTransaction()`
   - Add `Effect.fn()` + span annotations + counters + logging

### Phase 2: Data Path (MEDIUM PRIORITY)

4. **ABI encoding/decoding** (affects all contract calls)
   - `encodeCalldata()`, `decodeCalldata()`, `decodeEvent()`
   - Add `Effect.fn()` + span annotations

5. **Transport layer** (all RPC calls go through here)
   - `request()`, `requestBatch()`, `connect()`
   - Add `Effect.fn()` + metrics for latency/errors

6. **RPC read methods** (high volume)
   - `starknet_call()`, `starknet_getStorageAt()`, `starknet_getEvents()`
   - Add `Effect.fn()` + span annotations

### Phase 3: Supporting Operations (LOW PRIORITY)

7. **Serialization/primitives**
   - Add `Effect.fn()` for consistency

8. **WASM/Native backend selection**
   - Add metrics for backend usage

## Example Implementation

### Before (current):
```typescript
export const pedersenHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("pedersenHash", { a, b }, "native or wasm backend loaded", () =>
    pedersenHashBase(a, b)
  );
```

### After (with observability):
```typescript
export const pedersenHash = Effect.fn(
  "Crypto.pedersenHash",
  (a: Felt252Type, b: Felt252Type) =>
    Effect.gen(function* () {
      yield* Effect.annotateCurrentSpan({
        "crypto.operation": "pedersen_hash",
        "crypto.input.a": a.toString().slice(0, 16), // truncate for logging
        "crypto.input.b": b.toString().slice(0, 16)
      });
      
      yield* Effect.log("Computing Pedersen hash", { 
        operation: "pedersen",
        backend: isNativeAvailable() ? "native" : "wasm"
      });
      
      const result = yield* tryCrypto(
        "pedersenHash", 
        { a, b }, 
        "native or wasm backend loaded", 
        () => pedersenHashBase(a, b)
      );
      
      yield* Metric.counter("crypto.operations.total", {
        operation: "pedersen_hash",
        status: "success"
      }).pipe(Effect.tap(counter => counter.increment()));
      
      return result;
    })
);
```

### For RPC Methods:
```typescript
export const starknet_addInvokeTransaction = Effect.fn(
  "Rpc.addInvokeTransaction",
  (transport: Transport, transaction: BroadcastedInvokeTxn) =>
    Effect.gen(function* () {
      yield* Effect.annotateCurrentSpan({
        "rpc.method": "starknet_addInvokeTransaction",
        "tx.sender": transaction.sender_address,
        "tx.version": transaction.version
      });
      
      yield* Effect.log("Submitting invoke transaction", {
        sender: transaction.sender_address,
        nonce: transaction.nonce
      });
      
      const startTime = Date.now();
      
      const result = yield* tryRpc(
        "starknet_addInvokeTransaction",
        transaction,
        () => Rpc.starknet_addInvokeTransaction(transport, transaction)
      );
      
      yield* Metric.histogram("rpc.call.duration", {
        method: "starknet_addInvokeTransaction"
      }).pipe(Effect.tap(hist => hist.update(Date.now() - startTime)));
      
      yield* Metric.counter("rpc.transactions.submitted", {
        type: "invoke",
        status: "success"
      }).pipe(Effect.tap(counter => counter.increment()));
      
      yield* Effect.log("Transaction submitted successfully", {
        txHash: result.transaction_hash
      });
      
      return result;
    })
);
```

## Key Benefits of Adding Observability

1. **Production Debugging**: See exactly which crypto operation failed, with what inputs
2. **Performance Monitoring**: Track RPC latency, identify slow operations
3. **Usage Analytics**: Understand which RPC methods are called most, backend preference (wasm vs native)
4. **Error Tracking**: Counter metrics for error rates by operation type
5. **Distributed Tracing**: Connect frontend → RPC → crypto operations in single trace
6. **Capacity Planning**: Histogram data for batch sizes, calldata sizes, etc.

## Open Questions

- Should we add sampling for high-frequency operations (e.g., felt arithmetic)?
- Do we need separate metrics for testnet vs mainnet RPC calls?
- Should span annotations include full transaction details or just identifiers?
- Should we add custom error classes for observability (e.g., `ObservableCryptoError`)?

## Files Requiring Changes

All 20 source files need observability additions:

```
src/crypto/index.ts          - 23 functions
src/transport/index.ts       - 3 functions  
src/rpc/index.ts            - 32 functions
src/serde/index.ts          - 5 functions
src/abi/index.ts            - 17 functions
src/primitives/Felt252/index.ts - 8 functions
src/primitives/ShortString/index.ts - 3 functions
src/native/index.ts         - 15 functions
src/wasm/index.ts           - 15 functions
src/wasm-loader/index.ts    - 16 functions
```

**Total**: 137 functions need observability instrumentation

## Conclusion

This is a greenfield opportunity for comprehensive observability. The error handling foundation exists (via `try*` wrappers), but tracing, logging, and metrics are completely absent. 

Recommended: Start with Phase 1 (crypto signing + tx hashing + RPC submission) as these are security/business-critical paths.
