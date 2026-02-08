# Voltaire Effect Schema Patterns

Deep analysis of how `voltaire-effect` handles Schema validation — the pipeline from untrusted user input to verified Effect types. Based on reading 30+ source files across `voltaire-effect` and `voltaire-ts`.

---

## Architecture Overview

Voltaire uses a **two-package split** identical to kundera:

| Package | Role | Schema involvement |
|---------|------|--------------------|
| `voltaire-ts` (base) | Pure TS primitives, branded types, constructors, validation | Throws plain errors (extends `AbstractError`) |
| `voltaire-effect` | Effect wrappers, Schema definitions, services, layers | Catches base errors, wraps in `ParseResult.fail` or `Effect.try` |

**Key insight**: Schemas in `voltaire-effect` are thin validation bridges. They delegate ALL actual parsing/validation to `voltaire-ts` constructors and catch thrown errors as `ParseResult.Type` failures.

---

## Pattern 1: `S.declare` — Type Guard Schema

Every branded type gets a `S.declare` schema that acts as a runtime type guard for the output side of transforms.

```typescript
// File: Address/AddressSchema.ts
import type { AddressType } from "@tevm/voltaire/Address";
import * as S from "effect/Schema";

export const AddressTypeSchema = S.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: "Address" },
);
```

```typescript
// File: Hash/Hex.ts (inline variant)
const HashTypeSchema = S.declare<HashType>(
  (u): u is HashType => u instanceof Uint8Array && u.length === 32,
  { identifier: "Hash" },
);
```

```typescript
// File: Uint64/Uint64Schema.ts
const Uint64TypeSchema = S.declare<Uint64Type>(
  (u): u is Uint64Type => {
    if (typeof u !== "bigint") return false;
    return Uint64.isValid(u);
  },
  { identifier: "Uint64" },
);
```

**Pattern**: `S.declare<BrandedType>(typeGuardFn, { identifier })` — always the target/output schema in transforms.

**Kundera equivalent**: Uses `Schema.Any as Schema.Schema<Felt252Type>` — weaker, no runtime validation on the output side.

---

## Pattern 2: `S.transformOrFail` — The Core Validation Bridge

Every wire-format-to-branded-type conversion uses `S.transformOrFail`. This is the trust boundary.

### Hex String -> Branded Type

```typescript
// File: Address/Hex.ts
export const Hex: S.Schema<AddressType, string> = S.transformOrFail(
  S.String,                    // INPUT: any string
  AddressTypeSchema,           // OUTPUT: branded AddressType
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Address(s));  // delegate to base constructor
      } catch (e) {
        return ParseResult.fail(
          new ParseResult.Type(ast, s, (e as Error).message),
        );
      }
    },
    encode: (addr, _options, _ast) => {
      return ParseResult.succeed(Address.toHex(addr));
    },
  },
).annotations({
  identifier: "Address.Hex",
  title: "Ethereum Address",
  description: "A 20-byte Ethereum address as a hex string...",
  examples: EXAMPLE_ADDRESSES,
  message: () => "Invalid Ethereum address: expected 40 hex characters with 0x prefix",
});
```

### Bytes -> Branded Type

```typescript
// File: Address/Bytes.ts
export const Bytes: S.Schema<AddressType, Uint8Array> = S.transformOrFail(
  S.Uint8ArrayFromSelf,        // INPUT: raw bytes
  AddressTypeSchema,           // OUTPUT: branded AddressType
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        return ParseResult.succeed(Address.fromBytes(bytes));
      } catch (e) {
        return ParseResult.fail(
          new ParseResult.Type(ast, bytes, (e as Error).message),
        );
      }
    },
    encode: (addr, _options, _ast) => {
      return ParseResult.succeed(Address.toBytes(addr));
    },
  },
).annotations({ identifier: "Address.Bytes" });
```

### Union Input (number | bigint | string)

