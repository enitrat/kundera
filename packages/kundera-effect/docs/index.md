---
title: Kundera Documentation
description: Type-safe Starknet primitives library for TypeScript with Effect-TS integration
---

# Kundera Documentation

Welcome to the Kundera documentation. Kundera is a type-safe Starknet primitives library for TypeScript with Effect-TS integration.

## Getting Started

- [What is Kundera?](./introduction.md) - Overview and core concepts
- [Getting Started](./getting-started.md) - Installation and first steps
- [Library Comparisons](./comparisons.md) - Kundera vs starknet.js

## Core Concepts

- [Branded Types](./concepts/branded-types.md) - Zero-overhead type safety
- [Type-Safe Values](./concepts/type-safe-values.md) - Prevent value confusion
- [Error Handling](./concepts/error-handling.md) - Effect-based error patterns
- [Tree-Shakeable API](./concepts/tree-shakeable-api.md) - Minimize bundle size

## Primitives

- [Overview](./primitives/index.md) - All available primitives
- [Felt252](./primitives/felt252.md) - Field element (< 2^252)
- [ContractAddress](./primitives/contract-address.md) - Contract address (< 2^251)
- [ClassHash](./primitives/class-hash.md) - Contract class hash
- [StorageKey](./primitives/storage-key.md) - Storage slot key
- [EthAddress](./primitives/eth-address.md) - Ethereum address (20 bytes)
- [ShortString](./primitives/short-string.md) - Cairo short string (< 31 chars)

## Modules

- [ABI](./modules/abi.md) - ABI parsing, encoding, decoding
- [Crypto](./modules/crypto.md) - Pedersen, Poseidon, STARK signatures
- [Serde](./modules/serde.md) - Cairo serialization
- [JSON-RPC](./modules/jsonrpc.md) - Starknet JSON-RPC methods
- [Transport](./modules/transport.md) - HTTP and WebSocket transports
- [Errors](./modules/errors.md) - Error types and handling

## Quick Links

| Resource | Description |
|----------|-------------|
| [GitHub](https://github.com/enitrat/kundera) | Source code and issues |
| [npm](https://www.npmjs.com/package/@kundera-sn/kundera-effect) | Package registry |

## Installation

```bash
npm install @kundera-sn/kundera-effect effect @kundera-sn/kundera-ts
```

## Quick Example

```typescript
import { Effect } from "effect";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";
import * as JsonRpc from "@kundera-sn/kundera-effect/jsonrpc";
import { httpTransport } from "@kundera-sn/kundera-effect/transport";

const transport = httpTransport("https://starknet-mainnet.public.blastapi.io");

const program = Effect.gen(function* () {
  const address = yield* ContractAddress.from("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7");
  const balance = yield* JsonRpc.starknet_getBalance(transport, address, "latest");
  return balance;
}).pipe(
  Effect.retry({ times: 3 }),
  Effect.timeout("10 seconds")
);

const result = await Effect.runPromise(program);
```
