---
title: kundera-effect
description: Effect-TS integration for Kundera Starknet primitives
---

# kundera-effect

Effect-TS integration for the [Kundera](https://github.com/starknet/kundera) Starknet primitives library. Type-safe operations with composable, error-handled Effects.

## Overview

kundera-effect wraps all Kundera operations in Effect-TS, providing:

- **Typed Errors**: All operations return `Effect<A, E, R>` with precise error types
- **Composable**: Chain operations using Effect's powerful combinators
- **Zero Runtime Overhead**: Effect's tree-shaking keeps bundles small
- **Full Starknet Coverage**: Primitives, ABI encoding, crypto, RPC, and more

## Installation

```bash
npm install kundera-effect effect @starknet/kundera
```

## Quick Start

```typescript
import { Effect } from "effect";
import * as Abi from "kundera-effect/abi";
import * as Primitives from "kundera-effect/primitives";

const program = Effect.gen(function* () {
  // Parse a felt - returns Effect<Felt252Type, PrimitiveError>
  const recipient = yield* Primitives.Felt252.from("0x123...");

  // Encode calldata - returns Effect<bigint[], AbiError>
  const calldata = yield* Abi.encodeCalldata(abi, "transfer", [recipient, 100n]);

  return calldata;
}).pipe(
  Effect.retry({ times: 3 }),
  Effect.timeout("10 seconds")
);

const calldata = await Effect.runPromise(program);
```

## Package Structure

```
kundera-effect/
├── primitives/       # Felt252, ContractAddress, ClassHash, etc.
├── abi/              # ABI parsing, encoding, decoding
├── crypto/           # Pedersen, Poseidon, STARK signatures
├── serde/            # Cairo serialization
├── rpc/              # Starknet JSON-RPC methods
├── transport/        # HTTP and WebSocket transports
├── native/           # Native backend with Effect wrappers
├── wasm/             # WASM backend with Effect wrappers
└── wasm-loader/      # WASM loader utilities
```

## Subpath Exports

- `kundera-effect` - Main entry (all modules)
- `kundera-effect/abi` - ABI encoding/decoding
- `kundera-effect/primitives` - Felt252, addresses, hashes
- `kundera-effect/crypto` - Cryptographic operations
- `kundera-effect/serde` - Cairo serialization
- `kundera-effect/rpc` - JSON-RPC methods
- `kundera-effect/transport` - Transport layer

## Error Types

All errors extend Effect's `TaggedError` for pattern matching:

| Error | Module | Description |
|-------|--------|-------------|
| `PrimitiveError` | primitives | Invalid felt, address, or hash |
| `AbiError` | abi | Parse, encode, or decode failure |
| `CryptoError` | crypto | Hash or signature failure |
| `SerdeError` | serde | Serialization failure |
| `RpcError` | rpc | JSON-RPC call failure |
| `TransportError` | transport | Network or connection failure |

## Documentation

- [Primitives](./primitives/index.md) - Felt252, ContractAddress, ClassHash
- [ABI](./modules/abi.md) - ABI encoding and decoding
- [Crypto](./modules/crypto.md) - Hashing and signatures
- [Serde](./modules/serde.md) - Cairo serialization
- [RPC](./modules/rpc.md) - Starknet JSON-RPC
- [Transport](./modules/transport.md) - HTTP and WebSocket
- [Errors](./modules/errors.md) - Error handling patterns
