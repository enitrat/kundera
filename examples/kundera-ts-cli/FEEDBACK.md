# Documentation Feedback — kundera-ts-cli

Built this entire CLI from `docs/typescript/` only, without reading source code.
Everything below is a friction point I hit along the way.

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

**Suggested fix**: Export a `RpcError extends Error` class and throw that.

---

## Resolved

| # | Issue | Resolution |
|---|-------|------------|
| F1 | `request()` returns unknown | Fixed: JSDoc literal method types + TypedProvider |
| F3 | Inconsistent HttpProvider constructor | Fixed: domain-primitives.mdx uses options object |
| F4 | Param ordering inconsistent | Resolved: strong typing provides hints |
| F5 | No selector computation in quickstart | Fixed: quickstart uses `computeSelectorHex` |
| F6 | Chain ID needs decodeShortString | Won't fix: chain ID hex value is sufficient |
| F7 | decodeShortString from two paths | Fixed: removed re-export from abi, primitives only |
| F8 | BlockId not exhaustively documented | Fixed: added BlockId type to jsonrpc.mdx |
| F9 | No end-to-end balance recipe | Fixed: quickstart + CLI use ABI encode/decode |
| F10 | Call results hex vs serde bigints | Resolved: ABI decodeOutput handles conversion |
| F11 | No public RPC URLs | Fixed: all docs use ZAN public endpoint |
