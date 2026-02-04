---
title: JSON-RPC
description: Effect-wrapped Starknet JSON-RPC methods with typed errors
---

# JSON-RPC

Effect-wrapped Starknet JSON-RPC methods providing type-safe error handling for all Starknet RPC operations.

## Overview

The JSON-RPC module wraps all Starknet RPC methods in Effect, providing:

- **Type-safe errors** - All methods return `Effect<T, RpcError>` with structured error context
- **Operation tracking** - Each error includes the operation name and input for debugging
- **Transport agnostic** - Works with HTTP or WebSocket transports
- **Full Starknet RPC coverage** - All read, write, and subscription methods

## Quick Start

```typescript
import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { httpTransport } from "@kundera-sn/kundera-ts/transport";

const transport = httpTransport("https://starknet-mainnet.public.blastapi.io");

const program = Effect.gen(function* () {
  // Get current block number
  const blockNumber = yield* Rpc.starknet_blockNumber(transport);

  // Get chain ID
  const chainId = yield* Rpc.starknet_chainId(transport);

  return { blockNumber, chainId };
});

// Run the Effect
const result = await Effect.runPromise(program);
console.log(result);
```

## Transport Setup

### HTTP Transport

For standard request/response operations:

```typescript
import { httpTransport } from "@kundera-sn/kundera-ts/transport";

// Basic usage
const transport = httpTransport("https://starknet-mainnet.public.blastapi.io");

// With options
const transport = httpTransport("https://starknet-mainnet.public.blastapi.io", {
  timeout: 30000,
  fetchOptions: {
    headers: {
      Authorization: "Bearer YOUR_API_KEY",
    },
  },
});
```

### WebSocket Transport

For subscriptions and real-time updates:

```typescript
import { webSocketTransport } from "@kundera-sn/kundera-ts/transport";

const transport = webSocketTransport({
  url: "wss://starknet-mainnet.public.blastapi.io/ws",
  reconnect: true,
  reconnectDelay: 1000,
});
```

## Read Methods

### Block Information

```typescript
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";

const program = Effect.gen(function* () {
  // Get current block number
  const blockNumber = yield* Rpc.starknet_blockNumber(transport);

  // Get block hash and number
  const { block_hash, block_number } = yield* Rpc.starknet_blockHashAndNumber(
    transport
  );

  // Get block with transaction hashes only
  const block = yield* Rpc.starknet_getBlockWithTxHashes(transport, "latest");

  // Get block with full transactions
  const blockWithTxs = yield* Rpc.starknet_getBlockWithTxs(transport, "latest");

  // Get block with receipts
  const blockWithReceipts = yield* Rpc.starknet_getBlockWithReceipts(
    transport,
    "latest"
  );

  // Get transaction count in block
  const txCount = yield* Rpc.starknet_getBlockTransactionCount(
    transport,
    "latest"
  );
});
```

### State Queries

```typescript
const program = Effect.gen(function* () {
  // Get state update for a block
  const stateUpdate = yield* Rpc.starknet_getStateUpdate(transport, "latest");

  // Get storage value at key
  const value = yield* Rpc.starknet_getStorageAt(
    transport,
    contractAddress,
    storageKey,
    "latest"
  );

  // Get account nonce
  const nonce = yield* Rpc.starknet_getNonce(
    transport,
    accountAddress,
    "latest"
  );

  // Get storage proof (for L1 verification)
  const proof = yield* Rpc.starknet_getStorageProof(
    transport,
    "latest",
    classHashes,
    contractAddresses,
    contractStorageKeys
  );
});
```

### Transaction Queries

```typescript
const program = Effect.gen(function* () {
  // Get transaction by hash
  const tx = yield* Rpc.starknet_getTransactionByHash(transport, txHash);

  // Get transaction by block and index
  const txByIndex = yield* Rpc.starknet_getTransactionByBlockIdAndIndex(
    transport,
    "latest",
    0
  );

  // Get transaction receipt
  const receipt = yield* Rpc.starknet_getTransactionReceipt(transport, txHash);

  // Get transaction status (useful for pending transactions)
  const status = yield* Rpc.starknet_getTransactionStatus(transport, txHash);
});
```

### Contract Classes

```typescript
const program = Effect.gen(function* () {
  // Get class definition by hash
  const classDef = yield* Rpc.starknet_getClass(transport, "latest", classHash);

  // Get class hash at contract address
  const classHash = yield* Rpc.starknet_getClassHashAt(
    transport,
    contractAddress,
    "latest"
  );

  // Get class at contract address
  const classAtAddress = yield* Rpc.starknet_getClassAt(
    transport,
    "latest",
    contractAddress
  );
});
```

