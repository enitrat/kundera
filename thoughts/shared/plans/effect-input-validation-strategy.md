# Effect Input Validation Strategy for Kundera

Date: February 7, 2026  
Status: Proposed  
Scope: `packages/kundera-effect` (with `kundera-ts` as source of truth)

## 1. Goal

Define an Effect-native, schema-first strategy to transform user inputs (`unknown`/`string`) into validated Starknet primitives:
- `ContractAddressType`
- `StorageKeyType`
- `Felt252Type`
- `ClassHashType`

This document focuses on boundary validation (CLI args, env vars, HTTP payloads) and how validated values flow into typed `JsonRpc.*` APIs.

## 2. Design Principles (Effect + Voltaire-informed)

1. Decode at boundaries, keep internals typed.
2. Validation must be explicit and typed (`ParseError`), never hidden behind `as` casts.
3. Domain logic should accept branded primitives, not raw strings.
4. Reuse `kundera-ts` constructors for runtime guarantees; do not duplicate primitive logic.
5. Keep `JsonRpc.*` request builders typed (`Rpc.*Request`), avoid raw endpoint strings in app code.

## 3. Primary References

Effect docs:
- https://effect.website/docs/schema/introduction/
- https://effect.website/docs/schema/getting-started/
- https://effect.website/docs/schema/transformations/
- https://effect.website/docs/schema/error-formatters/
- https://effect.website/docs/schema/annotations/
- https://effect.website/docs/error-management/expected-errors/

Voltaire reference implementation:
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/primitives/Address/Hex.ts`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/services/Provider/types.ts`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/getting-started.mdx`

## 3.1 What Voltaire does (concrete pattern)

1. Strict schema codec for primitive:
   - `Address.Hex` is implemented with `S.transformOrFail(..., { strict: true, decode, encode })`.
   - decode path constructs validated address, failures return parse failures.
2. Docs enforce boundary decode:
   - `S.decodeSync(Address.Hex)(input)` is the canonical parsing example.
   - docs explicitly recommend decoding user input at boundaries.
3. Service ergonomics:
   - provider methods accept `AddressInput = AddressType | 0x-string`.
   - conversion helpers normalize to hex (`toAddressHex`).

Kundera adaptation:
- keep the same "decode -> use" shape,
- but enforce that recommended public paths never bypass schema validation for raw user input.

## 4. Recommended Validation Pipeline

## 4.1 Boundary Layer (unknown -> validated primitive)

Use `Schema.decodeUnknown` (or `decodeUnknownEither`/`decodeUnknownSync` depending context) on `unknown` user input.

Example (preferred in Effect programs):

```ts
import * as S from "effect/Schema";
import * as Effect from "effect/Effect";
import * as Primitives from "@kundera-sn/kundera-effect/primitives";

const decodeAddress = (input: unknown) =>
  S.decodeUnknown(Primitives.ContractAddress.Hex)(input);
// Effect<ContractAddressType, ParseError>
```

Why:
- `decodeUnknown` keeps parsing in the Effect error channel.
- failures are typed (`ParseError`), composable with `catchTag`.

## 4.2 Domain Layer (validated primitive only)

Core operations accept only validated branded types:

```ts
const getNonceTyped = (address: ContractAddressType) =>
  JsonRpc.getNonce(address, "latest");
```

This avoids accidental string plumbing inside business logic.

## 4.3 Boundary Error Rendering

Map `ParseError` once at the edge:
- human-readable: `ParseResult.TreeFormatter.formatErrorSync(error)`
- structured/logging: `ParseResult.ArrayFormatter.formatErrorSync(error)`

```ts
import * as ParseResult from "effect/ParseResult";
import * as Effect from "effect/Effect";

const renderParseError = (error: ParseResult.ParseError) =>
  ParseResult.TreeFormatter.formatErrorSync(error);

const program = decodeAddress(userInput).pipe(
  Effect.catchTag("ParseError", (error) =>
    Effect.fail(new Error(renderParseError(error))),
  ),
);
```

## 5. Schema Construction Pattern (Kundera)

Each primitive hex schema should:
1. decode `string -> branded type` using the existing constructor in `kundera-ts`;
2. encode `branded type -> canonical hex` via `.toHex()`;
3. set meaningful annotations (`identifier`, `title`, `description`, `message`, `examples`).

Example blueprint:

```ts
import * as S from "effect/Schema";
import * as ParseResult from "effect/ParseResult";
import { ContractAddress, type ContractAddressType } from "@kundera-sn/kundera-ts";