```typescript
// File: Uint64/Uint64Schema.ts
export const Schema: S.Schema<Uint64Type, number | bigint | string> =
  S.transformOrFail(
    S.Union(S.Number, S.BigIntFromSelf, S.String),  // multiple input types
    Uint64TypeSchema,
    {
      strict: true,
      decode: (value, _options, ast) => {
        try {
          return ParseResult.succeed(Uint64.from(value));
        } catch (e) {
          return ParseResult.fail(
            new ParseResult.Type(ast, value, (e as Error).message),
          );
        }
      },
      encode: (i) => ParseResult.succeed(i as bigint),
    },
  ).annotations({ identifier: "Uint64Schema" });
```

**Universal pattern**: `try { return ParseResult.succeed(Constructor(input)) } catch (e) { return ParseResult.fail(new ParseResult.Type(ast, input, message)) }`

---

## Pattern 3: Multiple Encoding Schemas per Primitive

Each primitive exports multiple schemas for different wire encodings:

```
Address/
  AddressSchema.ts  → AddressTypeSchema (S.declare, type guard only)
  Hex.ts            → Schema<AddressType, string>         (hex strings)
  Bytes.ts          → Schema<AddressType, Uint8Array>     (raw bytes)
  Checksummed.ts    → Schema<AddressType, string>         (EIP-55 checksummed)

Uint64/
  Uint64Schema.ts   → Schema<Uint64Type, number|bigint|string>  (any numeric)
  Hex.ts            → Schema<Uint64Type, string>                (hex string)
  BigInt.ts         → Schema<Uint64Type, bigint>                (bigint)
  String.ts         → Schema<Uint64Type, string>                (decimal string)
  Bytes.ts          → Schema<Uint64Type, Uint8Array>            (bytes)
  Number.ts         → Schema<Uint64Type, number>                (number)

Hash/
  Hex.ts            → Schema<HashType, string>
  Bytes.ts          → Schema<HashType, Uint8Array>
```

**Usage**: Pick the schema matching your wire format:
```typescript
// From JSON-RPC (hex strings)
const addr = S.decodeSync(Address.Hex)("0x742d35cc...")

// From binary protocol (bytes)
const addr = S.decodeSync(Address.Bytes)(uint8array)

// From config (checksum validation)
const addr = S.decodeSync(Address.Checksummed)("0x742d35Cc...")
```

---

## Pattern 4: Composite Schema via `S.Struct` + `S.transformOrFail`

For RPC response structures, Voltaire composes primitive schemas:

```typescript
// File: BlockHeader/Rpc.ts

// Step 1: Declare wire format as S.Struct
const RpcBlockHeaderSchema = S.Struct({
  parentHash: S.String,
  sha3Uncles: S.String,
  miner: S.String,
  stateRoot: S.String,
  number: S.String,
  gasLimit: S.String,
  baseFeePerGas: S.optional(S.String),
  // ... other fields as strings (JSON-RPC wire format)
});

// Step 2: Transform entire struct to domain type
export const Rpc: S.Schema<BlockHeaderType, Encoded<typeof RpcBlockHeaderSchema>> =
  S.transformOrFail(
    RpcBlockHeaderSchema,      // Wire format (all strings)
    BlockHeaderTypeSchema,     // Domain type (branded Uint8Arrays + bigints)
    {
      strict: true,
      decode: (rpc, _options, ast) => {
        try {
          return ParseResult.succeed(BlockHeader.fromRpc(rpc as RpcBlockHeader));
        } catch (e) {
          return ParseResult.fail(
            new ParseResult.Type(ast, rpc, (e as Error).message),
          );
        }
      },
      encode: (_header, _options, ast) => {
        return ParseResult.fail(
          new ParseResult.Type(ast, _header, "Encoding not yet supported"),
        );
      },
    },
  ).annotations({ identifier: "BlockHeader.Rpc" });
```

**Key**: The struct schema validates shape at the wire level (all strings), then `transformOrFail` delegates to `fromRpc()` which does the actual hex->bytes/bigint conversion. Field-level schemas are NOT composed here — the base package does field conversion.

---

## Pattern 5: ABI Schema with Recursive Types

