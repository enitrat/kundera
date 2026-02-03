---
title: ClassHash
description: Starknet contract class hash type
---

# ClassHash

The `ClassHash` module provides a type-safe Starknet class hash - the unique identifier for a contract's code.

## Type Definition

```typescript
type ClassHashType = bigint & { readonly _tag: "ClassHash" }
```

## Constructors

### from

Create a ClassHash from a felt input.

```typescript
import * as ClassHash from "kundera-effect/primitives/ClassHash";

const hash = yield* ClassHash.from("0x07b3e05f48f0c69e4a65ce5e076a66271a527aff2c34ce1083ec6e1526997a69");
// Effect<ClassHashType, PrimitiveError>
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as ClassHash from "kundera-effect/primitives/ClassHash";
import * as Crypto from "kundera-effect/crypto";

const program = Effect.gen(function* () {
  // Compute class hash from Sierra contract
  const classHash = yield* Crypto.computeContractAddress(
    salt,
    yield* ClassHash.from(CLASS_HASH),
    constructorCalldata,
    deployerAddress
  );

  return classHash;
});
```
