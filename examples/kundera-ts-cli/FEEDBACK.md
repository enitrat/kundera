# Documentation Feedback — kundera-ts-cli

Built this entire CLI from `docs/typescript/` only, without reading source code.
Everything below is a friction point I hit along the way.

---

## F1: `provider.request()` returns `unknown` — no ergonomic typed path with Rpc builders

**Problem**: Every `provider.request(Rpc.SomethingRequest())` returns `Promise<unknown>`.
Had to cast every single result: `as string`, `as string[]`, `as { block_hash: string; ... }`.

**Why confusing**: Docs show `TypedProvider<StarknetRpcSchema>` as the solution for typed returns,
but that only works with raw `{ method: '...', params: [...] }` calls — NOT with `Rpc.*Request()` builders.
There's no documented way to combine Rpc builders with TypedProvider inference.

**How I resolved**: Cast every result manually. Ugly but works.

**Suggested fix**: Either:
- Make `Rpc.*Request()` builders return a branded type that `TypedProvider` can infer from
- OR add a section in provider/jsonrpc docs explaining which pattern to use and when
- OR show a `typedRequest()` wrapper that combines both

---

## F2: JSON-RPC errors are plain objects, not Error instances

**Problem**: Provider API doc says "thrown exceptions with a `code` property" and shows:
```typescript
try { ... } catch (error) { error.code; error.message; }
```
In reality, JSON-RPC errors are thrown as plain `{ code: number, message: string }` objects —
NOT `Error` instances. So `error instanceof Error` is `false`.

**Why confusing**: The doc uses the word "exceptions" and shows `catch (error)` patterns
that imply standard Error objects. No mention of the actual thrown shape.

**How I resolved**: Added a second check for plain objects with `code` and `message` props.

**Suggested fix**: Document the actual error shape. Either:
- Export a `RpcError extends Error` class and throw that
- OR document: "JSON-RPC errors are thrown as plain objects `{ code, message }`, not Error instances"

---

## F3: Inconsistent `HttpProvider` constructor signature in docs

**Problem**: Provider API and quickstart consistently show options object:
```typescript
new HttpProvider({ url: 'https://...' })
```
But the domain-primitives doc (`primitives/domain-primitives.mdx`) shows string form:
```typescript
const provider = new HttpProvider('https://api.zan.top/public/starknet-sepolia');
```

**Why confusing**: Which one is correct? I went with the options object (majority of docs) but
a new user might try the string form from domain-primitives and get a runtime error.

**How I resolved**: Used options object form (Provider API).

**Suggested fix**: Fix domain-primitives.mdx to use `new HttpProvider({ url: '...' })`.

---

## F4: Parameter ordering varies across Rpc builders with no reference table

**Problem**: Parameter order changes unpredictably between builders:
- `GetNonceRequest(blockId, address)` — blockId first
- `GetStorageAtRequest(address, key, blockId)` — blockId last
- `GetClassHashAtRequest(blockId, address)` — blockId first
- `CallRequest(functionCall, blockId)` — blockId last

**Why confusing**: No consistent pattern. The jsonrpc.mdx doc shows examples but there's
no param signature table. You have to read each code example carefully and guess.

**How I resolved**: Read each example in jsonrpc.mdx and inferred param order from the
code snippets. Got lucky — could have easily swapped params and gotten confusing runtime errors.

**Suggested fix**: Add a concise signature table per builder:
```
| Builder | Params |
|---------|--------|
| GetNonceRequest | (blockId, address) |
| GetStorageAtRequest | (address, key, blockId) |
```

---

## F5: No selector computation shown in quickstart's CallRequest example

**Problem**: Quickstart hardcodes the balanceOf selector as a hex literal:
```typescript
const balanceOfSelector = '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e';
```
No mention of `computeSelectorHex('balanceOf')` from the ABI module.

**Why confusing**: New users will think they need to look up selectors somewhere.
The `computeSelectorHex` function is documented in ABI API but not cross-referenced
from the quickstart's contract call example.

**How I resolved**: Found `computeSelectorHex` in `docs/typescript/api/abi.mdx`.

**Suggested fix**: In quickstart's "Call a Contract" section, show:
```typescript
import { computeSelectorHex } from '@kundera-sn/kundera-ts/abi';
const selector = computeSelectorHex('balanceOf');
```

---

## F6: No doc mentions chain ID needs `decodeShortString`

**Problem**: `Rpc.ChainIdRequest()` returns a hex string like `0x534e5f4d41494e`.
No doc mentions you need `decodeShortString` to get `SN_MAIN`.

**Why confusing**: A new user sees `0x534e5f4d41494e` and doesn't know what to do with it.
The connection between chain ID being a short-string-encoded value and `decodeShortString`
is never made anywhere in the docs.

**How I resolved**: Knew from Starknet protocol that chain ID is a short string.
Used `decodeShortString` from primitives API.

