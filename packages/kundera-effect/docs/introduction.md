---
title: What is Kundera?
description: Type-safe Starknet primitives library for TypeScript with Effect-TS integration
---

Kundera is a type-safe Starknet primitives library for TypeScript. Branded types prevent common bugs, Effect-TS integration provides explicit error handling, and multiple backend options (WASM, native) offer flexibility for different deployment targets.

> **For application development**, we recommend `@kundera-sn/kundera-effect` for Effect-TS integration with typed errors, composable operations, and production-ready contract interactions.

## Safe Starknet Development

"Safe Starknet" means two things:

1. **Type safety** - Branded primitives prevent mixing up Felts, Addresses, and ClassHashes at compile time
2. **Error explicitness** - All operations return `Effect<A, E, R>` with precise error types, not hidden exceptions

Define your contracts once, use them everywhere with full type safety:

```typescript
import { Effect } from "effect";
import { Services } from "@kundera-sn/kundera-effect";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ name: "balance", type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" }
    ],
    outputs: [],
    state_mutability: "external"
  }
] as const;

const program = Effect.gen(function* () {
  const token = yield* Services.Contract.ContractFactory(
    yield* ContractAddress.from("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"),
    erc20Abi
  );
  const owner = yield* ContractAddress.from("0x...");
  const balance = yield* token.read.balanceOf(owner);
  return balance;
}).pipe(
  Effect.retry({ times: 3 }),
  Effect.timeout("10 seconds"),
  Effect.provide(Services.Presets.createHttpProvider("https://starknet-mainnet.public.blastapi.io")),
  Effect.provide(Services.Contract.ContractLayer)
);
```

## Simple, Intuitive API

Kundera's API mirrors Cairo and Starknet specifications:

```typescript
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
import * as ClassHash from "@kundera-sn/kundera-effect/primitives/ClassHash";
import * as ShortString from "@kundera-sn/kundera-effect/primitives/ShortString";

// Felt252 - the native Starknet field element
const felt = yield* Felt252.from("0x123");
console.log(Felt252.toHex(felt));  // "0x123"
console.log(Felt252.toBigInt(felt));  // 291n

// ContractAddress - branded for type safety
const addr = yield* ContractAddress.from("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7");

// ClassHash - distinct type from ContractAddress
const classHash = yield* ClassHash.from("0x07b3e05f48f0c69e4a65ce5e076a66271a527aff2c34ce1083ec6e1526997a69");

// Type safety prevents confusion
// await deploy({ classHash: addr });  // Type Error: ContractAddress not assignable to ClassHash

// ShortString - Cairo short strings (felt-encoded)
const name = yield* ShortString.encode("ERC20");
const decoded = ShortString.decode(name);  // "ERC20"
```

## What's Included

- **Primitives** - Felt252, ContractAddress, ClassHash, StorageKey, EthAddress with branded types
- **ABI** - Parse, encode, and decode calldata with full Cairo type support
- **Crypto** - Pedersen hash, Poseidon hash, STARK signatures
- **Serde** - Cairo serialization for complex types
- **JSON-RPC** - All Starknet JSON-RPC methods with typed responses
- **Transport** - HTTP and WebSocket transports
- **Services** - Dependency injection layers for Provider, Transport, Contract

## What's Unique?

- **Branded Types** - Runtime-validated TypeScript types. Prevents passing hex strings where addresses are expected, mixing up ClassHash and ContractAddress, and type confusion between felt values.

- **Effect Integration** - All operations return `Effect<A, E, R>` with precise error types. Compose with retries, timeouts, and fallbacks. Pattern match on error tags for explicit handling.

- **Multiple Backends** - Choose your deployment target:
  - **WASM** - Works everywhere (browsers, Node.js, serverless). Bundles the Starknet cryptography compiled to WebAssembly.
  - **Native** - Maximum performance via Bun's FFI. Direct access to native Rust implementations.

- **Type-Safe Contracts** - The `ContractFactory` provides fully typed `read` and `write` methods inferred from your ABI. No more string-based function calls.

- **Explicit Error Handling** - Every module exports specific error types (`PrimitiveError`, `AbiError`, `CryptoError`, `RpcError`, `TransportError`, `SerdeError`). Handle at the application boundary or pattern match inline.

## Installation

```bash
npm install @kundera-sn/kundera-effect effect @kundera-sn/kundera-ts
```

## Next Steps

- [Primitives](/primitives) - Learn about Felt252, ContractAddress, and other branded types
- [Services](/services) - Set up Provider and Transport layers
- [ABI](/abi) - Encode and decode contract calldata
- [JSON-RPC](/jsonrpc) - Make direct RPC calls
