---
title: Error Handling
description: Type-safe error handling with Effect in kundera-effect
---

# Error Handling

@kundera-sn/kundera-effect uses Effect-TS for type-safe error handling. All operations return `Effect<A, E, R>` where the error type `E` is tracked at compile time, eliminating hidden exceptions.

## Why Effect Over Exceptions?

**starknet.js** - exceptions hidden in async calls:

```typescript
import { Contract, RpcProvider } from "starknet";

const provider = new RpcProvider({ nodeUrl: "https://..." });
const contract = new Contract(abi, address, provider);

try {
  const balance = await contract.balanceOf(userAddress);
} catch (e) {
  // What kind of error? Network? ABI? Validation?
  // TypeScript can't help you here
}
```

**@kundera-sn/kundera-effect** - explicit, typed errors:

```typescript
import { Effect } from "effect";
import * as Abi from "@kundera-sn/kundera-effect/abi";
import * as JsonRpc from "@kundera-sn/kundera-effect/jsonrpc";

// Effect<bigint, AbiError | RpcError | TransportError, never>
// TypeScript knows exactly what can fail
const program = Effect.gen(function* () {
  const calldata = yield* Abi.encodeCalldata(abi, "balanceOf", [userAddress]);
  const result = yield* JsonRpc.starknet_call(transport, call, "latest");
  return yield* Abi.decodeOutput(abi, "balanceOf", result);
});
```

Key benefits:
- **Explicit errors**: The type signature tells you what can fail
- **Composition**: Errors propagate automatically through `Effect.gen`
- **No surprises**: You can't accidentally ignore an error type
- **Exhaustive handling**: TypeScript ensures you handle all error cases

## Basic Pattern

Use `Effect.gen` with `yield*` to sequence operations:

```typescript
import { Effect } from "effect";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";

// Effect<ContractAddressType, PrimitiveError, never>
const program = Effect.gen(function* () {
  const felt = yield* Felt252.from("0x123");
  const address = yield* ContractAddress.from("0x049d36...");
  return { felt, address };
});
```

Each `yield*` unwraps the Effect. If any operation fails, execution stops and the error propagates.

## Error Hierarchy

### Core Errors

All core errors use Effect's `Schema.TaggedError` with a common structure:

| Error | Tag | Module | Description |
|-------|-----|--------|-------------|
| `PrimitiveError` | `"PrimitiveError"` | primitives | Invalid felt, address, or hash |
| `CryptoError` | `"CryptoError"` | crypto | Hash or signature failure |
| `SerdeError` | `"SerdeError"` | serde | Serialization/deserialization failure |
| `RpcError` | `"RpcError"` | jsonrpc | JSON-RPC call failure |
| `TransportError` | `"TransportError"` | transport | Network or connection failure |

## Error Metadata

Every error includes contextual information for debugging:

```typescript
interface ErrorFields {
  message: string;      // Human-readable description
  operation: string;    // Operation that failed (e.g., "Felt252.from")
  input?: unknown;      // The input that caused the error
  expected?: string;    // What was expected
  cause?: unknown;      // Underlying error
}
```

Example error inspection:

```typescript
import { Effect } from "effect";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";

const program = Felt252.from("invalid").pipe(
  Effect.catchTag("PrimitiveError", (error) => {
    console.log(error._tag);       // "PrimitiveError"
    console.log(error.message);    // "Primitive operation failed"
    console.log(error.operation);  // "Felt252.from"
    console.log(error.input);      // "invalid"
    console.log(error.expected);   // "hex string, bigint, number, or 32-byte Uint8Array"
    return Effect.succeed(Felt252.ZERO);
  })
);
```

## Catching Specific Errors with `catchTag`

Effect's `catchTag` provides compile-time type safety. TypeScript tracks which error types remain unhandled:

```typescript
import { Effect } from "effect";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";

// Effect<Felt252Type, PrimitiveError, never>
const parse = Felt252.from("0x123");

// After catchTag, PrimitiveError is removed from the error channel
// Effect<Felt252Type, never, never>
const handled = parse.pipe(
  Effect.catchTag("PrimitiveError", (e) =>
    Effect.succeed(Felt252.ZERO)
  )
);
```

### Handling Multiple Error Types

Use `catchTags` to handle multiple error types at once:

```typescript
import { Effect } from "effect";
import * as Abi from "@kundera-sn/kundera-effect/abi";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";

const program = Effect.gen(function* () {
  const calldata = yield* Abi.encodeCalldata(abi, "transfer", args);
  const result = yield* Rpc.starknet_call(transport, call, "latest");
  return result;
}).pipe(
  Effect.catchTags({
    AbiError: (e) => Effect.fail(new AppError(`ABI error: ${e.message}`)),
    RpcError: (e) => Effect.fail(new AppError(`RPC error: ${e.message}`))
  })
);
```

## Handle Errors at the Boundary

**Do not** catch and swallow errors locally. Let errors propagate and handle them at the application boundary (CLI entry point, API handler, etc.):

```typescript
// Anti-pattern: Local error swallowing
const bad = Felt252.from(input).pipe(
  Effect.catchTag("PrimitiveError", (e) => {
    console.error(e.message);  // Don't use console in Effect code
    return Effect.succeed(0n); // Swallows the error!
  })
);

// Correct: Let errors propagate, handle at boundary
const program = Effect.gen(function* () {
  const felt = yield* Felt252.from(input);
  const result = yield* doSomething(felt);
  return result;
});

// At application boundary
Effect.runPromise(
  program.pipe(
    Effect.catchAll((error) => {
      console.error(formatError(error));
      return Effect.sync(() => process.exit(1));
    })
  )
);
```

## Exhaustive Handling with Match