**Suggested fix**: Add a note in the quickstart's "Get chain ID" example:
```typescript
import { decodeShortString } from '@kundera-sn/kundera-ts';
const chainId = await provider.request(Rpc.ChainIdRequest());
console.log(decodeShortString(chainId)); // "SN_MAIN"
```

---

## F7: `decodeShortString` available from two import paths

**Problem**: `decodeShortString` is documented in both:
- Primitives API: `import { decodeShortString } from '@kundera-sn/kundera-ts'`
- ABI API: `import { decodeShortString } from '@kundera-sn/kundera-ts/abi'`

**Why confusing**: Which is the canonical import? Are they the same function?
Does one re-export the other?

**How I resolved**: Used the main package import (`@kundera-sn/kundera-ts`).

**Suggested fix**: Pick one canonical import path and cross-reference from the other.
Or add a note: "Also re-exported from @kundera-sn/kundera-ts/abi for convenience."

---

## F8: BlockId accepted values not exhaustively documented

**Problem**: Docs show `'latest'` and `{ block_number: N }` and `{ block_hash: '0x...' }`
as BlockId values, but never explicitly list all valid options.
Is `'pending'` valid? `'finalized'`? `'safe'`?

**Why confusing**: I had to guess that `'pending'` works based on Starknet spec knowledge.
A new user wouldn't know.

**How I resolved**: Used `'latest'` and `{ block_number }` for safety, added `'pending'` as a guess.

**Suggested fix**: Add to jsonrpc.mdx:
```typescript
type BlockId =
  | 'latest'
  | 'pending'
  | { block_number: number }
  | { block_hash: string };
```

---

## F9: No "check token balance" end-to-end recipe

**Problem**: Checking an ERC-20 balance — the most common Starknet operation — requires
combining 4 separate docs:
1. Provider guide for `CallRequest`
2. ABI API for `computeSelectorHex`
3. Quickstart for the FunctionCall shape
4. Manual u256 parsing (no doc covers this properly)

**Why confusing**: No single page walks through the full flow.
The quickstart's balance example hardcodes the selector and uses raw `BigInt()` parsing.

**How I resolved**: Cobbled it together from 4 docs + Starknet protocol knowledge.

**Suggested fix**: Add a "Recipes" page or expand the provider guide with a complete
"Check ERC-20 balance" recipe that includes selector computation, the call, and u256 parsing.

---

## F10: Call result is hex strings but serde expects bigints

**Problem**: `Rpc.CallRequest` returns `string[]` (hex strings).
The serde module's `deserializeU256` expects `[Felt252Type, Felt252Type]` (bigints).
There's no bridge — you have to manually `BigInt(result[0])` each element.

**Why confusing**: If the serde module exists for u256 handling, it should work seamlessly
with call results. Instead there's a type gap: call returns strings, serde needs bigints.

**How I resolved**: Manual `BigInt()` conversion as shown in quickstart.

**Suggested fix**: Either:
- Add a `parseCallResult(result: string[]): bigint[]` helper
- OR document the string→bigint conversion step explicitly
- OR mention `deserializeU256` in the quickstart's balance example after converting to bigint

---

## F11: No public RPC URLs documented anywhere

**Problem**: Every code example uses placeholder URLs like `https://starknet-sepolia.example.com`.
One transport guide example mentions `https://api.zan.top/public/starknet-sepolia` — that's the
only real URL in the entire docs.

**Why confusing**: A new user copying from quickstart literally can't run the code without
finding their own RPC provider. Zero friction onboarding should include at least one free endpoint.

**How I resolved**: Used the ZAN URL from the transport guide example.

**Suggested fix**: Add a "Public RPC Endpoints" note in quickstart:
```
Free endpoints:
- https://api.zan.top/public/starknet-mainnet
- https://free-rpc.nethermind.io/mainnet-juno/
```

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| F1 | High | `request()` returns unknown, no typed path with Rpc builders |
| F2 | High | JSON-RPC errors are plain objects, not Error instances |
| F3 | Medium | Inconsistent HttpProvider constructor in domain-primitives doc |
| F4 | High | Param ordering varies across builders with no signature table |
| F5 | Medium | No selector computation in quickstart's CallRequest example |
| F6 | Medium | No doc mentions chain ID needs decodeShortString |
| F7 | Low | decodeShortString available from two import paths |
| F8 | Medium | BlockId types not exhaustively listed |
| F9 | High | No end-to-end "check balance" recipe |
| F10 | Medium | Call results (hex strings) vs serde (bigints) type gap |
| F11 | Medium | No public RPC URLs documented |

**Overall**: The docs are well-structured and cover the API surface. The main gap is
**recipes** — end-to-end examples that combine multiple modules to accomplish real tasks.
Individual API pages are good, but the connective tissue between modules is missing.
