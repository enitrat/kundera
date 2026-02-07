# @kundera-sn/kundera-effect

Wallet-first Effect services for Starknet.

## Focus

- Browser wallet provider interactions (`wallet_*`)
- Wallet-first signer layer for write flows
- Contract read service with ABI encoding/decoding
- Optional typed contract registry builder
- Transaction submission via wallet providers
- Receipt polling via Starknet RPC provider
- Schema-first primitive input decoding (`Primitives`)
- Typed errors and Layer-based dependency injection

## Install

```bash
pnpm add @kundera-sn/kundera-effect @kundera-sn/kundera-ts effect
```

## Quick example

```ts
import { Effect } from "effect";
import { Presets, Services } from "@kundera-sn/kundera-effect";

const stack = Presets.SepoliaWalletStack({
  swo: window.starknet_argentX,
});

const program = Effect.gen(function* () {
  const tx = yield* Services.TransactionService;

  const result = yield* tx.sendInvokeAndWait({
    calls: [
      {
        contract_address: "0x123...",
        entry_point: "transfer",
        calldata: ["0xabc", "0x1"],
      },
    ],
  });

  return result;
});

await Effect.runPromise(program.pipe(Effect.provide(stack)));
```

## Boundary validation (recommended)

```ts
import * as S from "effect/Schema";
import { Effect } from "effect";
import { JsonRpc, Primitives } from "@kundera-sn/kundera-effect";

const program = Effect.gen(function* () {
  const address = yield* S.decodeUnknown(Primitives.ContractAddress.Hex)(
    "0x123",
  );
  return yield* JsonRpc.getNonce(address, "latest");
});
```
