---
title: Errors
description: Error handling patterns with Effect
---

# Errors

@kundera-sn/kundera-effect uses Effect's `Schema.TaggedError` for type-safe, serializable error handling across all modules.

## Error Types

| Error | Tag | Module |
|-------|-----|--------|
| `PrimitiveError` | `"PrimitiveError"` | primitives |
| `AbiError` | - | abi (from kundera) |
| `CryptoError` | `"CryptoError"` | crypto |
| `SerdeError` | `"SerdeError"` | serde |
| `RpcError` | `"RpcError"` | jsonrpc |
| `TransportError` | `"TransportError"` | transport |
| `ContractError` | `"ContractError"` | services/Contract |
| `ContractWriteError` | `"ContractWriteError"` | services/ContractWrite |

## Error Structure

All errors extend `Schema.TaggedError` with a common structure:

```typescript
interface ErrorFields {
  message: string;      // Human-readable description
  operation: string;    // Operation that failed (e.g., "Felt252.from")
  input?: unknown;      // The input that caused the error
  expected?: string;    // What was expected
  cause?: unknown;      // Underlying error
}
```

## Type-Safe Error Handling with `catchTag`

Effect's `catchTag` provides **compile-time type safety** for error handling. TypeScript tracks which error types remain unhandled in the error channel.

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

### Multiple Error Types

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

## Best Practice: Handle Errors at the Boundary

**Don't** catch and swallow errors locally. Instead, let errors propagate and handle them at the application boundary (CLI entry point, API handler, etc.).

```typescript
// ❌ ANTI-PATTERN: Local error swallowing
const program = Felt252.from(input).pipe(
  Effect.catchTag("PrimitiveError", (e) => {
    console.error(e.message);  // Don't use console in Effect code
    return Effect.succeed(0n); // Swallows the error!
  })
);

// ✅ CORRECT: Let errors propagate, handle at boundary
const program = Effect.gen(function* () {
  const felt = yield* Felt252.from(input);
  const result = yield* doSomething(felt);
  return result;
});

// At application boundary (CLI, API handler, etc.)
Effect.runPromise(
  program.pipe(
    Effect.catchAll((error) => {
      // Log and exit with appropriate code
      return Effect.logError("Operation failed", { error }).pipe(
        Effect.zipRight(Effect.sync(() => process.exit(1)))
      );
    })
  )
);
```

## Logging Errors

Use `Effect.log` instead of `console.log` for composable logging:

```typescript
import { Effect } from "effect";

const program = Effect.gen(function* () {
  yield* Effect.log("Starting operation");
  const result = yield* someEffect;
  yield* Effect.log("Completed", { result });
  return result;
}).pipe(
  Effect.catchAll((error) => {
    return Effect.logError("Operation failed", { error }).pipe(
      Effect.zipRight(Effect.fail(error))
    );
  })
);
```

## Retrying on Errors

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

Transform errors to different types while preserving the error channel:

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

## Combining with Either

Get `Either<Error, Value>` for explicit error handling without exceptions:

```typescript
import { Effect, Either } from "effect";

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

## Example: CLI Error Handling

Here's a complete example of proper error handling in a CLI application:

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
    const selector = yield* Abi.getFunctionSelectorHex("balanceOf");

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

## Error Inspection with Match

Use Effect's `Match` for exhaustive error handling:

```typescript
import { Effect, Match } from "effect";

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
