---
title: ContractAddress
description: Starknet contract address type
---

# ContractAddress

The `ContractAddress` module provides a type-safe Starknet contract address - a felt252 constrained to be less than 2^251.

## Type Definition

```typescript
type ContractAddressType = bigint & { readonly _tag: "ContractAddress" }
```

## Constants

```typescript
// Maximum valid contract address: 2^251 - 1
const MAX_CONTRACT_ADDRESS: bigint
```

## Constructors

### from

Create a ContractAddress from a felt input.

```typescript
import * as ContractAddress from "kundera-effect/primitives/ContractAddress";

const address = yield* ContractAddress.from("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7");
// Effect<ContractAddressType, PrimitiveError>
```

## Methods

### isValid

Check if a value is a valid contract address.

```typescript
const valid = ContractAddress.isValid("0x123...");
// true | false
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as ContractAddress from "kundera-effect/primitives/ContractAddress";
import * as Abi from "kundera-effect/abi";

const USDC_ADDRESS = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

const program = Effect.gen(function* () {
  const address = yield* ContractAddress.from(USDC_ADDRESS);

  // Use with ABI encoding
  const calldata = yield* Abi.encodeCalldata(
    erc20Abi,
    "balanceOf",
    [address]
  );

  return calldata;
});
```

## Validation

Contract addresses must be less than 2^251:

```typescript
import { Effect } from "effect";
import * as ContractAddress from "kundera-effect/primitives/ContractAddress";

// This will fail - value too large
const program = ContractAddress.from(2n ** 252n).pipe(
  Effect.catchTag("PrimitiveError", (e) => {
    console.log(e.message); // "Value exceeds maximum contract address"
    return Effect.fail(e);
  })
);
```
