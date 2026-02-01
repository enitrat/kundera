# Migration Plan: Provider/Contract/Account to Skills

Created: 2026-02-01
Author: phoenix-agent

## Overview

**Goal:** Move Kundera's provider/contract/account from library exports to copyable skills, following Voltaire's pattern.

**Risk Level:** High (breaking change to public API)

**Estimated Effort:** 3-5 days

**Philosophy:** Kundera should be a primitive library. Opinionated abstractions like Provider, Contract, and Account belong in user-land as copyable skills.

---

## Current State Analysis

### What's Currently Exported (Opinionated)

| Export Path | Description | Why Opinionated |
|-------------|-------------|-----------------|
| `kundera/provider` | `HttpProvider`, `WebSocketProvider`, `createHttpProvider()` | Bundles transport choices, batching logic, event handling |
| `kundera/contract` | `getContract()`, `ContractInstance` | Bundles ABI encoding, RPC calls, account binding |
| `kundera/account` | `Account`, `createAccount()`, `WalletAccount` | Bundles signer, nonce management, tx building |
| `kundera/rpc` | `StarknetRpcClient` class | Class-based API (not tree-shakeable) |

### What Should Remain (Primitives)

| Export Path | Content | Status |
|-------------|---------|--------|
| `kundera/primitives` | `Felt252`, `ContractAddress`, `ClassHash`, etc. | Keep |
| `kundera/crypto` | `poseidonHash`, `pedersenHash`, `sign`, `verify` | Keep |
| `kundera/serde` | Serialization utilities | Keep |
| `kundera/abi` | ABI parsing, encoding, decoding | Keep |
| `kundera/transport` | Low-level transports | Keep (refactor) |

### Dependency Graph

```
Provider (to remove)
  ├── Uses: transport/, primitives/
  ├── UsedBy: Account, Contract, examples/
  └── Bundles: batching, retries, event handling

Contract (to remove)
  ├── Uses: abi/, rpc/, primitives/
  ├── UsedBy: examples/, skills/contract-viem
  └── Bundles: ABI binding, read/write patterns

Account (to remove)
  ├── Uses: provider/, crypto/, primitives/
  ├── UsedBy: examples/, skills/
  └── Bundles: signer binding, tx building, nonce management

RPC Client (to refactor)
  ├── Uses: transport/, primitives/
  ├── UsedBy: Provider, Contract, Account
  └── Problem: Class-based, not tree-shakeable
```

---

## Target State

### Package.json Exports (After Migration)

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./primitives": "./dist/primitives/index.js",
    "./crypto": "./dist/crypto/index.js",
    "./serde": "./dist/serde/index.js",
    "./abi": "./dist/abi/index.js",
    "./transport": "./dist/transport/index.js",
    "./rpc": "./dist/rpc/index.js"
  }
}
```

**Removed:**
- `kundera/provider`
- `kundera/contract`
- `kundera/account`
- `kundera/wallet`

### New RPC Module (Tree-Shakeable)

```typescript
// kundera/rpc - Tree-shakeable individual methods

// Individual RPC methods (tree-shakeable)
export { starknet_chainId } from './methods/chainId.js';
export { starknet_blockNumber } from './methods/blockNumber.js';
export { starknet_getNonce } from './methods/getNonce.js';
export { starknet_getStorageAt } from './methods/getStorageAt.js';
export { starknet_call } from './methods/call.js';
export { starknet_estimateFee } from './methods/estimateFee.js';
export { starknet_getTransactionByHash } from './methods/getTransactionByHash.js';
export { starknet_getTransactionReceipt } from './methods/getTransactionReceipt.js';
export { starknet_addInvokeTransaction } from './methods/addInvokeTransaction.js';
export { starknet_addDeclareTransaction } from './methods/addDeclareTransaction.js';
export { starknet_addDeployAccountTransaction } from './methods/addDeployAccountTransaction.js';
// ... all OpenRPC methods

// Namespace for convenience (optional, not tree-shakeable)
export * as Rpc from './namespace.js';