```typescript
// File: Abi/AbiSchema.ts

// Recursive parameter schema (tuple types contain nested parameters)
interface ParameterInternal {
  readonly type: string;
  readonly name?: string;
  readonly internalType?: string;
  readonly indexed?: boolean;
  readonly components?: readonly ParameterInternal[];  // recursive
}

export const ParameterSchema: S.Schema<ParameterInternal> = S.Struct({
  type: S.String,
  name: S.optional(S.String),
  internalType: S.optional(S.String),
  indexed: S.optional(S.Boolean),
  components: S.optional(S.suspend(() => S.Array(ParameterSchema))),  // S.suspend for recursion
});

// Discriminated union via S.Literal on `type` field
const FunctionSchemaInternal = S.Struct({
  type: S.Literal("function"),
  name: S.String,
  stateMutability: StateMutabilitySchema,
  inputs: S.Array(ParameterSchema),
  outputs: S.Array(ParameterSchema),
});

// Union of all ABI item types
const ItemSchemaInternal = S.Union(
  FunctionSchemaInternal,
  EventSchemaInternal,
  ErrorSchemaInternal,
  ConstructorSchemaInternal,
  FallbackSchemaInternal,
  ReceiveSchemaInternal,
);

// Final ABI schema: array of items -> branded Abi instance
export const fromArray = S.transformOrFail(
  S.Array(ItemSchemaInternal),
  AbiInstanceGuardSchema,
  {
    strict: true,
    decode: (items, _options, ast) => {
      try {
        return ParseResult.succeed(Abi(items));
      } catch (e) {
        return ParseResult.fail(
          new ParseResult.Type(ast, items, (e as Error).message),
        );
      }
    },
    encode: (abi) => ParseResult.succeed(Array.from(abi)),
  },
).annotations({ identifier: "Abi.fromArray" });
```

**Techniques used**:
- `S.suspend()` for recursive types
- `S.Literal("function")` as discriminant
- `S.Union(...)` for tagged unions
- `S.optional(...)` for optional fields
- Final `S.transformOrFail` to branded constructor

---

## Pattern 6: Effect-Wrapped Constructors (Non-Schema)

Alongside schemas, every primitive also exports Effect-wrapped constructor functions:

```typescript
// File: Address/from.ts
export const from = (
  value: string | Uint8Array | number | bigint,
): Effect.Effect<AddressType, ValidationError> =>
  Effect.try({
    try: () => Address.from(value),
    catch: (error) =>
      new ValidationError(
        error instanceof Error ? error.message : "Invalid address input",
        {
          value,
          expected: "20-byte hex string or Uint8Array",
          cause: error instanceof Error ? error : undefined,
        },
      ),
  });

// File: Address/fromHex.ts
export const fromHex = (value: string): Effect.Effect<AddressType, AddressError> =>
  Effect.try({
    try: () => Address.fromHex(value),
    catch: (e) => e as AddressError,
  });
```

**When to use which**:
- **Schema** (`S.decodeSync(Address.Hex)(value)`) — for parsing untrusted external data (RPC responses, user input, config)
- **Effect constructor** (`Address.from(value)`) — for known-format data within Effect pipelines
- **Pure constructor** (`Address("0x...")`) — for trusted data in non-Effect code

---

## Pattern 7: `Data.TaggedError` for Service Errors

All Effect-layer errors use `Data.TaggedError`, NOT `Schema.TaggedError`:

```typescript
// File: jsonrpc/errors.ts
export class JsonRpcParseError extends Data.TaggedError("JsonRpcParseError")<{
  readonly input: unknown;
  readonly message: string;
  readonly cause?: unknown;
  readonly context?: Record<string, unknown>;
}> {
  constructor(
    input: unknown,
    message?: string,
    options?: { cause?: unknown; context?: Record<string, unknown> },
  ) {
    super({
      input,
      message: message ?? "Failed to parse JSON-RPC message",
      cause: options?.cause,
      context: options?.context,
    });
  }
}

// File: AbiEncoder/AbiEncoderService.ts
export class AbiEncodeError extends Data.TaggedError("AbiEncodeError")<{
  readonly functionName: string;
  readonly args: readonly unknown[];
  readonly message: string;
  readonly cause?: unknown;
}> {}
```