### Chain Information

```typescript
const program = Effect.gen(function* () {
  // Get chain ID
  const chainId = yield* Rpc.starknet_chainId(transport);

  // Get spec version
  const specVersion = yield* Rpc.starknet_specVersion(transport);

  // Check sync status
  const syncing = yield* Rpc.starknet_syncing(transport);
});
```

### Events

```typescript
const program = Effect.gen(function* () {
  const events = yield* Rpc.starknet_getEvents(transport, {
    filter: {
      from_block: { block_number: 0 },
      to_block: "latest",
      address: contractAddress,
      keys: [[eventSelector]], // Nested array for topic filtering
    },
    chunk_size: 100,
  });

  // Handle pagination with continuation_token
  if (events.continuation_token) {
    const moreEvents = yield* Rpc.starknet_getEvents(transport, {
      filter: {
        // ... same filter
      },
      chunk_size: 100,
      continuation_token: events.continuation_token,
    });
  }
});
```

### L1-L2 Messaging

```typescript
const program = Effect.gen(function* () {
  // Get status of L1->L2 message
  const status = yield* Rpc.starknet_getMessagesStatus(transport, l1TxHash);
});
```

## Write Methods

### Contract Calls (Read-only Execution)

```typescript
const program = Effect.gen(function* () {
  const result = yield* Rpc.starknet_call(
    transport,
    {
      contract_address: contractAddress,
      entry_point_selector: selectorHash,
      calldata: ["0x1", "0x2"],
    },
    "latest"
  );
});
```

### Fee Estimation

```typescript
const program = Effect.gen(function* () {
  // Estimate transaction fee
  const feeEstimate = yield* Rpc.starknet_estimateFee(
    transport,
    [broadcastedTx],
    ["SKIP_VALIDATE"], // SimulationFlags
    "latest"
  );

  // Estimate L1->L2 message fee
  const messageFee = yield* Rpc.starknet_estimateMessageFee(
    transport,
    {
      from_address: l1Address,
      to_address: l2ContractAddress,
      entry_point_selector: selector,
      payload: calldata,
    },
    "latest"
  );
});
```

### Transaction Submission

```typescript
const program = Effect.gen(function* () {
  // Submit invoke transaction
  const invokeResult = yield* Rpc.starknet_addInvokeTransaction(transport, {
    type: "INVOKE",
    sender_address: accountAddress,
    calldata: [...],
    max_fee: "0x...",
    version: "0x1",
    signature: [...],
    nonce: "0x..."
  });
  // Returns: { transaction_hash: "0x..." }

  // Submit declare transaction
  const declareResult = yield* Rpc.starknet_addDeclareTransaction(transport, {
    type: "DECLARE",
    contract_class: contractClass,
    sender_address: accountAddress,
    max_fee: "0x...",
    version: "0x2",
    signature: [...],
    nonce: "0x...",
    compiled_class_hash: "0x..."
  });
  // Returns: { transaction_hash: "0x...", class_hash: "0x..." }

  // Submit deploy account transaction
  const deployResult = yield* Rpc.starknet_addDeployAccountTransaction(transport, {
    type: "DEPLOY_ACCOUNT",
    class_hash: accountClassHash,
    contract_address_salt: salt,
    constructor_calldata: [...],
    max_fee: "0x...",
    version: "0x1",
    signature: [...],
    nonce: "0x0"
  });
  // Returns: { transaction_hash: "0x...", contract_address: "0x..." }
});
```

## Simulation and Tracing

### Transaction Simulation

```typescript
const program = Effect.gen(function* () {
  const simResults = yield* Rpc.starknet_simulateTransactions(
    transport,
    "latest",
    [broadcastedTx],
    ["SKIP_VALIDATE", "SKIP_FEE_CHARGE"]
  );

  for (const result of simResults) {
    console.log("Fee estimate:", result.fee_estimation);
    console.log("Execution trace:", result.transaction_trace);
  }
});
```

### Transaction Tracing

```typescript
const program = Effect.gen(function* () {
  // Trace a single transaction
  const trace = yield* Rpc.starknet_traceTransaction(transport, txHash);

  // Trace all transactions in a block
  const blockTraces = yield* Rpc.starknet_traceBlockTransactions(
    transport,
    "latest"
  );
});
```

## WebSocket Subscriptions

Subscriptions require a WebSocket transport and return subscription IDs:

