---
title: Type-Safe Starknet Values
description: Prevent address and hash confusion with compile-time type safety
---

# Type-Safe Starknet Values

Kundera uses distinct types for Starknet values that starknet.js treats as generic strings. This prevents bugs where addresses, class hashes, and storage keys get confused.

## The Problem

Consider this starknet.js code:

```typescript
// starknet.js: Everything is a hex string
const contractAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const classHash = "0x07b3e05f48f0c69e4a65ce5e076a66271a527aff2c34ce1083ec6e1526997a69";
const storageKey = "0x110e2f729c9c2b988559994a3daccd838cf52faf88e18101373e67dd061455a";

// Easy to confuse - all are just strings
async function declareAndDeploy(classHash: string) {
  // Oops! Passed the contract address instead of class hash
  await account.deploy({ classHash: contractAddress });  // Compiles fine
}

// Even worse - arithmetic on addresses
const nextAddress = BigInt(contractAddress) + 1n;  // Semantically meaningless
```

This code compiles and runs. The bug won't be caught until you get a confusing error from the network or, worse, interact with the wrong contract.

## The Solution

Kundera makes each Starknet primitive a distinct type:

```typescript
import { Effect } from "effect";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
import * as ClassHash from "@kundera-sn/kundera-effect/primitives/ClassHash";

const program = Effect.gen(function* () {
  const address = yield* ContractAddress.from("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7");
  const hash = yield* ClassHash.from("0x07b3e05f48f0c69e4a65ce5e076a66271a527aff2c34ce1083ec6e1526997a69");

  // Type error: ContractAddressType is not assignable to ClassHashType
  function deploy(classHash: ClassHashType) { /* ... */ }
  deploy(address);  // Caught at compile time!
});
```

If you have a `ContractAddressType`, you know it's a valid contract address. The type system enforces it.

## Beyond Addresses: The Felt252 Family

Starknet has several types that are all represented as felt252 values but serve different purposes:

### Felt252 - The Base Type

The field element is the fundamental Starknet primitive. It's a 252-bit integer in the range `[0, FIELD_PRIME)`:

```typescript
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";

const felt = yield* Felt252.from("0xdeadbeef");

// Arithmetic operations make sense on felts
const doubled = Felt252.toBigInt(felt) * 2n;

// Conversion utilities
Felt252.toHex(felt);     // "0xdeadbeef"
Felt252.toBigInt(felt);  // 3735928559n
Felt252.isZero(felt);    // false
```

### ContractAddress - Deployed Contract Location

A contract address identifies a deployed contract instance. It has additional constraints (must be < 2^251):

```typescript
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";

// ETH token on mainnet
const ethAddress = yield* ContractAddress.from(
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
);

// Type system prevents nonsense
function transfer(to: ContractAddressType) { /* ... */ }
transfer(ethAddress);  // OK
transfer(someClassHash);  // Type error!
```

### ClassHash - Contract Code Identifier

A class hash uniquely identifies a contract's bytecode. Two contracts with the same class hash run identical code:

```typescript
import * as ClassHash from "@kundera-sn/kundera-effect/primitives/ClassHash";

const erc20ClassHash = yield* ClassHash.from(
  "0x07b3e05f48f0c69e4a65ce5e076a66271a527aff2c34ce1083ec6e1526997a69"
);

// Used for deployment and upgrades
function deploy(classHash: ClassHashType, salt: Felt252Type) { /* ... */ }
deploy(erc20ClassHash, salt);  // OK
deploy(contractAddress, salt);  // Type error!
```

### StorageKey - Contract State Slot

A storage key identifies a slot in a contract's persistent storage:

```typescript
import * as StorageKey from "@kundera-sn/kundera-effect/primitives/StorageKey";

const balanceSlot = yield* StorageKey.from(
  "0x110e2f729c9c2b988559994a3daccd838cf52faf88e18101373e67dd061455a"
);

// Query specific storage locations
function getStorageAt(address: ContractAddressType, key: StorageKeyType) { /* ... */ }
getStorageAt(ethAddress, balanceSlot);  // OK
getStorageAt(ethAddress, classHash);  // Type error!
```