**Voltaire error hierarchy**:
- Base package: `AbstractError` (plain `Error` subclass with `_tag`, `code`, `context`, `docsPath`)
- Effect package: `Data.TaggedError` (Effect-native, structural equality, `_tag` discriminant)
- RPC errors: One class per JSON-RPC error code, each with `rpcCode` field matching spec codes
- Error codes mapped via `parseErrorCode(input)` factory function

---

## Pattern 8: `Effect.Config` for Transport Configuration

```typescript
// File: Transport/HttpTransportConfig.ts
export const HttpTransportConfigSchema = Config.all({
  url: Config.string("url").pipe(
    Config.validate({
      message: "URL must start with http:// or https://",
      validation: (s) => s.startsWith("http://") || s.startsWith("https://"),
    }),
  ),
  timeout: Config.duration("timeout").pipe(
    Config.withDefault(Duration.seconds(30)),
  ),
  retryMaxAttempts: Config.integer("retryMaxAttempts").pipe(
    Config.withDefault(3),
  ),
  headers: Config.hashMap(Config.string(), "headers").pipe(
    Config.withDefault(HashMap.empty()),
  ),
  apiKey: Config.secret("apiKey").pipe(Config.option),
}).pipe(Config.nested("http"));
```

This is NOT `effect/Schema` — it uses `effect/Config` which is separate. But it provides validated configuration with secrets handling.

---

## Pattern 9: `effect/Brand` for Simple Numeric Types

For primitive-based branded types (string, number, bigint), Voltaire uses `effect/Brand` directly:

```typescript
// File: Brand/index.ts
export type Wei = bigint & Brand.Brand<"Wei">;
export const Wei = Brand.refined<Wei>(
  (n): n is Brand.Brand.Unbranded<Wei> => n >= 0n,
  (n) => Brand.error(`Expected ${n} to be a non-negative Wei value`),
);

// Nominal (no validation, just type tagging)
export type TxHashString = string & Brand.Brand<"TxHashString">;
export const TxHashString = Brand.nominal<TxHashString>();
```

**Explicit decision**: `effect/Brand` is for NEW primitive-based types only. Existing Uint8Array-based brands (Address, Hash) use `S.declare` + `S.transformOrFail` instead, because Brand doesn't handle Uint8Array bases well.

---

## The Trust Boundary Pipeline (End-to-End)

### Flow: Untrusted hex string -> Validated AddressType

```
User Input: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
     |
     v
[S.String]                    ← Schema validates it's a string
     |
     v
[S.transformOrFail.decode]    ← Calls Address(s) from voltaire-ts
     |                           Address() internally:
     |                             1. Validates 0x prefix
     |                             2. Validates hex characters
     |                             3. Validates length (40 hex = 20 bytes)
     |                             4. Converts hex -> Uint8Array
     |                             5. Brands as AddressType
     |
     v  (on success)
[ParseResult.succeed(addr)]   ← Returns branded AddressType
     |
     v  (on failure)
[ParseResult.fail(            ← Returns ParseError with message from base error
  new ParseResult.Type(ast, input, errorMessage)
)]
     |
     v
[.annotations({...})]        ← Adds identifier, title, description, examples, message
     |
     v
Effect<AddressType, ParseError>  ← Final result type
```

### Flow: RPC JSON response -> Validated BlockHeader

```
RPC Response: { parentHash: "0x...", number: "0x1234", ... }
     |
     v
[S.Struct({ parentHash: S.String, number: S.String, ... })]
     |                         ← Validates JSON shape: all required fields present,
     |                           all are strings, optional fields handled
     v
[S.transformOrFail.decode]
     |                         ← Calls BlockHeader.fromRpc(rpc) from voltaire-ts
     |                           fromRpc() internally:
     |                             1. Hex-decodes each hash field -> Uint8Array
     |                             2. Hex-decodes number fields -> bigint
     |                             3. Handles optional post-fork fields
     |                             4. Returns typed BlockHeaderType
     v
Effect<BlockHeaderType, ParseError>
```