export const ContractAddressTypeSchema: S.Schema<ContractAddressType> =
  // implementation detail: schema carrier for branded output type
  S.declare<ContractAddressType>((u): u is ContractAddressType => {
    return typeof u === "object" && u !== null && "toHex" in (u as any);
  });

export const Hex: S.Schema<ContractAddressType, string> = S.transformOrFail(
  S.String,
  ContractAddressTypeSchema,
  {
    strict: true,
    decode: (value, _opts, ast) => {
      try {
        return ParseResult.succeed(ContractAddress(value));
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message));
      }
    },
    encode: (value) => ParseResult.succeed(value.toHex() as string),
  },
).annotations({
  identifier: "Kundera.ContractAddress.Hex",
  message: () => "Invalid Starknet contract address",
});
```

Notes:
- exact `ContractAddressTypeSchema` carrier can be refined at implementation time.
- parsing logic must delegate to `kundera-ts` constructor to keep one source of truth.

## 6. Parse Options by Interface Type

Use explicit parse options to keep behavior deterministic.

CLI:
- `errors: "all"`
- `onExcessProperty`: generally not relevant for scalar args

HTTP/JSON payloads:
- `errors: "all"` (report full diagnostics)
- `onExcessProperty: "error"` (reject unknown keys)

This aligns with Effect Schema guidance for strict input contracts.

## 7. API Shape Recommendation

## 7.1 Strict core (preferred)

Keep strict signatures for typed APIs:

```ts
JsonRpc.getNonce(address: ContractAddressType, blockId?: BlockId)
JsonRpc.getStorageAt(address: ContractAddressType, key: StorageKeyType, blockId?: BlockId)
```

## 7.2 Input adapters (optional convenience)

If ergonomic wrappers are exposed, they must decode via schema first:

```ts
JsonRpcInput.getNonce(addressInput: unknown, blockId?: BlockId)
// Effect<string, ParseError | TransportError | RpcError, ProviderService>
```

No wrapper should cast `string as 0x...` without schema decode.

## 8. File Layout Proposal

```txt
packages/kundera-effect/src/primitives/
  index.ts
  decode.ts
  format.ts
  schema/
    ContractAddress.ts
    StorageKey.ts
    Felt252.ts
    ClassHash.ts
    index.ts
```

Responsibilities:
- `schema/*`: codecs only
- `decode.ts`: convenience decode functions built from schema
- `format.ts`: parse error rendering helpers

## 9. End-to-End Example (CLI Command)

```ts
import * as S from "effect/Schema";
import * as Effect from "effect/Effect";
import * as ParseResult from "effect/ParseResult";
import { JsonRpc, Primitives } from "@kundera-sn/kundera-effect";

const command = (rawAddress: unknown) =>
  Effect.gen(function* () {
    const address = yield* S.decodeUnknown(Primitives.ContractAddress.Hex)(rawAddress);
    const nonce = yield* JsonRpc.getNonce(address, "latest");
    console.log(nonce);
  }).pipe(
    Effect.catchTag("ParseError", (error) =>
      Effect.fail(new Error(ParseResult.TreeFormatter.formatErrorSync(error))),
    ),
  );
```

## 10. Test Strategy

1. Schema decode/encode tests:
   - valid input round-trip
   - invalid input fails with `ParseError`
2. Adapter tests:
   - unknown/string input decoded then forwarded to strict API
3. Error formatting snapshot tests:
   - `TreeFormatter` output for common invalid cases
4. Integration tests:
   - CLI command with invalid address fails with readable validation message

## 11. Explicit Decisions

1. Schema-first validation is mandatory for user input boundaries.
2. `kundera-ts` constructors remain the canonical runtime validators.
3. Typed `JsonRpc.*` stays the primary path; raw `provider.request("starknet_*", ...)` remains low-level escape hatch.
4. Documentation must show "Decode -> Use -> Provide" as the default happy path.