```typescript
import { webSocketTransport } from "@kundera-sn/kundera-ts/transport";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";

const wsTransport = webSocketTransport({
  url: "wss://starknet-mainnet.public.blastapi.io/ws",
});

const program = Effect.gen(function* () {
  // Subscribe to new block headers
  const headSubId = yield* Rpc.starknet_subscribeNewHeads(wsTransport, {});

  // Subscribe to events
  const eventSubId = yield* Rpc.starknet_subscribeEvents(wsTransport, {
    from_address: contractAddress,
    keys: [[eventSelector]],
  });

  // Subscribe to transaction status changes
  const statusSubId = yield* Rpc.starknet_subscribeTransactionStatus(
    wsTransport,
    txHash
  );

  // Subscribe to new transaction receipts
  const receiptSubId = yield* Rpc.starknet_subscribeNewTransactionReceipts(
    wsTransport,
    {}
  );

  // Subscribe to pending transactions
  const pendingSubId = yield* Rpc.starknet_subscribeNewTransactions(
    wsTransport,
    { transaction_hash: true, sender_address: true }
  );

  // Unsubscribe when done
  yield* Rpc.starknet_unsubscribe(wsTransport, headSubId);
});
```

## Error Handling

All RPC methods return `Effect<T, RpcError>`. The `RpcError` includes:

- `message` - Human-readable error description
- `operation` - The RPC method that failed (e.g., "starknet_getTransactionByHash")
- `input` - The parameters passed to the method
- `expected` - What was expected (always "JSON-RPC success response")
- `cause` - The underlying error

### Basic Error Handling

```typescript
import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { RpcError } from "@kundera-sn/kundera-effect/jsonrpc";

const program = Effect.gen(function* () {
  const tx = yield* Rpc.starknet_getTransactionByHash(transport, txHash);
  return tx;
});

// At application boundary - errors propagate automatically
Effect.runPromise(program).catch((error) => {
  if (error instanceof RpcError) {
    console.error(`RPC failed: ${error.operation}`);
    console.error(`Message: ${error.message}`);
    console.error(`Input: ${JSON.stringify(error.input)}`);
  }
});
```

### Using catchTag

```typescript
const program = Effect.gen(function* () {
  const tx = yield* Rpc.starknet_getTransactionByHash(transport, txHash);
  return tx;
}).pipe(
  Effect.catchTag("RpcError", (error) =>
    Effect.succeed({ notFound: true, hash: txHash })
  )
);
```

### Error Transformation

```typescript
class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

const program = Effect.gen(function* () {
  const tx = yield* Rpc.starknet_getTransactionByHash(transport, txHash);
  return tx;
}).pipe(
  Effect.mapError(
    (e) =>
      new AppError(`Transaction lookup failed: ${e.message}`, "TX_NOT_FOUND")
  )
);
```

## Starknet RPC Error Codes

When the RPC node returns an error, the `cause` field contains the JSON-RPC error with Starknet-specific codes:

| Code | Name                              | Description                         |
| ---- | --------------------------------- | ----------------------------------- |
| 1    | `FailedToReceiveTransaction`      | Failed to write to transaction pool |
| 20   | `ContractNotFound`                | Contract not found at address       |
| 24   | `BlockNotFound`                   | Block not found                     |
| 25   | `InvalidTransactionHash`          | Transaction hash not found          |
| 27   | `InvalidTransactionIndex`         | Invalid transaction index in block  |
| 28   | `ClassHashNotFound`               | Class hash not found                |
| 29   | `TransactionHashNotFound`         | Transaction not in pending pool     |
| 31   | `PageSizeTooBig`                  | Requested page size exceeds limit   |
| 32   | `NoBlocks`                        | No blocks available                 |
| 33   | `InvalidContinuationToken`        | Invalid pagination token            |
| 34   | `TooManyKeysInFilter`             | Too many keys in event filter       |
| 40   | `ContractError`                   | Contract execution error            |
| 41   | `TransactionExecutionError`       | Transaction execution failed        |
| 50   | `InvalidContractClass`            | Invalid contract class              |
| 51   | `ClassAlreadyDeclared`            | Class already declared              |
| 52   | `InvalidTransactionNonce`         | Invalid transaction nonce           |
| 53   | `InsufficientMaxFee`              | Max fee too low                     |
| 54   | `InsufficientAccountBalance`      | Account balance too low             |
| 55   | `ValidationFailure`               | Account validation failed           |
| 56   | `CompilationFailed`               | Sierra to CASM compilation failed   |
| 57   | `ContractClassSizeIsTooLarge`     | Contract class size exceeds limit   |
| 58   | `NonAccount`                      | Non-account calls not supported     |
| 59   | `DuplicateTransaction`            | Transaction already exists          |
| 60   | `CompiledClassHashMismatch`       | Compiled class hash mismatch        |
| 61   | `UnsupportedTransactionVersion`   | Unsupported transaction version     |
| 62   | `UnsupportedContractClassVersion` | Unsupported contract class version  |
| 63   | `UnexpectedError`                 | Unexpected error                    |
| 10   | `NoTraceAvailable`                | No trace available for transaction  |

