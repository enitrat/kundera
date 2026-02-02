---
title: Serde
description: Cairo serialization and deserialization
---

# Serde

The `Serde` module provides Cairo-compatible serialization and deserialization utilities.

## Import

```typescript
import * as Serde from "kundera-effect/serde";
```

## U256 Serialization

Cairo u256 is represented as two felt252 values: `[low, high]`.

### serializeU256

```typescript
const [low, high] = yield* Serde.serializeU256(12345n);
// Effect<[Felt252Type, Felt252Type], SerdeError>
```

### deserializeU256

```typescript
const value = yield* Serde.deserializeU256([lowFelt, highFelt]);
// Effect<bigint, SerdeError>
```

## Array Serialization

Cairo arrays are length-prefixed.

### serializeArray

Add length prefix to an array.

```typescript
const prefixed = yield* Serde.serializeArray(felts);
// Effect<Felt252Type[], SerdeError>
// Result: [length, ...elements]
```

### deserializeArray

Extract array with length prefix.

```typescript
const result = yield* Serde.deserializeArray(felts, offset);
// Effect<{ array: Felt252Type[], nextOffset: number }, SerdeError>
```

## ByteArray Serialization

For arbitrary-length byte data.

### serializeByteArray

```typescript
const felts = yield* Serde.serializeByteArray(
  new Uint8Array([1, 2, 3, 4, 5])
);
// Effect<Felt252Type[], SerdeError>
```

## Namespace Form

```typescript
import { CairoSerde } from "kundera-effect/serde";

const [low, high] = yield* CairoSerde.serializeU256(value);
const value = yield* CairoSerde.deserializeU256([low, high]);
const prefixed = yield* CairoSerde.serializeArray(array);
const { array, nextOffset } = yield* CairoSerde.deserializeArray(data, 0);
const felts = yield* CairoSerde.serializeByteArray(bytes);
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as Serde from "kundera-effect/serde";
import * as Felt252 from "kundera-effect/primitives/Felt252";

const program = Effect.gen(function* () {
  // Serialize a u256 for contract call
  const amount = 1000000000000000000n; // 1e18
  const [low, high] = yield* Serde.serializeU256(amount);

  // Serialize an array
  const addresses = [
    yield* Felt252.from("0x123"),
    yield* Felt252.from("0x456"),
    yield* Felt252.from("0x789")
  ];
  const serialized = yield* Serde.serializeArray(addresses);
  // [3n, 0x123n, 0x456n, 0x789n] (length-prefixed)

  // Serialize arbitrary bytes
  const data = new TextEncoder().encode("Hello, Starknet!");
  const bytesFelts = yield* Serde.serializeByteArray(data);

  return { low, high, serialized, bytesFelts };
});
```

## Deserialization Example

```typescript
import { Effect } from "effect";
import * as Serde from "kundera-effect/serde";

const program = Effect.gen(function* () {
  // Response from contract: [3n, 0x1n, 0x2n, 0x3n, lowAmount, highAmount]
  const response = [3n, 1n, 2n, 3n, 1000000n, 0n].map(/* convert to felt */);

  // Deserialize the array (first element is length)
  const { array, nextOffset } = yield* Serde.deserializeArray(response, 0);
  // array = [1n, 2n, 3n], nextOffset = 4

  // Deserialize the u256 at offset 4
  const amount = yield* Serde.deserializeU256([
    response[nextOffset],
    response[nextOffset + 1]
  ]);

  return { array, amount };
});
```

## Error Handling

```typescript
const program = Serde.deserializeU256([invalidFelt1, invalidFelt2]).pipe(
  Effect.catchTag("SerdeError", (e) => {
    console.log(e.operation); // "deserializeU256"
    console.log(e.message);   // Error details
    return Effect.succeed(0n);
  })
);
```
