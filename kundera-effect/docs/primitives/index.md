---
title: Primitives
description: Starknet primitive types with Effect wrappers
---

# Primitives

The primitives module provides type-safe Starknet primitive types wrapped in Effect for error handling.

## Available Primitives

| Primitive | Description |
|-----------|-------------|
| [Felt252](./felt252.md) | Field element (< 2^252) |
| [ContractAddress](./contract-address.md) | Contract address (< 2^251) |
| [ClassHash](./class-hash.md) | Contract class hash |
| [StorageKey](./storage-key.md) | Storage slot key |
| [EthAddress](./eth-address.md) | Ethereum address (20 bytes) |
| [ShortString](./short-string.md) | Cairo short string (< 31 chars) |

## Import

```typescript
import * as Primitives from "kundera-effect/primitives";

// Or individual primitives
import { Felt252, ContractAddress } from "kundera-effect/primitives";
```

## Error Handling

All constructors return `Effect<T, PrimitiveError>`:

```typescript
import { Effect } from "effect";
import * as Felt252 from "kundera-effect/primitives/Felt252";

const program = Effect.gen(function* () {
  const felt = yield* Felt252.from("0x123");
  return felt;
});

// Handle errors
const result = await Effect.runPromise(
  program.pipe(
    Effect.catchTag("PrimitiveError", (e) =>
      Effect.succeed(`Invalid: ${e.message}`)
    )
  )
);
```

## Pure Functions

Non-fallible operations are exposed directly (not wrapped in Effect):

```typescript
import * as Felt252 from "kundera-effect/primitives/Felt252";

// These don't need Effect - they're pure functions
const hex = Felt252.toHex(felt);
const bigint = Felt252.toBigInt(felt);
const isZero = Felt252.isZero(felt);
```
