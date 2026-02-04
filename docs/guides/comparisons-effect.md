---
title: Library Comparisons
description: Side-by-side comparison of common tasks in Kundera and starknet.js
---

Kundera and starknet.js are both TypeScript libraries for Starknet development. This page compares how to perform common operations across both libraries.

## Address Operations

### Creating and Validating Addresses

<Tabs>
<Tab title="Kundera">

```typescript
import { Effect } from "effect";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
import { ContractAddress as CA } from "@kundera-sn/kundera-ts/ContractAddress";

// Create from hex string (Effect-wrapped, type-safe)
const program = Effect.gen(function* () {
  const addr = yield* ContractAddress.from(
    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
  );
  // addr is ContractAddressType (branded Uint8Array)

  // Convert to hex
  const hex = addr.toHex();
  // "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

  // Convert to bigint
  const bigint = addr.toBigInt();

  return addr;
});

// Validation (synchronous, no Effect)
const isValid = ContractAddress.isValid(
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
);
// true

// Direct creation (throws on invalid, use when you trust input)
const addr = CA("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7");
```

</Tab>
<Tab title="starknet.js">

```typescript
import { validateAndParseAddress, getChecksumAddress } from "starknet";

// Parse and validate address
const addr = validateAndParseAddress(
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
);
// "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

// Get checksummed address
const checksummed = getChecksumAddress(addr);

// Validation
try {
  validateAndParseAddress("invalid");
} catch (e) {
  // Handle error - thrown as exception
}
```

</Tab>
</Tabs>

## Felt252 Handling

### Creating and Converting Felts

<Tabs>
<Tab title="Kundera">

```typescript
import { Effect } from "effect";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";
import { Felt252 as Felt } from "@kundera-sn/kundera-ts/Felt252";

const program = Effect.gen(function* () {
  // From hex string
  const feltHex = yield* Felt252.from("0x123");

  // From bigint
  const feltBigint = yield* Felt252.fromBigInt(291n);

  // From number
  const feltNumber = yield* Felt252.from(291);

  // Conversions
  console.log(Felt252.toHex(feltHex));     // "0x123"
  console.log(Felt252.toBigInt(feltHex));  // 291n

  // Comparison
  console.log(Felt252.equals(feltHex, feltBigint));  // true
  console.log(Felt252.isZero(feltHex));              // false

  return feltHex;
});

// Direct creation (when you trust input)
const felt = Felt("0x123");
const feltFromBigInt = Felt.fromBigInt(291n);

// Constants
console.log(Felt.ZERO);   // Felt252(0)
console.log(Felt.ONE);    // Felt252(1)
console.log(Felt.PRIME);  // Field prime
```

</Tab>
<Tab title="starknet.js">

```typescript
import { num, cairo } from "starknet";

// From hex string
const feltHex = num.toHex("0x123");
// "0x123"

// From bigint
const feltBigint = num.toHex(291n);
// "0x123"

// String conversions
const asHex = num.toHex(291);      // "0x123"
const asBigInt = num.toBigInt("0x123");  // 291n

// cairo.felt for calldata encoding
const felt = cairo.felt("0x123");
// Returns string for use in calldata

// No built-in comparison - manual
const areEqual = num.toBigInt("0x123") === num.toBigInt(291);
```

</Tab>
</Tabs>

## Pedersen and Poseidon Hashing

### Cryptographic Hashing

<Tabs>
<Tab title="Kundera">

```typescript
import { Effect } from "effect";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";
import * as Crypto from "@kundera-sn/kundera-effect/crypto";

const program = Effect.gen(function* () {
  // Load WASM backend (required once, or use Bun for native)
  yield* Crypto.loadWasmCrypto();

  const a = yield* Felt252.from("0x123");
  const b = yield* Felt252.from("0x456");

  // Pedersen hash
  const pedersenResult = yield* Crypto.pedersenHash(a, b);
  console.log(pedersenResult.toHex());

  // Poseidon hash (two values)
  const poseidonResult = yield* Crypto.poseidonHash(a, b);
  console.log(poseidonResult.toHex());

  // Poseidon hash (multiple values)
  const c = yield* Felt252.from("0x789");
  const poseidonMany = yield* Crypto.poseidonHashMany([a, b, c]);
  console.log(poseidonMany.toHex());

  // Starknet Keccak (truncated to 250 bits)
  const keccakResult = yield* Crypto.snKeccak("transfer");
  console.log(keccakResult.toHex());

  return pedersenResult;
});

// Run with explicit error handling
Effect.runPromise(program).catch((error) => {
  if (error._tag === "CryptoError") {
    console.error(`Crypto failed: ${error.message}`);
    console.error(`Operation: ${error.operation}`);
  }
});
```

</Tab>
<Tab title="starknet.js">

