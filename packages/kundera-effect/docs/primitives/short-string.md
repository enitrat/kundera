---
title: ShortString
description: Cairo short string type (< 31 characters)
---

# ShortString

The `ShortString` module provides utilities for Cairo short strings - ASCII strings that fit within a single felt252 (maximum 31 characters).

## Constants

```typescript
// Maximum length for short strings
const MAX_SHORT_STRING_LENGTH = 31;
```

## Constructors

### from

Create a ShortString from a string.

```typescript
import * as ShortString from "kundera-effect/primitives/ShortString";

const short = yield* ShortString.from("hello");
// Effect<Felt252Type, PrimitiveError>
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as ShortString from "kundera-effect/primitives/ShortString";
import * as Abi from "kundera-effect/abi";

const program = Effect.gen(function* () {
  // Encode a short string
  const name = yield* ShortString.from("MyToken");

  // Use in contract calls
  const calldata = yield* Abi.encodeCalldata(
    tokenAbi,
    "initialize",
    [name, symbol, decimals]
  );

  return calldata;
});
```

## Limitations

Short strings must be:
- ASCII only (code points 0-127)
- Maximum 31 characters

For longer strings, use `kundera-effect/serde` with `serializeByteArray`:

```typescript
import * as Serde from "kundera-effect/serde";

// For strings > 31 characters
const felts = yield* Serde.serializeByteArray(
  new TextEncoder().encode("This is a longer string that exceeds 31 characters")
);
```
