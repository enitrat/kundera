---
title: Branded Types
description: Zero-overhead type safety for Starknet primitives
---

Kundera uses branded types to prevent common bugs like passing a `Felt252` where a `ContractAddress` is expected. The brand exists only at compile time - at runtime, it's just a `Uint8Array`.

## What is a Branded Type?

A branded type adds a compile-time tag to a base type:

```typescript
// The brand symbol (shared across all primitives)
declare const __brand: unique symbol

// Felt252Type is a Uint8Array with an invisible brand tag
type Felt252Type = Uint8Array & { readonly [__brand]: 'Felt252' }

// ContractAddressType is also a Uint8Array, but with a different brand
type ContractAddressType = Uint8Array & { readonly [__brand]: 'ContractAddress' }
```

At runtime, both are plain `Uint8Array`. TypeScript prevents you from mixing them up:

```typescript
import { Felt252, ContractAddress, ClassHash } from '@kundera-sn/kundera-ts'

function deployContract(address: ContractAddressType, classHash: ClassHashType) { /* ... */ }

const address = ContractAddress('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7')
const classHash = ClassHash('0x07b3e05f48f0c69e4a65ce5e076a66271a527aff2c34ce1083ec6e1526997a69')

deployContract(address, classHash)    // OK
deployContract(classHash, address)    // Type error: ClassHashType is not assignable to ContractAddressType
```

## Zero Runtime Overhead

The brand is a phantom type - it exists only in TypeScript's type system:

```typescript
const address = ContractAddress('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7')

// At runtime, it's just a Uint8Array
console.log(address instanceof Uint8Array)  // true
console.log(address.length)                  // 32 (32 bytes for felt252)

// All Uint8Array methods work
address.slice(0, 4)
address.subarray(16, 32)
new DataView(address.buffer)

// Prototype methods are also available
address.toHex()     // '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
address.toBigInt()  // 2087021424722619777119509474943472645767659996348769578120564519014510906823n
```

## Validation at Construction

Branded types are validated when created. If you have a `ContractAddressType`, it's valid:

```typescript
// These throw on invalid input
ContractAddress('not_valid')              // Error: Invalid hex string
ContractAddress('0x' + 'f'.repeat(64))    // Error: Value exceeds 2^251
ContractAddress(new Uint8Array(10))       // Error: Must be 32 bytes

// If construction succeeds, the value is valid
const address = ContractAddress('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7')
// address is guaranteed to be < 2^251 and in canonical form
```

## Effect-Based Validation

In `kundera-effect`, constructors return `Effect<T, PrimitiveError>` for type-safe error handling:

```typescript
import { Effect } from 'effect'
import * as ContractAddress from '@kundera-sn/kundera-effect/primitives/ContractAddress'

const program = ContractAddress.from('0x049d...').pipe(
  Effect.catchTag('PrimitiveError', (e) => {
    console.log(e.operation)  // "ContractAddress.from"
    console.log(e.input)      // "0x049d..."
    console.log(e.expected)   // "felt < 2^251"
    return Effect.fail(new Error('Invalid address'))
  })
)
```

## Console Formatting

Branded types include prototype methods for convenient display:

```typescript
const felt = Felt252('0x48656c6c6f')
console.log(felt.toHex())     // '0x48656c6c6f'
console.log(felt.toBigInt())  // 310939249775n
console.log(felt.isZero())    // false
```

## Using Branded Types in Function Signatures

Use branded types in your function parameters:

```typescript
import type { ContractAddressType } from '@kundera-sn/kundera-ts/ContractAddress'
import type { ClassHashType } from '@kundera-sn/kundera-ts/ClassHash'
import type { Felt252Type } from '@kundera-sn/kundera-ts/Felt252'

// Type-safe function - cannot swap arguments by accident
function invokeContract(
  contract: ContractAddressType,
  selector: Felt252Type,
  calldata: Felt252Type[]
) {
  // No runtime validation needed - types guarantee validity
}
```

## All Branded Types

| Type | Size | Constraint | Description |
|------|------|------------|-------------|
| [Felt252Type](/primitives/felt252) | 32 bytes | < field prime | Field element (P = 2^251 + 17*2^192 + 1) |
| [ContractAddressType](/primitives/contract-address) | 32 bytes | < 2^251 | Starknet contract address |
| [ClassHashType](/primitives/class-hash) | 32 bytes | < 2^251 | Contract class identifier |
| [StorageKeyType](/primitives/storage-key) | 32 bytes | < 2^251 | Storage slot address |
| [EthAddressType](/primitives/eth-address) | 32 bytes | < 2^160 | L1 Ethereum address for messaging |
| ShortString | bigint | < 31 chars | Cairo short string (ASCII) |

## Why Branded Types Matter for Starknet

Starknet has several similar-looking primitives that serve different purposes:

- **Felt252** - General-purpose field element, the base unit of computation
- **ContractAddress** - Identifies a deployed contract, must be < 2^251
- **ClassHash** - Identifies a contract class (like bytecode), must be < 2^251
- **StorageKey** - Identifies a storage slot, must be < 2^251
- **EthAddress** - L1 address for cross-chain messaging, must be < 2^160

Without branded types, you might accidentally:
- Use a ClassHash where a ContractAddress is expected
- Pass a Felt252 that exceeds the 2^251 limit for addresses
- Mix up selector felts with storage keys

Branded types catch these errors at compile time, before they become runtime bugs or transaction failures.

## Learn More

- [Primitives Reference](/primitives) - API documentation for each primitive
- [Error Handling](/concepts/error-handling) - Working with PrimitiveError