// Types only
export type {
  BlockId,
  BlockTag,
  FunctionCall,
  RpcError,
  // ... all OpenRPC types
} from './types.js';
```

### Skills Directory Structure

```
docs/skills/
├── index.mdx                    # Skills overview
├── http-provider.mdx            # HTTP provider skill
├── websocket-provider.mdx       # WebSocket provider skill
├── starknetkit-wallet.mdx       # StarknetKit wallet modal
├── get-starknet-wallet.mdx      # get-starknet wallet modal
├── contract-read.mdx            # Contract read patterns
├── contract-write.mdx           # Contract write patterns
├── contract-multicall.mdx       # Batched contract calls
├── account-invoke.mdx           # Account invoke transactions
├── account-declare.mdx          # Account declare transactions
├── account-deploy.mdx           # Account deployment
└── event-watching.mdx           # Event subscription patterns

examples/skills/
├── http-provider/
│   ├── index.ts
│   ├── README.md
│   └── http-provider.test.ts
├── websocket-provider/
│   ├── index.ts
│   └── README.md
├── contract-read/
│   ├── index.ts
│   └── README.md
├── contract-write/
│   ├── index.ts
│   └── README.md
├── account-invoke/
│   ├── index.ts
│   └── README.md
├── wallet-modal/                # Already exists
│   ├── index.ts
│   └── README.md
└── contract-viem/               # Already exists
    ├── index.ts
    └── README.md
```

---

## Implementation Phases

### Phase 0: Safety Net (Day 1 - Morning)

**Goal:** Ensure we can detect breakage

**Tasks:**
- [ ] Verify all existing tests pass
- [ ] Add integration tests for provider/contract/account public APIs
- [ ] Document current behavior in test snapshots
- [ ] Create baseline performance metrics

**Acceptance:** All tests green, baseline captured

---

### Phase 1: Create Tree-Shakeable RPC Layer (Day 1-2)

**Goal:** Replace class-based RPC with individual functions

#### Current (Class-based, not tree-shakeable)

```typescript
// src/rpc/client.ts
export class StarknetRpcClient {
  async chainId(): Promise<string> { ... }
  async blockNumber(): Promise<number> { ... }
  async getNonce(address, blockId): Promise<string> { ... }
  // ... all methods in one class
}
```

#### Target (Function-based, tree-shakeable)

```typescript
// src/rpc/methods/chainId.ts
import type { Transport } from '../../transport/types.js';
import type { JsonRpcRequest } from '../../transport/types.js';

/**
 * Get the chain ID
 *
 * @param transport - JSON-RPC transport
 * @returns Chain ID as hex string
 */
export async function starknet_chainId(
  transport: Transport
): Promise<string> {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'starknet_chainId',
    params: [],
  };
  const response = await transport(request);
  if ('error' in response) {
    throw new Error(response.error.message);
  }
  return response.result;
}

/**
 * Create a chainId request object (for batching)
 */
export function ChainIdRequest(): JsonRpcRequest {
  return {
    jsonrpc: '2.0',
    method: 'starknet_chainId',
    params: [],
  };
}
```

```typescript
// src/rpc/methods/getNonce.ts
import type { Transport, JsonRpcRequest } from '../../transport/types.js';
import type { BlockId } from '../types.js';
import { formatBlockId } from '../utils.js';

export async function starknet_getNonce(
  transport: Transport,
  contractAddress: string,
  blockId: BlockId = 'pending'
): Promise<string> {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'starknet_getNonce',
    params: [formatBlockId(blockId), contractAddress],
  };
  const response = await transport(request);
  if ('error' in response) {
    throw new Error(response.error.message);
  }
  return response.result;
}
```

#### File Structure

```
src/rpc/
├── index.ts                     # Re-exports all methods + types
├── types.ts                     # OpenRPC types (BlockId, etc.)
├── utils.ts                     # Shared utilities (formatBlockId)
├── namespace.ts                 # Rpc.Starknet.* namespace (optional)
└── methods/
    ├── index.ts                 # Re-exports all methods
    ├── chainId.ts
    ├── blockNumber.ts
    ├── getNonce.ts
    ├── getStorageAt.ts
    ├── getClassHashAt.ts
    ├── getClassAt.ts
    ├── getClass.ts
    ├── call.ts
    ├── estimateFee.ts
    ├── getBlockWithTxHashes.ts
    ├── getBlockWithTxs.ts
    ├── getBlockWithReceipts.ts
    ├── getTransactionByHash.ts
    ├── getTransactionReceipt.ts
    ├── getEvents.ts
    ├── addInvokeTransaction.ts
    ├── addDeclareTransaction.ts
    ├── addDeployAccountTransaction.ts
    ├── getTransactionStatus.ts
    ├── specVersion.ts
    └── simulateTransactions.ts
