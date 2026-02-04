---
title: Tree-Shakeable API
description: Minimize bundle size with granular imports
---

Kundera-effect provides two import styles: a convenient **namespace import** that groups all functions together, and a **granular import** for optimal tree-shaking. Both expose the same underlying functions.

## The Two Import Styles

### Namespace Import (Convenient)

Import via the `primitives` barrel to get all modules as namespaces:

```typescript
import { Felt252, ContractAddress, ClassHash } from '@kundera-sn/kundera-effect/primitives'

// Use the namespace prefix
const felt = Felt252.from('0x48656c6c6f')
const address = ContractAddress.from('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7')

// All functions available on the namespace
Felt252.toHex(felt)
Felt252.toBigInt(felt)
Felt252.isZero(felt)
Felt252.equals(felt, other)
```

**Tradeoff**: Importing a namespace pulls in all functions from that module. Use this API for applications where developer experience matters more than bundle size.

### Granular Import (Tree-Shakeable)

Import directly from individual primitive modules:

```typescript
import { from, toHex, equals } from '@kundera-sn/kundera-effect/primitives/Felt252'
import { from as addressFrom } from '@kundera-sn/kundera-effect/primitives/ContractAddress'

// Only these specific functions are bundled
const felt = from('0x48656c6c6f')
toHex(felt)
equals(felt, other)

const address = addressFrom('0x049d...')
```

For maximum tree-shaking, import only the functions you need from the specific module path.

## Bundle Size Comparison

| Import Style | Example | Approximate Bundle Impact |
|--------------|---------|---------------------------|
| Full package | `import { Primitives } from '@kundera-sn/kundera-effect'` | All modules (~full package) |
| Namespace | `import { Felt252 } from '@kundera-sn/kundera-effect/primitives'` | All Felt252 functions |
| Granular | `import { from, toHex } from '@kundera-sn/kundera-effect/primitives/Felt252'` | Only imported functions |

The granular import allows bundlers (webpack, esbuild, rollup) to eliminate unused functions during tree-shaking.

## How the Export Structure Works

The primitives barrel (`/primitives`) re-exports each module as a namespace:

```typescript
// src/primitives/index.ts
export * as Felt252 from "./Felt252/index.js";
export * as ContractAddress from "./ContractAddress/index.js";
export * as ClassHash from "./ClassHash/index.js";
// ...
```

Each primitive module exports individual functions:

```typescript
// src/primitives/Felt252/index.ts
export const from = (value: Felt252Input) => tryPrimitive("Felt252.from", value, "...", () => Felt252(value));
export const toHex = (felt: Felt252Type) => Felt252.toHex(felt);
export const toBigInt = (felt: Felt252Type) => Felt252.toBigInt(felt);
export const isZero = (felt: Felt252Type) => Felt252.isZero(felt);
export const equals = (a: Felt252Type, b: Felt252Type) => Felt252.equals(a, b);
// ...
```

This means:
- `Felt252.from(x)` via namespace import
- `from(x)` via granular import

Both call the same underlying Effect-wrapped function.

## Converting Between Styles

Converting from namespace to granular import is mechanical - just move the namespace to the import path:

```typescript
// Namespace style
import { Felt252 } from '@kundera-sn/kundera-effect/primitives'
Felt252.from('0x...')
Felt252.toHex(felt)
Felt252.equals(a, b)

// Granular style (same logic)
import { from, toHex, equals } from '@kundera-sn/kundera-effect/primitives/Felt252'
from('0x...')
toHex(felt)
equals(a, b)
```

When using multiple primitives with granular imports, use aliasing to avoid name collisions:

```typescript
import { from as feltFrom, toHex as feltToHex } from '@kundera-sn/kundera-effect/primitives/Felt252'
import { from as addressFrom } from '@kundera-sn/kundera-effect/primitives/ContractAddress'
import { encode as encodeShortString } from '@kundera-sn/kundera-effect/primitives/ShortString'

const felt = feltFrom('0x48656c6c6f')
const address = addressFrom('0x049d...')
const shortStr = encodeShortString('Hello')
```

## When to Use Each Style

**Use Namespace Import when:**
- Building applications where DX matters
- Bundle size is not critical
- You want clear namespace prefixes (e.g., `Felt252.toHex`)
- Working with multiple primitives in the same file

**Use Granular Import when:**
- Building libraries (minimize impact on consumers)
- Every KB matters (mobile apps, serverless functions)
- You only need a few specific functions
- Tree-shaking is configured in your build pipeline

## Effect Integration

All functions in kundera-effect return `Effect<T, PrimitiveError>` for type-safe error handling. This is true for both import styles:

```typescript
import { Effect } from 'effect'
import { Felt252 } from '@kundera-sn/kundera-effect/primitives'

// Namespace style - returns Effect
const program = Felt252.from('invalid').pipe(
  Effect.catchTag('PrimitiveError', (e) => {
    console.log(e.operation)  // "Felt252.from"
    return Effect.succeed(Felt252.from('0x0'))
  })
)

// Granular style - same behavior
import { from } from '@kundera-sn/kundera-effect/primitives/Felt252'
const program2 = from('invalid').pipe(
  Effect.catchTag('PrimitiveError', (e) => /* ... */)
)
```

## Pure Functions for Tree-Shaking

If you need synchronous functions without Effect wrapping (for maximum tree-shaking), use the base `kundera-ts` package:

```typescript
// kundera-ts provides pure functions
import { Felt252 } from '@kundera-sn/kundera-ts/Felt252'

const felt = Felt252('0x48656c6c6f')  // Throws on invalid input
felt.toHex()  // Prototype method
```

The kundera-effect wrappers add Effect-based error handling on top of the kundera-ts primitives.

## Learn More

- [Branded Types](/concepts/branded-types) - Zero-overhead type safety
- [Error Handling](/concepts/error-handling) - Working with PrimitiveError in Effect
- [Primitives Reference](/primitives) - API documentation for each primitive