```typescript
import { hash, num } from "starknet";

// Pedersen hash
const pedersenResult = hash.computePedersenHash("0x123", "0x456");
// Returns hex string

// Poseidon hash (two values)
const poseidonResult = hash.computePoseidonHash("0x123", "0x456");
// Returns hex string

// Poseidon hash (multiple values)
const poseidonMany = hash.computePoseidonHashOnElements([
  "0x123",
  "0x456",
  "0x789"
]);
// Returns hex string

// Starknet Keccak
const keccakResult = hash.starknetKeccak("transfer");
// Returns bigint

// Convert to hex
const keccakHex = num.toHex(keccakResult);
```

</Tab>
</Tabs>

## ABI Encoding and Decoding

### Function Calldata

<Tabs>
<Tab title="Kundera">

```typescript
import { Effect } from "effect";
import * as Abi from "@kundera-sn/kundera-effect/abi";

const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" }
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external"
  }
] as const;

const program = Effect.gen(function* () {
  // Encode calldata (type-safe with kanabi)
  const calldata = yield* Abi.encodeCalldata(
    erc20Abi,
    "transfer",
    [
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      { low: 1000000000000000000n, high: 0n }  // u256 as struct
    ]
  );
  // Returns bigint[]

  // Get function selector
  const selector = yield* Abi.getFunctionSelector(erc20Abi, "transfer");
  const selectorHex = yield* Abi.getFunctionSelectorHex(erc20Abi, "transfer");

  // Decode calldata back to values
  const decoded = yield* Abi.decodeCalldata(erc20Abi, "transfer", calldata);

  // Decode with named fields
  const decodedObj = yield* Abi.decodeCalldataObject(
    erc20Abi,
    "transfer",
    calldata
  );
  // { recipient: "0x...", amount: { low: 1000000000000000000n, high: 0n } }

  return { calldata, selector };
});
```

</Tab>
<Tab title="starknet.js">

```typescript
import { CallData, cairo } from "starknet";

const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" }
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external"
  }
];

// Create CallData instance
const calldata = new CallData(erc20Abi);

// Compile calldata
const compiled = calldata.compile("transfer", [
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  cairo.uint256(1000000000000000000n)
]);
// Returns string[] (hex strings)

// Parse calldata back to values
const parsed = calldata.parse("transfer", compiled);
// Returns object with named fields

// Get function selector
import { hash } from "starknet";
const selector = hash.getSelectorFromName("transfer");
// Returns hex string
```

</Tab>
</Tabs>

## Contract Calls

### Reading Contract State

<Tabs>
<Tab title="Kundera">

```typescript
import { Effect, Layer } from "effect";
import { Services } from "@kundera-sn/kundera-effect";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  }
] as const;

const program = Effect.gen(function* () {
  const tokenAddress = yield* ContractAddress.from(
    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
  );

  // Create typed contract instance
  const token = yield* Services.Contract.ContractFactory(tokenAddress, erc20Abi);

  const owner = yield* ContractAddress.from("0x...");

  // Type-safe call - balanceOf inferred from ABI
  const balance = yield* token.read.balanceOf(owner);
  // balance is { low: bigint, high: bigint } (u256)

  return balance;
}).pipe(
  Effect.retry({ times: 3 }),
  Effect.timeout("10 seconds"),
  Effect.provide(
    Services.Presets.createHttpProvider("https://starknet-mainnet.public.blastapi.io")
  ),
  Effect.provide(Services.Contract.ContractLayer)
);

// Run with full error handling
Effect.runPromise(program).catch((error) => {
  switch (error._tag) {
    case "PrimitiveError":
      console.error(`Invalid address: ${error.message}`);
      break;
    case "RpcError":
      console.error(`RPC failed: ${error.message}`);
      break;
    case "TransportError":
      console.error(`Network error: ${error.message}`);
      break;
  }
});
```

</Tab>
<Tab title="starknet.js">

```typescript
import { RpcProvider, Contract, cairo } from "starknet";

const provider = new RpcProvider({
  nodeUrl: "https://starknet-mainnet.public.blastapi.io"
});

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  }
];

const tokenAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const contract = new Contract(erc20Abi, tokenAddress, provider);

// Call contract
try {
  const balance = await contract.balanceOf("0x...");
  // balance type is any - no compile-time safety

  // Manual retry logic required
  let attempts = 0;
  while (attempts < 3) {
    try {
      const result = await contract.balanceOf("0x...");
      break;
    } catch (e) {
      attempts++;
      if (attempts >= 3) throw e;
    }
  }
} catch (e) {
  // Error type unknown at compile time
  console.error("Call failed:", e);
}
```

</Tab>
</Tabs>

## Error Handling

### Handling Different Error Types

<Tabs>
<Tab title="Kundera">