```

**Tasks:**
- [ ] Create `src/rpc/types.ts` with all OpenRPC types
- [ ] Create `src/rpc/utils.ts` with formatBlockId, etc.
- [ ] Create individual method files in `src/rpc/methods/`
- [ ] Create `src/rpc/namespace.ts` for convenience API
- [ ] Update `src/rpc/index.ts` to export tree-shakeable functions
- [ ] Keep `StarknetRpcClient` temporarily for backward compat (deprecated)
- [ ] Add tests for each method

**Rollback:** Keep old `client.ts`, export both APIs

**Acceptance:**
- [ ] Individual imports work: `import { starknet_getNonce } from 'kundera/rpc'`
- [ ] Namespace works: `import { Rpc } from 'kundera/rpc'`
- [ ] All existing tests pass

---

### Phase 2: Extract Provider to Skills (Day 2-3)

**Goal:** Move HttpProvider and WebSocketProvider to copyable skills

#### Current Location
- `src/provider/HttpProvider.ts` (13k)
- `src/provider/WebSocketProvider.ts` (23k)

#### Target Skills

##### HTTP Provider Skill

```typescript
// examples/skills/http-provider/index.ts
/**
 * HTTP Provider Skill
 *
 * Creates a JSON-RPC provider over HTTP with batching and retry support.
 * Copy and customize for your needs.
 */
import { httpTransport, type HttpTransportOptions } from 'kundera/transport';
import {
  starknet_chainId,
  starknet_blockNumber,
  starknet_getNonce,
  starknet_call,
  // ... other methods you need
} from 'kundera/rpc';

export interface HttpProviderOptions {
  /** RPC endpoint URL */
  url: string;
  /** Enable request batching */
  batch?: boolean;
  /** Request timeout in ms */
  timeout?: number;
  /** Number of retries */
  retries?: number;
}

export function createHttpProvider(options: HttpProviderOptions) {
  const transport = httpTransport(options.url, {
    batch: options.batch,
    timeout: options.timeout,
    retries: options.retries,
  });

  return {
    // Convenience methods wrapping tree-shakeable functions
    chainId: () => starknet_chainId(transport),
    blockNumber: () => starknet_blockNumber(transport),
    getNonce: (address: string, blockId?: BlockId) =>
      starknet_getNonce(transport, address, blockId),
    call: (request: FunctionCall, blockId?: BlockId) =>
      starknet_call(transport, request, blockId),
    // ... add methods you need

    // Raw transport access for custom calls
    transport,
  };
}
```

##### WebSocket Provider Skill

```typescript
// examples/skills/websocket-provider/index.ts
/**
 * WebSocket Provider Skill
 *
 * Real-time subscriptions for Starknet events.
 */
import { webSocketTransport } from 'kundera/transport';
import type { Transport } from 'kundera/transport';

export interface WebSocketProviderOptions {
  url: string;
  reconnect?: boolean;
  reconnectDelay?: number;
}

