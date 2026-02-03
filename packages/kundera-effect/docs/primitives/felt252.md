---
title: Felt252
description: Starknet field element type
---

# Felt252

The `Felt252` module provides the core Starknet field element type - an integer in the range [0, FIELD_PRIME).

## Type Definition

```typescript
type Felt252Type = bigint & { readonly _tag: "Felt252" }
type Felt252Input = string | bigint | number | Uint8Array
```

## Constants

```typescript
// The Starknet field prime: 2^251 + 17 * 2^192 + 1
const FIELD_PRIME: bigint

// Maximum length for short strings (31 characters)
const MAX_SHORT_STRING_LENGTH: number
```

## Constructors

### from

Create a Felt252 from various input types.

```typescript
import * as Felt252 from "kundera-effect/primitives/Felt252";

const felt = yield* Felt252.from("0x123");
const felt = yield* Felt252.from(291n);
const felt = yield* Felt252.from(291);
const felt = yield* Felt252.from(new Uint8Array([0, 1, 2, 3]));
// Effect<Felt252Type, PrimitiveError>
```

### fromHex

Parse from a 0x-prefixed hex string.

```typescript
const felt = yield* Felt252.fromHex("0x123abc");
// Effect<Felt252Type, PrimitiveError>
```

### fromBigInt

Create from a bigint value.

```typescript
const felt = yield* Felt252.fromBigInt(12345n);
// Effect<Felt252Type, PrimitiveError>
```

### fromBytes

Create from a 32-byte Uint8Array.

```typescript
const bytes = new Uint8Array(32);
const felt = yield* Felt252.fromBytes(bytes);
// Effect<Felt252Type, PrimitiveError>
```

## Methods

### toHex

Convert to hex string with 0x prefix.

```typescript
const hex = Felt252.toHex(felt);
// "0x123"
```

### toBigInt

Convert to bigint.

```typescript
const value = Felt252.toBigInt(felt);
// 291n
```

### isValid

Check if a felt is valid (in range).

```typescript
const valid = Felt252.isValid(felt);
// true
```

### isZero

Check if a felt is zero.

```typescript
const zero = Felt252.isZero(felt);
// false
```

### equals

Compare two felts for equality.

```typescript
const equal = Felt252.equals(a, b);
// true | false
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as Felt252 from "kundera-effect/primitives/Felt252";

const program = Effect.gen(function* () {
  // Parse from various formats
  const fromHex = yield* Felt252.fromHex("0xdeadbeef");
  const fromBigInt = yield* Felt252.fromBigInt(3735928559n);

  // They should be equal
  console.log(Felt252.equals(fromHex, fromBigInt)); // true

  // Convert to different formats
  console.log(Felt252.toHex(fromHex)); // "0xdeadbeef"
  console.log(Felt252.toBigInt(fromBigInt)); // 3735928559n

  return fromHex;
});

await Effect.runPromise(program);
```

## Error Handling

```typescript
import { Effect } from "effect";
import * as Felt252 from "kundera-effect/primitives/Felt252";

const program = Felt252.fromHex("invalid").pipe(
  Effect.catchTag("PrimitiveError", (error) => {
    console.log(error.operation); // "Felt252.fromHex"
    console.log(error.input);     // "invalid"
    console.log(error.expected);  // "0x-prefixed hex string"
    return Effect.succeed(Felt252.ZERO);
  })
);
```
