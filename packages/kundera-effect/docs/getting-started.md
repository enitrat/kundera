---
title: Getting Started
description: Install kundera-effect and explore the API
---

# Getting Started

Looking to learn more about why to use kundera-effect? Check out the [Overview](./index.mdx).

## Prerequisites

- **Node.js:** 18+ (20+ recommended)
- **Package Manager:** npm, bun, pnpm, or yarn
- **Knowledge:** Basic TypeScript and familiarity with Effect-TS

New to Effect? Check out the [Effect documentation](https://effect.website/) to understand the basics of typed errors and composable operations.

## Installation

Install kundera-effect along with its peer dependencies:

**npm:**
```bash
npm install @kundera-sn/kundera-effect effect @kundera-sn/kundera-ts
```

**bun:**
```bash
bun add @kundera-sn/kundera-effect effect @kundera-sn/kundera-ts
```

**pnpm:**
```bash
pnpm add @kundera-sn/kundera-effect effect @kundera-sn/kundera-ts
```

**yarn:**
```bash
yarn add @kundera-sn/kundera-effect effect @kundera-sn/kundera-ts
```

## Imports

### Primitives

```typescript
import { Felt252, ContractAddress, ClassHash } from "@kundera-sn/kundera-effect/primitives";
```

### Modules

```typescript
import * as Abi from "@kundera-sn/kundera-effect/abi";
import * as Crypto from "@kundera-sn/kundera-effect/crypto";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { httpTransport } from "@kundera-sn/kundera-effect/transport";
import { Services } from "@kundera-sn/kundera-effect";
```

## Import Path Conventions

**Recommended (ergonomic):**
```typescript
import * as Abi from "@kundera-sn/kundera-effect/abi";
import * as Crypto from "@kundera-sn/kundera-effect/crypto";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
```

**Tree-shakeable subpaths:**
```typescript
import * as Felt252 from "@kundera-sn/kundera-effect/primitives/Felt252";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
```

**Avoid:**
- `@kundera-sn/kundera-effect/primitives/*` (use specific primitive imports)
- Direct imports from internal paths

## Quick Example

```typescript
import { Effect } from "effect";
import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { httpTransport } from "@kundera-sn/kundera-effect/transport";

const transport = httpTransport("https://starknet-mainnet.public.blastapi.io");

const program = Effect.gen(function* () {
  const address = yield* ContractAddress.from("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7");
  const nonce = yield* Rpc.starknet_getNonce(transport, address, "latest");
  return nonce;
});

await Effect.runPromise(program);
```

## Learn More

- [Introduction](./introduction.md) - What is Kundera and why use it
- [Primitives](./primitives/index.md) - Felt252, ContractAddress, ClassHash
- [Branded Types](./concepts/branded-types.md) - Type safety with zero overhead
- [Error Handling](./concepts/error-handling.md) - Effect-based error patterns
- [JSON-RPC](./modules/jsonrpc.md) - Starknet RPC methods
- [Comparisons](./comparisons.md) - Kundera vs starknet.js
