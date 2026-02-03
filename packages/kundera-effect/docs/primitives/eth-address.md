---
title: EthAddress
description: Ethereum address type (20 bytes)
---

# EthAddress

The `EthAddress` module provides a type-safe Ethereum address - a 20-byte value typically used for L1 messaging.

## Type Definition

```typescript
type EthAddressType = bigint & { readonly _tag: "EthAddress" }
```

## Constructors

### from

Create an EthAddress from a felt input or hex string.

```typescript
import * as EthAddress from "@kundera-sn/kundera-effect/primitives/EthAddress";

const eth = yield* EthAddress.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
// Effect<EthAddressType, PrimitiveError>
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as EthAddress from "@kundera-sn/kundera-effect/primitives/EthAddress";
import * as Abi from "@kundera-sn/kundera-effect/abi";

const program = Effect.gen(function* () {
  // Parse an Ethereum address for L1 messaging
  const l1Address = yield* EthAddress.from("0x1234567890abcdef1234567890abcdef12345678");

  // Use in cross-chain operations
  const calldata = yield* Abi.encodeCalldata(
    bridgeAbi,
    "initiateWithdrawal",
    [l1Address, amount]
  );

  return calldata;
});
```

## Validation

Ethereum addresses must be exactly 20 bytes (40 hex characters):

```typescript
// Valid
yield* EthAddress.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

// Invalid - too long
yield* EthAddress.from("0x" + "f".repeat(50)); // PrimitiveError
```
