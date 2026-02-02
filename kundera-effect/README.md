# kundera-effect

Effect-TS integration for the Kundera Starknet primitives library.

## Install

```bash
npm install kundera-effect effect @starknet/kundera
```

## Usage

```ts
import * as Effect from "effect/Effect";
import * as Abi from "kundera-effect/abi";

const program = Abi.encodeCalldata(abi, "transfer", [recipient, amount]);
const calldata = await Effect.runPromise(program);
```

## Modules

- `kundera-effect/abi` - Effect wrappers around ABI parsing/encoding/decoding
- `kundera-effect/primitives` - Effect wrappers for Felt/Address primitives
- `kundera-effect/crypto` - Effect wrappers for crypto operations
- `kundera-effect/serde` - Effect wrappers for Cairo serialization
- `kundera-effect/transport` - Effect wrappers for transports
- `kundera-effect/rpc` - Effect wrappers for JSON-RPC methods
- `kundera-effect/native` - Native entrypoint with Effect wrappers
- `kundera-effect/wasm` - WASM entrypoint with Effect wrappers
- `kundera-effect/wasm-loader` - WASM loader Effect wrappers