## Batching Patterns

Use `Promise.all` or `Effect.all` to batch independent requests:

```typescript
const program = Effect.gen(function* () {
  // Sequential (slower)
  const block = yield* Rpc.starknet_blockNumber(transport);
  const chainId = yield* Rpc.starknet_chainId(transport);

  // Parallel (faster) - use Effect.all for independent operations
  const [block2, chainId2, spec] = yield* Effect.all([
    Rpc.starknet_blockNumber(transport),
    Rpc.starknet_chainId(transport),
    Rpc.starknet_specVersion(transport),
  ]);
});
```

For transport-level batching (single HTTP request with multiple RPC calls), use the transport directly:

```typescript
import {
  createRequest,
  matchBatchResponses,
} from "@kundera-sn/kundera-ts/transport";

const requests = [
  createRequest("starknet_blockNumber", []),
  createRequest("starknet_chainId", []),
];

const responses = await transport.requestBatch(requests);
const matched = matchBatchResponses(requests, responses);
```

## Method Reference

### Read Methods

| Method                                     | Description                           |
| ------------------------------------------ | ------------------------------------- |
| `starknet_specVersion`                     | Get the RPC spec version              |
| `starknet_blockNumber`                     | Get current block number              |
| `starknet_blockHashAndNumber`              | Get latest block hash and number      |
| `starknet_chainId`                         | Get chain identifier                  |
| `starknet_syncing`                         | Get sync status                       |
| `starknet_getBlockWithTxHashes`            | Get block with transaction hashes     |
| `starknet_getBlockWithTxs`                 | Get block with full transactions      |
| `starknet_getBlockWithReceipts`            | Get block with transaction receipts   |
| `starknet_getBlockTransactionCount`        | Get transaction count in block        |
| `starknet_getStateUpdate`                  | Get state update for block            |
| `starknet_getStorageAt`                    | Get storage value at key              |
| `starknet_getStorageProof`                 | Get storage proof for L1 verification |
| `starknet_getNonce`                        | Get account nonce                     |
| `starknet_getTransactionByHash`            | Get transaction by hash               |
| `starknet_getTransactionByBlockIdAndIndex` | Get transaction by block and index    |
| `starknet_getTransactionReceipt`           | Get transaction receipt               |
| `starknet_getTransactionStatus`            | Get transaction status                |
| `starknet_getClass`                        | Get class definition by hash          |
| `starknet_getClassHashAt`                  | Get class hash at address             |
| `starknet_getClassAt`                      | Get class at contract address         |
| `starknet_getEvents`                       | Query events with filters             |
| `starknet_getMessagesStatus`               | Get L1-L2 message status              |

### Write Methods

| Method                                 | Description                       |
| -------------------------------------- | --------------------------------- |
| `starknet_call`                        | Execute read-only contract call   |
| `starknet_estimateFee`                 | Estimate transaction fee          |
| `starknet_estimateMessageFee`          | Estimate L1-L2 message fee        |
| `starknet_addInvokeTransaction`        | Submit invoke transaction         |
| `starknet_addDeclareTransaction`       | Submit declare transaction        |
| `starknet_addDeployAccountTransaction` | Submit deploy account transaction |
| `starknet_simulateTransactions`        | Simulate transactions             |
| `starknet_traceTransaction`            | Get transaction trace             |
| `starknet_traceBlockTransactions`      | Get all traces in block           |

### Subscription Methods (WebSocket)

| Method                                     | Description                       |
| ------------------------------------------ | --------------------------------- |
| `starknet_subscribeNewHeads`               | Subscribe to new block headers    |
| `starknet_subscribeEvents`                 | Subscribe to contract events      |
| `starknet_subscribeTransactionStatus`      | Subscribe to transaction status   |
| `starknet_subscribeNewTransactionReceipts` | Subscribe to new receipts         |
| `starknet_subscribeNewTransactions`        | Subscribe to pending transactions |
| `starknet_unsubscribe`                     | Cancel a subscription             |

## Related

- [Transport](/modules/transport) - HTTP and WebSocket transport configuration
- [Errors](/modules/errors) - Error types and handling patterns
- [Starknet RPC Spec](https://github.com/starkware-libs/starknet-specs) - Official Starknet RPC specification
