# Migration Guardrails

## Policy

This migration follows **strict no-legacy rules**:

1. **No backward compatibility** - Breaking changes are allowed (no external consumers)
2. **No adapter layers** - No `_legacy`, `_compat`, or deprecated wrappers
3. **No parallel code** - Old monoliths are deleted immediately after extraction
4. **No double exports** - Each function exported from exactly one location

## Architecture Rules

### 1 Function = 1 File

Each exported function lives in its own file:

```
packages/kundera-ts/src/primitives/Felt252/
├── constants.ts       # FIELD_PRIME, MAX_SHORT_STRING_LENGTH
├── Felt252Type.ts     # Type definition and brand
├── prototype.ts       # FeltMethods prototype
├── from.ts            # createFelt (main constructor)
├── fromHex.ts
├── fromBigInt.ts
├── fromBytes.ts
├── toHex.ts
├── toBigInt.ts
├── isValid.ts
├── isZero.ts
├── equals.ts
└── index.ts           # Facade only (re-exports)
```

### Index Files = Facades Only

Index files **must not contain logic**. They only re-export:

```typescript
// Good: packages/kundera-ts/src/primitives/index.ts
export * from './Felt252/index.js';
export * from './ContractAddress/index.js';

// Bad: Any function definition in index.ts
```

### No Legacy Patterns

The following are **forbidden**:

- `export { oldName as newName }` aliases
- `/** @deprecated */` annotations
- `_legacy.ts` or `_compat.ts` files
- Re-exporting removed functions with warnings
- `if (legacyMode)` branches

## Public API Surface

### @kundera-sn/kundera-ts (main package)

```typescript
// Primitives
import { Felt252, ContractAddress, ClassHash, StorageKey, EthAddress } from '@kundera-sn/kundera-ts';

// Crypto
import { pedersenHash, poseidonHash, sign, verify } from '@kundera-sn/kundera-ts/crypto';

// Serde
import { serializeU256, deserializeU256, CairoSerde } from '@kundera-sn/kundera-ts/serde';

// ABI
import { parseAbi, encodeCalldata, decodeCalldata } from '@kundera-sn/kundera-ts/abi';

// RPC
import { createHttpTransport } from '@kundera-sn/kundera-ts/transport';
import { starknet_blockNumber } from '@kundera-sn/kundera-ts/jsonrpc';
```

### @kundera-sn/kundera-effect (Effect wrapper)

```typescript
// Primitives with schemas
import { Felt252, Felt252Schema } from '@kundera-sn/kundera-effect/primitives';

// RPC with Effect
import { getBlockNumber, getBalance } from '@kundera-sn/kundera-effect/jsonrpc';

// Services
import { ProviderService, TransportService } from '@kundera-sn/kundera-effect/services';
```

## Validation Checklist

After each ticket:

```bash
pnpm typecheck      # No type errors
pnpm test:run       # All tests pass
pnpm build          # Build succeeds
```

Before closing each ticket:

- [ ] No monolith file left in parallel
- [ ] No `_legacy` or `_compat` exports
- [ ] index.ts contains only re-exports
- [ ] Tests moved adjacent to functions
- [ ] All imports updated to new paths

## Definition of Done

Migration is complete when:

1. All 12 tickets are closed
2. No legacy patterns exist in `packages/kundera-ts/src/` or `packages/kundera-effect/src/`
3. `pnpm build && pnpm test:run` passes
4. Package exports are clean (no compat paths)