export function createWebSocketProvider(options: WebSocketProviderOptions) {
  const transport = webSocketTransport(options.url, {
    reconnect: options.reconnect,
    reconnectDelay: options.reconnectDelay,
  });

  return {
    // Subscription methods
    subscribeNewHeads: (callback: (head: NewHead) => void) => { ... },
    subscribeEvents: (filter: EventFilter, callback: (event: Event) => void) => { ... },
    subscribePendingTransactions: (callback: (tx: PendingTx) => void) => { ... },

    // Raw transport
    transport,

    // Lifecycle
    close: () => transport.close(),
  };
}
```

**Tasks:**
- [ ] Create `examples/skills/http-provider/` with index.ts, README.md, test
- [ ] Create `examples/skills/websocket-provider/` with index.ts, README.md, test
- [ ] Create `docs/skills/http-provider.mdx` documentation
- [ ] Create `docs/skills/websocket-provider.mdx` documentation
- [ ] Mark `kundera/provider` exports as deprecated

**Rollback:** Provider exports remain, skills are additive

**Acceptance:**
- [ ] Skills work standalone with copy-paste
- [ ] Skills only import from `kundera/transport` and `kundera/rpc`

---

### Phase 3: Extract Contract to Skills (Day 3)

**Goal:** Move Contract abstraction to copyable skills

#### Current Location
- `src/contract/Contract.ts` (11k)
- Already have `examples/skills/contract-viem/` (12k)

#### Target Skills

Keep existing `contract-viem` skill (it's already well-structured), but:

1. Remove `kundera/contract` library export
2. Update `contract-viem` to use tree-shakeable RPC

##### Updated Contract Skill

```typescript
// examples/skills/contract-viem/index.ts
import { httpTransport } from 'kundera/transport';
import { starknet_call, starknet_estimateFee } from 'kundera/rpc';
import { encodeCalldata, decodeOutputs } from 'kundera/abi';

// ... rest of implementation using tree-shakeable imports
```

**Tasks:**
- [ ] Update `contract-viem` skill to use `kundera/rpc` methods (not StarknetRpcClient)
- [ ] Create minimal `contract-read` skill (just reading)
- [ ] Create `contract-write` skill (requires account)
- [ ] Create `contract-multicall` skill (batch reading)
- [ ] Remove `kundera/contract` from package.json exports
- [ ] Update `docs/skills/contract-viem.mdx`

**Rollback:** Contract exports remain

**Acceptance:**
- [ ] Skills work without `kundera/contract`
- [ ] All contract tests pass

---

### Phase 4: Extract Account to Skills (Day 4)

**Goal:** Move Account abstraction to copyable skills

#### Current Location
- `src/account/Account.ts` (16k)
- `src/account/WalletAccount.ts` (10k)
- `src/account/hash.ts` (13k)
- `src/account/Signer.ts` (6.8k)

#### What to Keep in Library

The hash computation and signing utilities are primitives:

```typescript
// kundera/crypto (already exists, augment)
export {
  computeInvokeV3Hash,
  computeDeclareV3Hash,
  computeDeployAccountV3Hash,
  computeContractAddress,
  computeSelector,
} from './account/hash.js';  // Move to crypto

// kundera/serde (for Signer)
// Signer is a utility, could stay or become skill
```

#### Target Skills

##### Account Invoke Skill

```typescript
// examples/skills/account-invoke/index.ts
/**
 * Account Invoke Skill
 *
 * Execute invoke transactions on Starknet.
 */
import { httpTransport } from 'kundera/transport';
import {
  starknet_getNonce,
  starknet_chainId,
  starknet_estimateFee,
  starknet_addInvokeTransaction,
} from 'kundera/rpc';
import { computeInvokeV3Hash } from 'kundera/crypto';
import { sign } from 'kundera/crypto';

export interface InvokeOptions {
  transport: Transport;
  address: string;
  privateKey: string | Uint8Array;
}

export async function invoke(
  options: InvokeOptions,
  calls: Call[],
  details?: InvokeDetails
) {
  const { transport, address, privateKey } = options;

  // Get chain ID and nonce
  const chainId = await starknet_chainId(transport);
  const nonce = details?.nonce ?? BigInt(await starknet_getNonce(transport, address));

  // Build transaction
  const tx = buildInvokeV3(address, calls, nonce, details);

  // Compute hash and sign
  const txHash = computeInvokeV3Hash(tx, chainId);
  const signature = sign(txHash, privateKey);

  // Submit
  const result = await starknet_addInvokeTransaction(transport, {
    type: 'INVOKE',
    ...tx,
    signature,
  });

  return result;
}
```

##### Wallet Account Skill

```typescript
// examples/skills/wallet-account/index.ts
/**
 * Wallet Account Skill
 *
 * Connect to browser wallets (ArgentX, Braavos) via SNIP-6.
 */
export interface WalletAccountOptions {
  provider: StarknetWalletProvider;  // SNIP-6 provider
  transport: Transport;
}