Use Effect's `Match` for exhaustive error handling:

```typescript
import { Effect, Match } from "effect";
import { PrimitiveError, CryptoError, RpcError } from "@kundera-sn/kundera-effect";

type AppError = PrimitiveError | CryptoError | RpcError;

const handleError = Match.type<AppError>().pipe(
  Match.tag("PrimitiveError", (e) => `Invalid primitive: ${e.input}`),
  Match.tag("CryptoError", (e) => `Crypto failed: ${e.operation}`),
  Match.tag("RpcError", (e) => `RPC failed: ${e.message}`),
  Match.exhaustive // TypeScript ensures all cases are handled
);

const program = myEffect.pipe(
  Effect.catchAll((e) => {
    const message = handleError(e);
    return Effect.logError(message).pipe(
      Effect.zipRight(Effect.fail(new Error(message)))
    );
  })
);
```

## Converting to Either

Get `Either<Error, Value>` for explicit error handling without exceptions:

```typescript
import { Effect, Either } from "effect";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";

const result = await Effect.runPromise(
  Felt252.from(value).pipe(Effect.either)
);

if (Either.isLeft(result)) {
  // Handle error
  const error = result.left;
} else {
  // Use value
  const felt = result.right;
}
```

## Retrying on Errors

Use `Effect.retry` with schedules for transient failures:

```typescript
import { Effect, Schedule } from "effect";

const program = Rpc.starknet_call(transport, call, "latest").pipe(
  // Retry up to 3 times with exponential backoff
  Effect.retry(
    Schedule.exponential("100 millis").pipe(
      Schedule.compose(Schedule.recurs(3))
    )
  )
);

// Only retry on specific errors
const selective = program.pipe(
  Effect.retry({
    times: 3,
    while: (e) => e._tag === "RpcError" || e._tag === "TransportError"
  })
);
```

## Mapping Errors

Transform errors while preserving the error channel:

```typescript
import { Effect } from "effect";

// Map to a different error type
const program = Felt252.from(value).pipe(
  Effect.mapError((e) => new MyCustomError(e.message))
);

// Add context while preserving the error
const withContext = Felt252.from(value).pipe(
  Effect.mapError((e) => ({
    ...e,
    context: "parsing user input"
  }))
);
```

## Schema Error Messages with formatError

When using Effect schemas, use `formatError` from `effect/ParseResult` to get human-readable error messages:

```typescript
import * as S from "effect/Schema";
import { formatError } from "effect/ParseResult";

const result = S.decodeUnknownEither(MySchema)(input);
if (result._tag === "Left") {
  const formatted = formatError(result.left);
  // "MySchema
  //  └─ Predicate refinement failure
  //     └─ Invalid input: expected X, got Y"
}
```

Output format is a tree showing the path to the error, making it easy to understand deeply nested validation failures.

## Simpler Alternative: neverthrow

If Effect feels heavyweight for your use case, consider [neverthrow](https://github.com/supermacro/neverthrow) for lightweight Result types:

```typescript
import { Result, ok, err } from "neverthrow";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";

function parseFelt(input: string): Result<Felt252Type, PrimitiveError> {
  try {
    return ok(Felt252(input));
  } catch (error) {
    return err(error as PrimitiveError);
  }
}

// Now you get type-safe error handling
const result = parseFelt(userInput);
result.match(
  (felt) => console.log("Valid:", Felt252.toHex(felt)),
  (error) => console.log("Invalid:", error.message)
);
```

neverthrow provides:
- Simple `Result<T, E>` type
- No runtime overhead
- Familiar API (`map`, `flatMap`, `match`)
- Easy migration path to Effect if needed later

## Complete Example: CLI Error Handling

Here is a complete example of proper error handling in a CLI application:

```typescript
import { Effect, Layer, Logger } from "effect";
import * as Primitives from "@kundera-sn/kundera-effect/primitives";
import * as Abi from "@kundera-sn/kundera-effect/abi";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";

// Command returns an Effect - doesn't handle errors locally
const getBalance = (address: string) =>
  Effect.gen(function* () {
    const contractAddress = yield* Primitives.ContractAddress.from(address);
    const calldata = yield* Abi.encodeCalldata(erc20Abi, "balanceOf", [contractAddress]);
    const selector = yield* Abi.computeSelectorHex("balanceOf");

    const result = yield* Rpc.starknet_call(transport, {
      contract_address: TOKEN_ADDRESS,
      entry_point_selector: selector,
      calldata: calldata.map(f => `0x${f.toString(16)}`)
    }, "latest");

    yield* Effect.log(`Balance: ${result}`);
    return result;
  });

// Format error for CLI output
const formatError = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    if ("_tag" in e && "message" in e) {
      return `${e._tag}: ${e.message}`;
    }
  }
  return String(error);
};

// Run with error handling at the boundary
const runCommand = <A, E>(program: Effect.Effect<A, E>) =>
  Effect.runPromise(
    program.pipe(
      Effect.catchAll((error) => {
        console.error(formatError(error));
        return Effect.sync(() => process.exit(1));
      }),
      Effect.asVoid
    )
  );

// Usage
await runCommand(getBalance("0x123..."));
```

## Summary

| Pattern | When to Use |
|---------|-------------|
| `Effect.catchTag` | Handle one specific error type |
| `Effect.catchTags` | Handle multiple specific error types |
| `Effect.catchAll` | Handle any error (usually at boundary) |
| `Effect.mapError` | Transform error type |
| `Effect.either` | Convert to Either for explicit handling |
| `Match.exhaustive` | Ensure all error cases are handled |
| `Effect.retry` | Retry transient failures |

The key principle: **track errors in types, handle them at the boundary**.