### Flow: ABI array from user -> Validated Abi instance

```
User Input: [{ type: "function", name: "transfer", ... }]
     |
     v
[S.Array(ItemSchemaInternal)]
     |                         ← For each item:
     |                           S.Union discriminates on `type` field
     |                           FunctionSchema validates: name, stateMutability, inputs[], outputs[]
     |                           ParameterSchema validates recursively (tuple components)
     v
[S.transformOrFail.decode]
     |                         ← Calls Abi(items) constructor
     |                           Abi() validates: no duplicate selectors, valid signatures
     v
Effect<AbiInstance, ParseError>
```

---

## Comparison: Voltaire vs Kundera Current State

### What Kundera Does Well

1. **Same `S.transformOrFail` pattern** — Kundera's Felt252.Hex, ContractAddress.Hex, ClassHash.Hex, StorageKey.Hex all follow the exact same `try/catch -> ParseResult.succeed/fail` pattern.

2. **Delegates to base constructors** — `Felt252(value)`, `ContractAddress(value)` etc. No reimplementation.

3. **Annotations present** — `identifier`, `title`, `description`, `message` on all schemas.

4. **Pre-built decode helpers** — `decodeFelt252`, `decodeContractAddress` etc. for convenience.

### Gaps in Kundera

| Gap | Voltaire approach | Kundera current |
|-----|-------------------|-----------------|
| **Type guard schemas** | `S.declare<T>(typeGuard)` with real validation | `Schema.Any as Schema.Schema<T>` — no output validation |
| **Multiple encodings** | `Address.Hex`, `Address.Bytes`, `Address.Checksummed` | Only `*.Hex` for each type |
| **RPC response schemas** | `BlockHeader.Rpc` with `S.Struct` for wire shape | Manual `fromRpc()` calls, no schema validation of RPC JSON |
| **ABI schemas** | Full `AbiSchema.ts` with recursive parameter validation | None — ABI validation is pure kundera-ts |
| **Uint schemas** | `Uint64.Hex`, `Uint64.BigInt`, `Uint64.String` etc. | None — no Effect schemas for numeric Cairo types |
| **Brand module** | Explicit `Brand.refined` for numeric brands (Wei, Gas) | N/A — using kundera-ts branded types only |
| **Validation assertions** | Dedicated `validation/` directory with `assertUint8`, `assertUint256`, etc. | N/A — validation in kundera-ts constructors |
| **Error granularity** | Per-RPC-code error classes, `parseErrorCode()` factory | Single `RpcError` class for all codes |

### Critical Gap: `Schema.Any as Schema.Schema<T>`

Kundera's schemas use this escape hatch:

```typescript
// KUNDERA (weak)
const Felt252TypeSchema = Schema.Any as Schema.Schema<Felt252Type>;
```

```typescript
// VOLTAIRE (strong)
const AddressTypeSchema = S.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: "Address" },
);
```

The `Schema.Any` cast means the output side of `transformOrFail` accepts anything — if the decode function returns the wrong type, the schema won't catch it. With `S.declare`, there's a runtime type guard that validates the output matches the branded type.

---

## Recommendations for kundera-effect

### Priority 1: Replace `Schema.Any` with `S.declare`

```typescript
// Before
const Felt252TypeSchema = Schema.Any as Schema.Schema<Felt252Type>;

// After
const Felt252TypeSchema = S.declare<Felt252Type>(
  (u): u is Felt252Type =>
    u instanceof Uint8Array && u.length === 32 && "_brand" in u,
  { identifier: "Felt252" },
);
```

Do this for: `Felt252Type`, `ContractAddressType`, `ClassHashType`, `StorageKeyType`.

### Priority 2: Add Bytes encoding schemas