export function createWalletAccount(options: WalletAccountOptions) {
  return {
    async execute(calls: Call[]) {
      // Delegate signing to wallet
      return options.provider.request({
        type: 'wallet_addInvokeTransaction',
        params: { calls },
      });
    },
    // ...
  };
}
```

**Tasks:**
- [ ] Move hash functions to `kundera/crypto`
- [ ] Create `examples/skills/account-invoke/`
- [ ] Create `examples/skills/account-declare/`
- [ ] Create `examples/skills/account-deploy/`
- [ ] Update `examples/skills/wallet-modal/` to not depend on Account class
- [ ] Create `docs/skills/account-invoke.mdx`
- [ ] Remove `kundera/account` from package.json exports

**Rollback:** Account exports remain

**Acceptance:**
- [ ] Skills work without `kundera/account`
- [ ] Wallet modal skill works independently

---

### Phase 5: Cleanup (Day 5)

**Goal:** Remove deprecated exports and clean up

**Tasks:**
- [ ] Remove `src/provider/` directory (keep transport only)
- [ ] Remove `src/contract/Contract.ts` (keep classHash utilities)
- [ ] Remove `src/account/Account.ts`, `WalletAccount.ts`
- [ ] Keep `src/account/hash.ts` (move to crypto)
- [ ] Keep `src/account/Signer.ts` (consider if skill or primitive)
- [ ] Update main `src/index.ts`
- [ ] Update package.json exports
- [ ] Update all documentation
- [ ] Remove deprecated warnings

**Acceptance:**
- [ ] Clean build with no warnings
- [ ] Documentation updated
- [ ] Migration guide complete

---

## Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| `kundera/provider` removed | High | Copy http-provider skill |
| `kundera/contract` removed | High | Copy contract-viem skill |
| `kundera/account` removed | High | Copy account-invoke skill |
| `StarknetRpcClient` removed | Medium | Use tree-shakeable `starknet_*` functions |
| `getContract()` removed | High | Use skill or direct ABI encoding |
| `Account` class removed | High | Use skill or build transactions manually |

### Migration Guide Template

```markdown
## Migrating from Kundera 0.1.x to 0.2.x

### Provider Migration

Before:
```typescript
import { createHttpProvider } from 'kundera/provider';
const provider = createHttpProvider('https://...');
const nonce = await provider.getNonce(address);
```

After:
```typescript
// Option 1: Use tree-shakeable functions directly
import { httpTransport } from 'kundera/transport';
import { starknet_getNonce } from 'kundera/rpc';

const transport = httpTransport('https://...');
const nonce = await starknet_getNonce(transport, address);

// Option 2: Copy the http-provider skill
cp -r node_modules/@starknet/kundera/examples/skills/http-provider src/skills/
import { createHttpProvider } from './skills/http-provider';
```

### Contract Migration

Before:
```typescript
import { getContract } from 'kundera/contract';
const contract = getContract({ abi, address, client });
const balance = await contract.read('balance_of', [address]);
```

After:
```typescript
// Copy the contract-viem skill
cp -r node_modules/@starknet/kundera/examples/skills/contract-viem src/skills/
import { readContract } from './skills/contract-viem';
const { result } = await readContract(client, {
  abi, address, functionName: 'balance_of', args: [address]
});
```
```

---

## Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Library bundle size | ~150KB | <50KB (primitives only) |
| Tree-shaking effectiveness | Poor (class methods) | Good (individual exports) |
| Skills count | 2 | 10+ |
| Breaking changes | N/A | Well-documented |

---

## Success Criteria

1. All primitives remain as library exports
2. All opinionated code moves to copyable skills
3. Skills are self-contained (copy-paste ready)
4. Tree-shakeable RPC functions work
5. Clear migration documentation
6. No functionality lost (skills replicate library behavior)

---

## Appendix: Voltaire Skills Pattern Reference

### MDX Frontmatter

```yaml
---
title: "Skill Name"
description: "One-line description"
---
```

### Standard Structure

1. Info banner explaining it's a skill
2. Quick Start section with copy command
3. Implementation code block (full, copyable)
4. API Reference
5. Examples
6. Related skills

### Key Principles

1. **Copyable** - Users copy into their codebase
2. **Customizable** - Users can modify
3. **Self-contained** - Minimal external dependencies
4. **Tree-shakeable** - Only imports what's needed
5. **Documented** - MDX file explains usage
6. **Tested** - Accompanying test file
