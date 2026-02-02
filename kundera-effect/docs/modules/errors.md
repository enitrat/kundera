---
title: Errors
description: Error handling patterns with Effect
---

# Errors

kundera-effect uses Effect's `TaggedError` for type-safe error handling across all modules.

## Error Types

| Error | Tag | Module |
|-------|-----|--------|
| `PrimitiveError` | `"PrimitiveError"` | primitives |
| `AbiError` | - | abi (from kundera) |
| `CryptoError` | `"CryptoError"` | crypto |
| `SerdeError` | `"SerdeError"` | serde |
| `RpcError` | `"RpcError"` | rpc |
| `TransportError` | `"TransportError"` | transport |

## Error Structure

All errors share a common structure:

```typescript
interface ErrorFields {
  message: string;      // Human-readable description
  operation: string;    // Operation that failed (e.g., "Felt252.from")
  input?: unknown;      // The input that caused the error
  expected?: string;    // What was expected
  cause?: unknown;      // Underlying error
}
```

## Catching Errors

### By Tag

```typescript
import { Effect } from "effect";
import * as Felt252 from "kundera-effect/primitives/Felt252";

const program = Felt252.from("invalid").pipe(
  Effect.catchTag("PrimitiveError", (e) => {
    console.log("Primitive failed:", e.message);
    return Effect.succeed(Felt252.ZERO);
  })
);
```

### Multiple Error Types

```typescript
import { Effect } from "effect";
import * as Abi from "kundera-effect/abi";
import * as Rpc from "kundera-effect/rpc";

const program = Effect.gen(function* () {
  const calldata = yield* Abi.encodeCalldata(abi, "transfer", args);
  const result = yield* Rpc.starknet_call(transport, call, "latest");
  return result;
}).pipe(
  Effect.catchTags({
    AbiError: (e) => Effect.fail(`ABI error: ${e.message}`),
    RpcError: (e) => Effect.fail(`RPC error: ${e.message}`)
  })
);
```

### Catch All

```typescript
const program = myEffect.pipe(
  Effect.catchAll((e) => {
    console.log("Operation failed:", e);
    return Effect.succeed(defaultValue);
  })
);
```

## Error Inspection

```typescript
import { Effect, Match } from "effect";

const handleError = Match.type<PrimitiveError | CryptoError | RpcError>().pipe(
  Match.tag("PrimitiveError", (e) => `Invalid primitive: ${e.input}`),
  Match.tag("CryptoError", (e) => `Crypto failed: ${e.operation}`),
  Match.tag("RpcError", (e) => `RPC failed: ${e.message}`),
  Match.exhaustive
);

const program = myEffect.pipe(
  Effect.catchAll((e) => {
    const message = handleError(e);
    return Effect.fail(new Error(message));
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
  ),
  // Only retry on specific errors
  Effect.retry({
    times: 3,
    while: (e) => e._tag === "RpcError" && isRetryable(e)
  })
);
```

## Mapping Errors

```typescript
import { Effect } from "effect";

// Map to a different error type
const program = Felt252.from(value).pipe(
  Effect.mapError((e) => new MyCustomError(e.message))
);

// Add context
const program = Felt252.from(value).pipe(
  Effect.mapError((e) => ({
    ...e,
    context: "parsing user input"
  }))
);
```

## Combining with Either

```typescript
import { Effect, Either } from "effect";

// Get Either<Error, Value> instead of throwing
const result = await Effect.runPromise(
  Felt252.from(value).pipe(Effect.either)
);

if (Either.isLeft(result)) {
  console.log("Error:", result.left.message);
} else {
  console.log("Value:", result.right);
}
```

## Example: Full Error Handling

```typescript
import { Effect, Match } from "effect";
import * as Primitives from "kundera-effect/primitives";
import * as Abi from "kundera-effect/abi";
import * as Rpc from "kundera-effect/rpc";

const transfer = (to: string, amount: bigint) =>
  Effect.gen(function* () {
    // Parse address - may throw PrimitiveError
    const recipient = yield* Primitives.ContractAddress.from(to);

    // Encode calldata - may throw AbiError
    const calldata = yield* Abi.encodeCalldata(
      erc20Abi,
      "transfer",
      [recipient, amount]
    );

    // Execute - may throw RpcError
    const result = yield* Rpc.starknet_call(transport, {
      contract_address: TOKEN_ADDRESS,
      entry_point_selector: TRANSFER_SELECTOR,
      calldata
    }, "latest");

    return result;
  }).pipe(
    Effect.catchTags({
      PrimitiveError: (e) => {
        console.error(`Invalid address: ${e.input}`);
        return Effect.fail(new Error("Invalid recipient address"));
      },
      AbiError: (e) => {
        console.error(`Encoding failed: ${e.message}`);
        return Effect.fail(new Error("Failed to encode transfer"));
      },
      RpcError: (e) => {
        console.error(`RPC failed: ${e.message}`);
        return Effect.fail(new Error("Transfer execution failed"));
      }
    }),
    Effect.retry({ times: 3 }),
    Effect.timeout("30 seconds")
  );
```
