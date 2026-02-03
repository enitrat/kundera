---
title: StorageKey
description: Starknet storage slot key type
---

# StorageKey

The `StorageKey` module provides a type-safe storage slot key for Starknet contract storage.

## Type Definition

```typescript
type StorageKeyType = bigint & { readonly _tag: "StorageKey" }
```

## Constructors

### from

Create a StorageKey from a felt input.

```typescript
import * as StorageKey from "@kundera-sn/kundera-effect/primitives/StorageKey";

const key = yield* StorageKey.from("0x123");
// Effect<StorageKeyType, PrimitiveError>
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as StorageKey from "@kundera-sn/kundera-effect/primitives/StorageKey";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";

const program = Effect.gen(function* () {
  const key = yield* StorageKey.from("0x110e2f729c9c2b988559994a3daccd838cf52faf88e18101373e67dd061455a");

  // Query storage at this key
  const value = yield* Rpc.starknet_getStorageAt(
    transport,
    contractAddress,
    key,
    "latest"
  );

  return value;
});
```
