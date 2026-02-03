# @kundera-sn/kundera-effect

Effect-TS integration for the [Kundera](https://github.com/enitrat/kundera) Starknet primitives library. Type-safe operations with composable, error-handled Effects.

## Quick Start

**starknet.js** - exceptions hidden in async calls:
```typescript
import { Contract, RpcProvider } from "starknet";

const provider = new RpcProvider({ nodeUrl: "https://..." });
const contract = new Contract(abi, address, provider);

try {
  const balance = await contract.balanceOf(userAddress);
} catch (e) {
  // What kind of error? Network? ABI? Validation?
}
```

**@kundera-sn/kundera-effect** - explicit control over errors and composition:
```typescript
import { Effect } from "effect";
import * as Abi from "@kundera-sn/kundera-effect/abi";
import * as JsonRpc from "@kundera-sn/kundera-effect/jsonrpc";
import { httpTransport } from "@kundera-sn/kundera-effect/transport";

const transport = httpTransport({ url: "https://..." });

const program = Effect.gen(function* () {
  const calldata = yield* Abi.encodeCalldata(abi, "balanceOf", [userAddress]);
  const result = yield* JsonRpc.starknet_call(transport, {
    contract_address: address,
    entry_point_selector: "0x...",
    calldata
  }, "latest");
  return yield* Abi.decodeOutput(abi, "balanceOf", result);
}).pipe(
  Effect.retry({ times: 3 }),           // explicit retry policy
  Effect.timeout("10 seconds"),         // explicit timeout
  Effect.catchTag("RpcError", (e) =>    // typed error handling
    Effect.succeed(0n)
  )
);

const balance = await Effect.runPromise(program);
```

**starknet.js** - Felt and Address are both hex strings, easily confused:
```typescript
import { num } from "starknet";

const address = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const classHash = "0x07b3e05f48f0c69e4a65ce5e076a66271a527aff2c34ce1083ec6e1526997a69";

// TypeScript allows this - runtime bug waiting to happen
await contract.deploy({
  classHash: address,  // oops, passed address as classHash - compiles fine!
});
```

**@kundera-sn/kundera-effect** - branded types prevent mixing:
```typescript
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
import * as ClassHash from "@kundera-sn/kundera-effect/primitives/ClassHash";

const address = yield* ContractAddress.from("0x049d...");
const classHash = yield* ClassHash.from("0x07b3...");

// Type error: ContractAddressType is not assignable to ClassHashType
await deploy({ classHash: address });
```

## Installation

```bash
npm install @kundera-sn/kundera-effect effect @kundera-sn/kundera-ts
```

## Features

- **Typed Errors**: All operations return `Effect<A, E, R>` with precise error types
- **Composable**: Chain operations using Effect's powerful combinators
- **Branded Primitives**: Felt252, ContractAddress, ClassHash can't be mixed up
- **Full Starknet Coverage**: Primitives, ABI, crypto, RPC, transports
- **Zero Runtime Overhead**: Effect's tree-shaking keeps bundles small

## Modules

- `@kundera-sn/kundera-effect/abi` - ABI parsing, encoding, decoding
- `@kundera-sn/kundera-effect/primitives` - Felt252, ContractAddress, ClassHash, etc.
- `@kundera-sn/kundera-effect/crypto` - Pedersen, Poseidon, STARK signatures
- `@kundera-sn/kundera-effect/serde` - Cairo serialization
- `@kundera-sn/kundera-effect/jsonrpc` - Starknet JSON-RPC methods
- `@kundera-sn/kundera-effect/transport` - HTTP and WebSocket transports
- `@kundera-sn/kundera-effect/native` - Native backend with Effect wrappers
- `@kundera-sn/kundera-effect/wasm` - WASM backend with Effect wrappers
- `@kundera-sn/kundera-effect/wasm-loader` - WASM loader utilities

## Error Types

| Error | Module | Description |
|-------|--------|-------------|
| `PrimitiveError` | primitives | Invalid felt, address, or hash |
| `AbiError` | abi | Parse, encode, or decode failure |
| `CryptoError` | crypto | Hash or signature failure |
| `SerdeError` | serde | Serialization failure |
| `RpcError` | jsonrpc | JSON-RPC call failure |
| `TransportError` | transport | Network or connection failure |

## Documentation

- [Overview](./docs/index.md)
- [Primitives](./docs/primitives/index.md) - Felt252, ContractAddress, ClassHash
- [ABI](./docs/modules/abi.md) - ABI encoding and decoding
- [Crypto](./docs/modules/crypto.md) - Hashing and signatures
- [Serde](./docs/modules/serde.md) - Cairo serialization
- [JSON-RPC](./docs/modules/jsonrpc.md) - Starknet JSON-RPC
- [Transport](./docs/modules/transport.md) - HTTP and WebSocket
- [Errors](./docs/modules/errors.md) - Error handling patterns

## License

MIT
