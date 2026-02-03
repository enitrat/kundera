---
title: ABI
description: Cairo ABI parsing, encoding, and decoding
---

# ABI

The `Abi` module provides comprehensive ABI parsing, calldata encoding, and output decoding for Cairo contracts.

## Import

```typescript
import * as Abi from "@kundera-sn/kundera-effect/abi";
```

## Types

```typescript
type Abi = AbiEntry[];
type ParsedAbi = { functions: Map, events: Map, structs: Map, enums: Map };
type CairoValue = bigint | string | boolean | CairoValue[] | Record<string, CairoValue>;
```

## Parsing

### parseAbi

Parse a raw ABI into an indexed structure for fast lookups.

```typescript
const parsed = yield* Abi.parseAbi(rawAbi);
// Effect<ParsedAbi, AbiError>
```

### parseType

Parse a Cairo type string.

```typescript
const type = Abi.parseType("core::array::Array<core::felt252>");
// { type: "Array", inner: { type: "felt252" } }
```

## Encoding

### encodeCalldata

Encode function arguments to calldata.

```typescript
const calldata = yield* Abi.encodeCalldata(
  abi,
  "transfer",
  [recipient, amount]
);
// Effect<bigint[], AbiError>
```

### compileCalldata

Compile arguments into a Call structure.

```typescript
const call = yield* Abi.compileCalldata(abi, "transfer", [recipient, amount]);
// Effect<Call, AbiError>
```

### encodeValue

Encode a single value for a given type.

```typescript
const encoded = yield* Abi.encodeValue(
  { low: 100n, high: 0n },
  "core::integer::u256",
  parsedAbi
);
// Effect<bigint[], AbiError>
```

### encodeArgs / encodeArgsObject

Encode function arguments as array or object.

```typescript
// Array form
const encoded = yield* Abi.encodeArgs(
  [recipient, amount],
  fn.inputs,
  parsedAbi
);

// Object form
const encoded = yield* Abi.encodeArgsObject(
  { recipient, amount },
  fn.inputs,
  parsedAbi
);
```

## Decoding

### decodeOutput

Decode function return values.

```typescript
const result = yield* Abi.decodeOutput(abi, "balanceOf", outputFelts);
// Effect<CairoValue[], AbiError>
```

### decodeOutputObject

Decode return values as named object.

```typescript
const result = yield* Abi.decodeOutputObject(abi, "get_info", outputFelts);
// Effect<{ name: string, balance: bigint }, AbiError>
```

### decodeCalldata / decodeCalldataObject

Decode calldata back to arguments.

```typescript
const args = yield* Abi.decodeCalldata(abi, "transfer", calldata);
// Effect<CairoValue[], AbiError>
```

### decodeEvent / decodeEventBySelector

Decode event data.

```typescript
const event = yield* Abi.decodeEvent(abi, "Transfer", eventData);
// Effect<DecodedEvent, AbiError>

const event = yield* Abi.decodeEventBySelector(abi, selectorHex, eventData);
// Effect<DecodedEvent, AbiError>
```

## Selectors

### getFunctionSelector / getFunctionSelectorHex

Compute function selector.

```typescript
const selector = yield* Abi.getFunctionSelector("transfer");
// Effect<bigint, AbiError>

const selectorHex = yield* Abi.getFunctionSelectorHex("transfer");
// Effect<string, AbiError>
```

### getEventSelector / getEventSelectorHex

Compute event selector.

```typescript
const selector = yield* Abi.getEventSelector("Transfer");
// Effect<bigint, AbiError>
```

## Lookups

### getFunction / getEvent / getStruct / getEnum

Look up ABI entries by name or selector.

```typescript
const fn = yield* Abi.getFunction(parsedAbi, "transfer");
// Effect<IndexedFunction, AbiError>

const event = yield* Abi.getEvent(parsedAbi, "Transfer");
// Effect<IndexedEvent, AbiError>

const struct = Abi.getStruct(parsedAbi, "MyStruct");
// IndexedStruct | undefined

const enumDef = Abi.getEnum(parsedAbi, "MyEnum");
// IndexedEnum | undefined
```

## Class Hash

### classHashFromSierra

Compute class hash from Sierra contract.

```typescript
const classHash = yield* Abi.classHashFromSierra(sierraContract);
// Effect<string, AbiError>
```

### compiledClassHashFromCasm

Compute compiled class hash from CASM.

```typescript
const hash = yield* Abi.compiledClassHashFromCasm(casmContract);
// Effect<string, AbiError>
```

### extractAbi

Extract ABI from a contract artifact.

```typescript
const abi = yield* Abi.extractAbi(artifact);
// Effect<Abi, AbiError>
```

## Short Strings

### encodeShortString / decodeShortString

Encode/decode Cairo short strings (non-Effect, pure functions).

```typescript
const felt = Abi.encodeShortString("hello");
// bigint

const str = Abi.decodeShortString(felt);
// "hello"
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as Abi from "@kundera-sn/kundera-effect/abi";

const erc20Abi = [...]; // Your ABI

const program = Effect.gen(function* () {
  // Encode a transfer call
  const calldata = yield* Abi.encodeCalldata(
    erc20Abi,
    "transfer",
    ["0x123...", 1000n]
  );

  // Later, decode the output
  const balance = yield* Abi.decodeOutput(
    erc20Abi,
    "balanceOf",
    [1000n, 0n] // u256 as [low, high]
  );

  return { calldata, balance };
});
```

## Error Handling

All operations return `Effect<T, AbiError>`. AbiError includes:

- `code`: Error code (PARSE_ERROR, ENCODE_ERROR, DECODE_ERROR, etc.)
- `message`: Human-readable description
- `input`: The input that caused the error

```typescript
const program = Abi.encodeCalldata(abi, "unknownFn", []).pipe(
  Effect.catchTag("AbiError", (e) => {
    console.log(e.code);    // "NOT_FOUND"
    console.log(e.message); // "Function 'unknownFn' not found in ABI"
    return Effect.succeed([]);
  })
);
```