```typescript
import { Effect, Match } from "effect";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
import * as Crypto from "@kundera-sn/kundera-effect/crypto";

const program = Effect.gen(function* () {
  const addr = yield* ContractAddress.from("0x123");
  yield* Crypto.loadWasmCrypto();
  const hash = yield* Crypto.pedersenHash(addr, addr);
  return hash;
});

// Pattern match on error types
const handled = program.pipe(
  Effect.catchTags({
    PrimitiveError: (error) =>
      Effect.fail(`Invalid input: ${error.message} (expected: ${error.expected})`),
    CryptoError: (error) =>
      Effect.fail(`Crypto operation failed: ${error.operation}`)
  })
);

// Or use Match for exhaustive handling
const matchError = Match.type<
  | { _tag: "PrimitiveError"; message: string; operation: string }
  | { _tag: "CryptoError"; message: string; operation: string }
  | { _tag: "RpcError"; message: string }
>().pipe(
  Match.tag("PrimitiveError", (e) => `Primitive: ${e.message}`),
  Match.tag("CryptoError", (e) => `Crypto: ${e.message}`),
  Match.tag("RpcError", (e) => `RPC: ${e.message}`),
  Match.exhaustive
);

// Errors are tracked in the type system
// Effect<Felt252Type, PrimitiveError | CryptoError, never>
```

</Tab>
<Tab title="starknet.js">

```typescript
import { validateAndParseAddress, hash, RpcProvider } from "starknet";

// All errors are runtime exceptions
async function riskyOperation() {
  try {
    // Address validation
    const addr = validateAndParseAddress("0x123");

    // Hash computation
    const result = hash.computePedersenHash(addr, addr);

    // RPC call
    const provider = new RpcProvider({ nodeUrl: "..." });
    const block = await provider.getBlock("latest");

    return result;
  } catch (e) {
    // Error type is unknown
    // Must inspect error message or instanceof checks
    if (e instanceof Error) {
      if (e.message.includes("Invalid address")) {
        console.error("Address error");
      } else if (e.message.includes("RPC")) {
        console.error("RPC error");
      } else {
        console.error("Unknown error:", e.message);
      }
    }
    throw e;
  }
}
```

</Tab>
</Tabs>

## Key Differences

### Type System

**Kundera** uses [branded types](./concepts/branded-types.md) for compile-time type safety:

```typescript
type Felt252Type = Brand<Uint8Array, "Felt252"> & FeltMethods;
type ContractAddressType = Brand<Uint8Array, "ContractAddress"> & FeltMethods;
type ClassHashType = Brand<Uint8Array, "ClassHash"> & FeltMethods;
```

The branded type signature proves the value was already runtime-validated. If you have a `ContractAddressType`, it is guaranteed valid.

**starknet.js** uses plain strings everywhere:

```typescript
// All addresses, hashes, and felts are strings
const address: string = "0x049d36...";
const hash: string = "0x07b3e0...";
const felt: string = "0x123";

// No compile-time distinction between address and class hash
function deploy(classHash: string, address: string) { ... }
deploy(address, classHash);  // Compiles but wrong!
```

### Error Handling

**Kundera** uses Effect-TS for explicit, typed errors:

```typescript
// Error types are part of the function signature
const result: Effect<ContractAddressType, PrimitiveError> = ContractAddress.from("0x...");

// Errors tracked through composition
const program: Effect<bigint, PrimitiveError | RpcError | TransportError> = ...

// Pattern match on error tags
Effect.catchTags({
  PrimitiveError: (e) => ...,
  RpcError: (e) => ...,
});
```

**starknet.js** throws exceptions that are hidden in async:

```typescript
// No indication that this throws
const address = validateAndParseAddress("0x...");  // throws!

// Async hides errors completely
const balance = await contract.balanceOf("0x...");  // throws?

// Must wrap everything in try/catch
try {
  const result = await provider.getBlock("latest");
} catch (e) {
  // What type is e? Unknown.
}
```

### Tree-Shaking

**Kundera** provides granular, tree-shakeable imports:

```typescript
// Import only what you need
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";
import { pedersenHash, poseidonHash } from "@kundera-sn/kundera-effect/crypto";
```

**starknet.js** has some tree-shaking support but commonly imports bundle more:

```typescript
// Common pattern imports many utilities
import { RpcProvider, Contract, cairo, num, hash } from "starknet";

// Each utility brings its dependencies
```

### Backend Options

**Kundera** supports multiple backends:

- **WASM** - Works everywhere (browsers, Node.js, serverless). Bundles Starknet cryptography compiled to WebAssembly.
- **Native** - Maximum performance via Bun's FFI. Direct access to native Rust implementations.

```typescript
// WASM (universal)
import * as Crypto from "@kundera-sn/kundera-effect/crypto";
yield* Crypto.loadWasmCrypto();

// Native (Bun only) - auto-detected
// No explicit loading needed
```

**starknet.js** uses JavaScript implementations with some optional noble-curves acceleration.

## See Also

- [Primitives](/primitives) - Felt252, ContractAddress, ClassHash documentation
- [Crypto](/crypto) - Hashing and signature documentation
- [ABI](/abi) - Encoding and decoding documentation
- [Services](/services) - Provider and Contract layers
- [Branded Types](/concepts/branded-types) - Understanding Kundera's type system
