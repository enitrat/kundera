---
title: Crypto
description: Starknet cryptographic operations
---

# Crypto

The `Crypto` module provides all Starknet cryptographic operations: hashing, signing, and transaction hash computation.

## Import

```typescript
import * as Crypto from "kundera-effect/crypto";
```

## Backend Detection

```typescript
// Check available backends
Crypto.isNativeAvailable(); // true if native bindings loaded
Crypto.isWasmAvailable();   // true if WASM module available
Crypto.isWasmLoaded();      // true if WASM already loaded

// Load WASM explicitly
yield* Crypto.loadWasmCrypto();
```

## Hash Functions

### Pedersen Hash

```typescript
const hash = yield* Crypto.pedersenHash(a, b);
// Effect<Felt252Type, CryptoError>

// Or use the namespace
const hash = yield* Crypto.Pedersen.hash(a, b);
```

### Poseidon Hash

```typescript
const hash = yield* Crypto.poseidonHash(a, b);
// Effect<Felt252Type, CryptoError>

const hash = yield* Crypto.poseidonHashMany([a, b, c, d]);
// Effect<Felt252Type, CryptoError>

// Or use the namespace
const hash = yield* Crypto.Poseidon.hash(a, b);
const hash = yield* Crypto.Poseidon.hashMany([a, b, c]);
```

### Starknet Keccak

```typescript
const hash = yield* Crypto.snKeccak("hello");
const hash = yield* Crypto.snKeccak(new Uint8Array([1, 2, 3]));
// Effect<Felt252Type, CryptoError>
```

## Felt Arithmetic

All operations are modular over the Starknet field.

```typescript
const sum = yield* Crypto.feltAdd(a, b);
const diff = yield* Crypto.feltSub(a, b);
const prod = yield* Crypto.feltMul(a, b);
const quot = yield* Crypto.feltDiv(a, b);
const neg = yield* Crypto.feltNeg(a);
const inv = yield* Crypto.feltInverse(a);
const pow = yield* Crypto.feltPow(base, exp);
const sqrt = yield* Crypto.feltSqrt(a);

// Or use the namespace
const sum = yield* Crypto.Felt.add(a, b);
const diff = yield* Crypto.Felt.sub(a, b);
// etc.
```

## STARK Curve Signatures

### Sign

```typescript
const signature = yield* Crypto.sign(privateKey, messageHash);
// Effect<Signature, CryptoError>

// Raw signing (returns [r, s])
const [r, s] = yield* Crypto.signRaw(privateKey, hash);
```

### Verify

```typescript
const valid = yield* Crypto.verify(publicKey, messageHash, signature);
// Effect<boolean, CryptoError>
```

### Get Public Key

```typescript
const publicKey = yield* Crypto.getPublicKey(privateKey);
// Effect<Felt252Type, CryptoError>
```

### Recover

```typescript
const publicKey = yield* Crypto.recover(messageHash, r, s, v);
// Effect<Felt252Type, CryptoError>
```

### Namespace Form

```typescript
const sig = yield* Crypto.StarkCurve.sign(privateKey, hash);
const valid = yield* Crypto.StarkCurve.verify(pubKey, hash, sig);
const pubKey = yield* Crypto.StarkCurve.getPublicKey(privateKey);
const recovered = yield* Crypto.StarkCurve.recover(hash, r, s, v);
```

## Typed Data (EIP-712 Style)

### signTypedData

```typescript
const signature = yield* Crypto.signTypedData(
  privateKey,
  typedData,
  accountAddress
);
// Effect<Signature, CryptoError>
```

### hashTypedData

```typescript
const hash = yield* Crypto.hashTypedData(typedData, accountAddress);
// Effect<Felt252Type, CryptoError>
```

## Transaction Hashes

### computeInvokeV3Hash

```typescript
const hash = yield* Crypto.computeInvokeV3Hash(invokePayload, details);
// Effect<Felt252Type, CryptoError>
```

### computeDeclareV3Hash

```typescript
const hash = yield* Crypto.computeDeclareV3Hash(declarePayload, details);
// Effect<Felt252Type, CryptoError>
```

### computeDeployAccountV3Hash

```typescript
const hash = yield* Crypto.computeDeployAccountV3Hash(deployPayload, details);
// Effect<Felt252Type, CryptoError>
```

## Contract Address

### computeContractAddress

```typescript
const address = yield* Crypto.computeContractAddress(
  salt,
  classHash,
  constructorCalldata,
  deployerAddress
);
// Effect<Felt252Type, CryptoError>
```

## Selectors

### computeSelector

```typescript
const selector = yield* Crypto.computeSelector("transfer");
// Effect<Felt252Type, CryptoError>
```

## Utilities

### hashCalldata

```typescript
const hash = yield* Crypto.hashCalldata(calldata);
// Effect<Felt252Type, CryptoError>
```

### hashTipAndResourceBounds

```typescript
const hash = yield* Crypto.hashTipAndResourceBounds(tip, resourceBounds);
// Effect<Felt252Type, CryptoError>
```

### encodeDAModes

```typescript
const encoded = yield* Crypto.encodeDAModes(daMode);
// Effect<bigint, CryptoError>
```

### signatureToArray

Convert signature to array format (non-Effect).

```typescript
const [r, s] = Crypto.signatureToArray(signature);
```

## Constants

```typescript
Crypto.TRANSACTION_VERSION
Crypto.DEFAULT_RESOURCE_BOUNDS
Crypto.TRANSACTION_HASH_PREFIX
Crypto.EXECUTE_SELECTOR
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as Crypto from "kundera-effect/crypto";
import * as Felt252 from "kundera-effect/primitives/Felt252";

const program = Effect.gen(function* () {
  // Load WASM if needed
  if (!Crypto.isNativeAvailable()) {
    yield* Crypto.loadWasmCrypto();
  }

  // Generate key pair
  const privateKey = yield* Felt252.from("0x1234...");
  const publicKey = yield* Crypto.getPublicKey(privateKey);

  // Sign a message
  const messageHash = yield* Crypto.poseidonHashMany([
    yield* Felt252.from("0x1"),
    yield* Felt252.from("0x2")
  ]);

  const signature = yield* Crypto.sign(privateKey, messageHash);

  // Verify
  const valid = yield* Crypto.verify(publicKey, messageHash, signature);
  console.log("Signature valid:", valid);

  return { publicKey, signature };
});
```