For each primitive, add a `Bytes` schema alongside `Hex`:

```typescript
// primitives/schema/Felt252.ts (add)
export const Bytes: S.Schema<Felt252Type, Uint8Array> = S.transformOrFail(
  S.Uint8ArrayFromSelf,
  Felt252TypeSchema,
  {
    strict: true,
    decode: (bytes, _, ast) => {
      try {
        return ParseResult.succeed(Felt252.fromBytes(bytes));
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(ast, bytes, (error as Error).message),
        );
      }
    },
    encode: (value) => ParseResult.succeed(value.toBytes()),
  },
).annotations({ identifier: "Kundera.Felt252.Bytes" });
```

### Priority 3: RPC response schemas

Create schemas for decoding JSON-RPC responses (the BlockHeader, Transaction, etc. that come back as hex-encoded JSON):

```typescript
// primitives/schema/BlockHeader.ts
const RpcBlockHeaderSchema = S.Struct({
  block_hash: S.String,
  parent_hash: S.String,
  block_number: S.Number,
  // ... Starknet block header fields
});

export const Rpc = S.transformOrFail(
  RpcBlockHeaderSchema,
  BlockHeaderTypeSchema,
  {
    decode: (rpc, _, ast) => {
      try {
        return ParseResult.succeed(blockHeaderFromRpc(rpc));
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, rpc, (e as Error).message));
      }
    },
    encode: (header) => ParseResult.succeed(blockHeaderToRpc(header)),
  },
).annotations({ identifier: "Kundera.BlockHeader.Rpc" });
```

### Priority 4: Numeric type schemas (Cairo Uint/Int)

Starknet has u8, u16, u32, u64, u128, u256 and i8...i128. Create schemas for these:

```typescript
// primitives/schema/Uint256.ts
export const Hex: S.Schema<Uint256Type, string> = ...
export const BigInt: S.Schema<Uint256Type, bigint> = ...
```

### Priority 5: Granular RPC error classes

Split `RpcError` into per-code errors for better `Effect.catchTag`:

```typescript
export class ContractNotFoundError extends Data.TaggedError("ContractNotFoundError")<{
  readonly contractAddress: string;
  readonly message: string;
  readonly rpcCode: number;
}> {}

export class BlockNotFoundError extends Data.TaggedError("BlockNotFoundError")<{ ... }> {}

export function parseStarknetRpcError(input: { code: number; message: string }): StarknetRpcError {
  // Map Starknet error codes to specific error classes
}
```

---

## Summary of Voltaire Schema Patterns

| Pattern | Effect API | Purpose |
|---------|-----------|---------|
| Type guard | `S.declare<T>(guard, { identifier })` | Runtime validation of branded output types |
| Validation bridge | `S.transformOrFail(Input, Output, { decode, encode })` | Trust boundary: untrusted -> branded |
| Wire shape | `S.Struct({ field: S.String, ... })` | Validate JSON-RPC response shape |
| Optional fields | `S.optional(S.String)` | Handle post-fork or nullable RPC fields |
| Recursive types | `S.suspend(() => S.Array(Schema))` | ABI parameter components (tuples) |
| Discriminated unions | `S.Union(S.Struct({ type: S.Literal("x") }), ...)` | ABI item type discrimination |
| Annotations | `.annotations({ identifier, title, description, examples, message })` | Schema metadata for error messages |
| Encoding variants | `Address.Hex`, `Address.Bytes`, `Address.Checksummed` | Multiple wire format schemas per type |
| Effect constructors | `Effect.try({ try: Constructor, catch: ErrorMapper })` | Imperative constructor -> Effect |
| Tagged errors | `Data.TaggedError("Tag")<{ fields }>` | Structural equality, `_tag` discriminant |
| Config schemas | `Config.all({ field: Config.string().pipe(...) })` | Environment/file configuration |
| Brand (numeric) | `Brand.refined<T>(guard, errorFn)` | Simple branded numbers/bigints |
| Brand (nominal) | `Brand.nominal<T>()` | No-validation type tagging |