### EthAddress - Cross-Chain Identifier

Ethereum addresses (20 bytes) are used for L1<>L2 messaging:

```typescript
import * as EthAddress from "@kundera-sn/kundera-effect/primitives/EthAddress";

const l1Bridge = yield* EthAddress.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

// Used for cross-chain operations
function initiateWithdrawal(l1Recipient: EthAddressType, amount: Uint256) { /* ... */ }
initiateWithdrawal(l1Bridge, amount);  // OK
initiateWithdrawal(contractAddress, amount);  // Type error - wrong address type!
```

## Parse, Don't Validate

Once you have a typed value, it's guaranteed valid. This enables a powerful pattern:

```typescript
// Business logic doesn't need validation
function computeContractAddress(
  deployerAddress: ContractAddressType,
  classHash: ClassHashType,
  salt: Felt252Type,
  constructorCalldata: Felt252Type[]
): ContractAddressType {
  // No validation needed - types guarantee valid inputs
  // The computation can focus on the actual logic
}

// Validation happens at the boundary
const program = Effect.gen(function* () {
  // Parse user input - validation happens once
  const deployer = yield* ContractAddress.from(userInput.deployer);
  const hash = yield* ClassHash.from(userInput.classHash);
  const salt = yield* Felt252.from(userInput.salt);

  // Now work with guaranteed-valid types
  const newAddress = computeContractAddress(deployer, hash, salt, []);
  return newAddress;
});
```

This is the "parse, don't validate" philosophy: validate at system boundaries, then work with guaranteed-valid types throughout your code.

## Comparison with starknet.js

| Operation | starknet.js | Kundera |
|-----------|-------------|---------|
| Contract address | `string` | `ContractAddressType` |
| Class hash | `string` | `ClassHashType` |
| Storage key | `string` | `StorageKeyType` |
| Field element | `string \| bigint` | `Felt252Type` |
| Ethereum address | `string` | `EthAddressType` |
| Short string | `string` | `Felt252Type` (encoded) |
| Validation | Runtime (or never) | Compile time + parse time |

The difference: Kundera catches type misuse at compile time. starknet.js catches it at runtime (or not at all).

## All Typed Values

| Category | Type | Description |
|----------|------|-------------|
| Base | `Felt252Type` | Field element (< 2^252) |
| Addresses | `ContractAddressType` | Starknet contract (< 2^251) |
| | `EthAddressType` | Ethereum address (20 bytes) |
| Identifiers | `ClassHashType` | Contract bytecode hash |
| | `StorageKeyType` | Contract storage slot |
| Strings | `ShortStringType` | ASCII string (< 31 chars) encoded as felt |

## Error Handling

All constructors return `Effect<T, PrimitiveError>`, making parsing errors explicit:

```typescript
import { Effect } from "effect";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";

const program = ContractAddress.from("invalid").pipe(
  Effect.catchTag("PrimitiveError", (error) => {
    console.log(error.operation);  // "ContractAddress.from"
    console.log(error.input);      // "invalid"
    console.log(error.expected);   // "valid hex string"
    return Effect.succeed(fallbackAddress);
  })
);
```

Validation constraints are enforced at parse time:

```typescript
// Contract addresses must be < 2^251
const program = ContractAddress.from(2n ** 252n).pipe(
  Effect.catchTag("PrimitiveError", (e) => {
    console.log(e.message);  // "Value exceeds maximum contract address"
    return Effect.fail(e);
  })
);

// Ethereum addresses must be exactly 20 bytes
yield* EthAddress.from("0x" + "f".repeat(50));  // PrimitiveError - too long
```

## Learn More

- [Felt252](/primitives/felt252) - Complete field element API
- [ContractAddress](/primitives/contract-address) - Contract address API
- [ClassHash](/primitives/class-hash) - Class hash API
- [StorageKey](/primitives/storage-key) - Storage key API
- [EthAddress](/primitives/eth-address) - Ethereum address API
- [ShortString](/primitives/short-string) - Short string encoding
