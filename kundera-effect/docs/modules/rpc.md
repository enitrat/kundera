---
title: RPC
description: Starknet JSON-RPC methods
---

# RPC

The `Rpc` module provides Effect-wrapped Starknet JSON-RPC methods.

## Import

```typescript
import * as Rpc from "kundera-effect/rpc";
```

## Read Methods

### Block Information

```typescript
// Get block with transaction hashes only
const block = yield* Rpc.starknet_getBlockWithTxHashes(transport, blockId);

// Get block with full transactions
const block = yield* Rpc.starknet_getBlockWithTxs(transport, blockId);

// Get block with receipts
const block = yield* Rpc.starknet_getBlockWithReceipts(transport, blockId);

// Get current block number
const blockNumber = yield* Rpc.starknet_blockNumber(transport);

// Get block hash and number
const { block_hash, block_number } = yield* Rpc.starknet_blockHashAndNumber(transport);
```

### State

```typescript
// Get state update
const update = yield* Rpc.starknet_getStateUpdate(transport, blockId);

// Get storage value
const value = yield* Rpc.starknet_getStorageAt(
  transport,
  contractAddress,
  key,
  blockId
);

// Get nonce
const nonce = yield* Rpc.starknet_getNonce(transport, blockId, address);

// Get storage proof
const proof = yield* Rpc.starknet_getStorageProof(
  transport,
  blockId,
  classHashes,
  contractAddresses,
  contractStorageKeys
);
```

### Transactions

```typescript
// Get transaction by hash
const tx = yield* Rpc.starknet_getTransactionByHash(transport, txHash);

// Get transaction by block and index
const tx = yield* Rpc.starknet_getTransactionByBlockIdAndIndex(
  transport,
  blockId,
  index
);

// Get transaction receipt
const receipt = yield* Rpc.starknet_getTransactionReceipt(transport, txHash);

// Get transaction status
const status = yield* Rpc.starknet_getTransactionStatus(transport, txHash);

// Get transaction count in block
const count = yield* Rpc.starknet_getBlockTransactionCount(transport, blockId);
```

### Classes

```typescript
// Get class definition
const classDef = yield* Rpc.starknet_getClass(transport, blockId, classHash);

// Get class hash at address
const classHash = yield* Rpc.starknet_getClassHashAt(transport, blockId, address);

// Get class at address
const classDef = yield* Rpc.starknet_getClassAt(transport, blockId, address);
```

### Chain Information

```typescript
// Get chain ID
const chainId = yield* Rpc.starknet_chainId(transport);

// Get spec version
const version = yield* Rpc.starknet_specVersion(transport);

// Get sync status
const syncing = yield* Rpc.starknet_syncing(transport);
```

### Events

```typescript
// Query events
const events = yield* Rpc.starknet_getEvents(transport, {
  filter: {
    from_block: { block_number: 0 },
    to_block: "latest",
    address: contractAddress,
    keys: [[eventSelector]]
  },
  chunk_size: 100
});
```

### Messaging

```typescript
// Get L1->L2 message status
const status = yield* Rpc.starknet_getMessagesStatus(transport, l1TxHash);
```

## Write Methods

### Call (Read-only execution)

```typescript
const result = yield* Rpc.starknet_call(transport, {
  contract_address: address,
  entry_point_selector: selector,
  calldata: []
}, blockId);
```

### Fee Estimation

```typescript
// Estimate transaction fee
const estimate = yield* Rpc.starknet_estimateFee(
  transport,
  [transaction],
  simulationFlags,
  blockId
);

// Estimate L1 message fee
const estimate = yield* Rpc.starknet_estimateMessageFee(
  transport,
  message,
  blockId
);
```

### Submit Transactions

```typescript
// Submit invoke transaction
const result = yield* Rpc.starknet_addInvokeTransaction(transport, invokeTx);
// Effect<AddInvokeTransactionResult, RpcError>

// Submit declare transaction
const result = yield* Rpc.starknet_addDeclareTransaction(transport, declareTx);
// Effect<AddDeclareTransactionResult, RpcError>

// Submit deploy account transaction
const result = yield* Rpc.starknet_addDeployAccountTransaction(transport, deployTx);
// Effect<AddDeployAccountTransactionResult, RpcError>
```

### Simulation & Tracing

```typescript
// Simulate transactions
const results = yield* Rpc.starknet_simulateTransactions(
  transport,
  blockId,
  transactions,
  simulationFlags
);

// Trace single transaction
const trace = yield* Rpc.starknet_traceTransaction(transport, txHash);

// Trace all transactions in block
const traces = yield* Rpc.starknet_traceBlockTransactions(transport, blockId);
```

## WebSocket Subscriptions

```typescript
// Subscribe to new blocks
const subId = yield* Rpc.starknet_subscribeNewHeads(transport, params);

// Subscribe to events
const subId = yield* Rpc.starknet_subscribeEvents(transport, params);

// Subscribe to transaction status
const subId = yield* Rpc.starknet_subscribeTransactionStatus(transport, txHash);

// Subscribe to new transaction receipts
const subId = yield* Rpc.starknet_subscribeNewTransactionReceipts(transport, params);

// Subscribe to pending transactions
const subId = yield* Rpc.starknet_subscribeNewTransactions(transport, params);

// Unsubscribe
yield* Rpc.starknet_unsubscribe(transport, subId);
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as Rpc from "kundera-effect/rpc";
import { httpTransport } from "kundera-effect/transport";

const transport = httpTransport({ url: "https://starknet-mainnet.public.blastapi.io" });

const program = Effect.gen(function* () {
  // Get current block
  const blockNumber = yield* Rpc.starknet_blockNumber(transport);
  console.log("Current block:", blockNumber);

  // Get ETH balance
  const balance = yield* Rpc.starknet_call(transport, {
    contract_address: ETH_ADDRESS,
    entry_point_selector: "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e", // balanceOf
    calldata: [accountAddress]
  }, "latest");

  return { blockNumber, balance };
});

await Effect.runPromise(program);
```

## Error Handling

All RPC methods return `Effect<T, RpcError>`:

```typescript
const program = Rpc.starknet_getTransactionByHash(transport, "0xinvalid").pipe(
  Effect.catchTag("RpcError", (e) => {
    console.log(e.operation); // "starknet_getTransactionByHash"
    console.log(e.message);   // JSON-RPC error message
    return Effect.succeed(null);
  })
);
```

## Types

The module re-exports all Starknet RPC types:

```typescript
import type {
  BlockId,
  BlockTag,
  BlockWithTxHashes,
  TransactionReceipt,
  FeeEstimate,
  // ... many more
} from "kundera-effect/rpc";
```
