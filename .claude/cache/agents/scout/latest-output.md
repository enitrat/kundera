# Effect-TS Schema Anti-Pattern Analysis Report
Generated: 2026-02-02

## Executive Summary

This codebase is a **well-designed Effect-TS wrapper** around the `@starknet/kundera` library. However, it **does NOT use Effect Schema** (`@effect/schema`) at all - it relies entirely on runtime validation from the underlying library and manual Effect wrapper functions.

**Key Finding**: The codebase uses a **validation wrapper pattern** instead of Schema-based parsing, which is acceptable for thin wrappers but misses Schema's benefits for domain modeling.

---

## Analysis Against Best Practices

### ✓ VERIFIED: No Schema Usage Found

**Search Results:**
- 0 occurrences of `Schema.Struct`
- 0 occurrences of `Schema.brand`
- 0 occurrences of `Schema.Option`
- 0 occurrences of `Schema.transform`

**Conclusion**: This is a **wrapper library**, not a domain modeling library. It doesn't define schemas but wraps external library functions.

---

## Anti-Patterns Found

### 1. ❌ Undefined/Unknown in Error Handling (ACCEPTABLE in error context)

**Location**: `/Users/msaug/workspace/kundera/kundera-effect/src/errors.ts`

**Pattern Found**:
```typescript
export interface ErrorContext {
  operation: string;
  input?: unknown;        // ❌ Optional unknown
  expected?: string;      // ❌ Optional string
  cause?: unknown;        // ❌ Optional unknown
}

export class PrimitiveError extends Error {
  readonly input?: unknown;
  readonly expected?: string;
  readonly cause?: unknown;
  // ... repeated in CryptoError, RpcError, SerdeError, TransportError
}
```

**Issue**: Uses `?: unknown` and `?: string` instead of `Schema.Option`.

**Recommendation**:
```typescript
// If using Schema (requires adding @effect/schema)
import { Schema } from "@effect/schema";

const ErrorContext = Schema.Struct({
  operation: Schema.String,
  input: Schema.Option(Schema.Unknown),
  expected: Schema.Option(Schema.String),
  cause: Schema.Option(Schema.Unknown)
});
```

**Severity**: 🟡 LOW - This is error metadata, not domain data. Using `?:` is acceptable here, but Schema would provide better introspection.

---

### 2. ? INFERRED: Null Usage (ACCEPTABLE in specific contexts)

**Locations**:
- `/Users/msaug/workspace/kundera/kundera-effect/src/utils/fromResult.ts:5`
- `/Users/msaug/workspace/kundera/kundera-effect/src/wasm-loader/index.ts:40,44`
- `/Users/msaug/workspace/kundera/kundera-effect/src/rpc/index.test.ts:43,62`

**Pattern Found**:

```typescript
// fromResult.ts - checking external library Result type
result.error === null ? Effect.succeed(result.result as T) : Effect.fail(result.error);

// wasm-loader/index.ts - returning null for missing path
export const getWasmPath = (): string | null => {
  try {
    return getWasmPathBase();
  } catch {
    return null;  // ❌ Returns null instead of Option
  }
};

// Test files - test state initialization
let captured: JsonRpcRequest | null = null;
```

**Issue**:
1. `fromResult` - Checking `null` from external library (can't change)
2. `getWasmPath` - Should return `Option<string>`
3. Test files - Test-only code (acceptable)

**Recommendation for `getWasmPath`**:
```typescript
import { Option } from "effect";

export const getWasmPath = (): Option.Option<string> => {
  try {
    const path = getWasmPathBase();
    return Option.fromNullable(path);
  } catch {
    return Option.none();
  }
};
```

**Severity**:
- fromResult: ✅ ACCEPTABLE (external library constraint)
- getWasmPath: 🟡 MEDIUM (public API could use Option)
- Test files: ✅ ACCEPTABLE (test-only code)

---

### 3. ✓ VERIFIED: Unknown Type Usage (APPROPRIATE)

**Locations**: Found 10+ occurrences in error handling code.

**Pattern**:
```typescript
input?: unknown;  // Error metadata
cause?: unknown;  // Error causes
```

**Status**: ✅ ACCEPTABLE - Using `unknown` for error metadata is appropriate since errors can contain any value. This is safer than `any`.

---

### 4. ✓ VERIFIED: No Unbranded Entity IDs

**Analysis**: This codebase **does not define entity IDs** - it wraps primitive types from `@starknet/kundera`.

**Types Examined**:
```typescript
// All imported from @starknet/kundera/primitives
- Felt252Type
- ContractAddressType
- ClassHashType
- StorageKeyType
- EthAddressType
```

**These are already validated primitives from the base library**, not entity IDs that need branding.

**Status**: ✅ N/A - No entity IDs to brand.

---

### 5. ❌ No Schema Usage for Domain Types

**Current Pattern**: Manual validation wrappers
```typescript
export const from = (value: Felt252Input) =>
  tryPrimitive(
    "Felt252.from",
    value,
    "hex string, bigint, number, or 32-byte Uint8Array",
    () => Felt252(value)
  );
```

**Issue**: This works but doesn't provide:
- Type-safe parsing with `Schema.decodeUnknown`
- Automatic JSON serialization
- OpenAPI generation
- Refinement composition

**Recommendation** (if moving to Schema-first design):
```typescript
import { Schema } from "@effect/schema";

const Felt252Schema = Schema.String.pipe(
  Schema.brand("Felt252"),
  Schema.filter((s) => {
    // Validation logic
    return s.startsWith("0x") && /^0x[0-9a-f]{1,64}$/i.test(s);
  })
);

export const from = (value: unknown) =>
  Schema.decodeUnknown(Felt252Schema)(value);
```

**Severity**: 🟡 MEDIUM - Current approach works for a thin wrapper, but adding Schema would enable more Effect ecosystem integration.

---

## Architecture Assessment

### Current Design: Validation Wrapper Pattern

```
User Code
    ↓
kundera-effect (Effect wrappers)
    ↓
tryPrimitive/tryCrypto/tryRpc helper
    ↓
@starknet/kundera (actual validation)
    ↓
Effect.succeed() or Effect.fail()
```

**Pros**:
- Thin, maintainable layer
- Delegates validation to proven library
- Effect error handling without Schema dependency

**Cons**:
- No Schema benefits (JSON parsing, OpenAPI, etc.)
- Can't compose refinements
- Manual error message construction

---

### If Adding Schema (Major Refactor)

**Would Enable**:
1. Type-safe JSON parsing: `Schema.decodeUnknown`
2. Automatic serialization: `Schema.encode`
3. OpenAPI generation: `@effect/schema-openapi`
4. Refinement composition: `Schema.compose`
5. Better error messages: `TreeFormatter`

**Trade-offs**:
- Adds dependency on `@effect/schema`
- Requires rewriting all primitive wrappers
- May duplicate validation from `@starknet/kundera`

---

## Files Analyzed

| File | Lines | Issues Found |
|------|-------|--------------|
| `/src/errors.ts` | 92 | Optional unknown (low severity) |
| `/src/primitives/utils.ts` | 23 | None (wrapper pattern) |
| `/src/primitives/Felt252/index.ts` | 52 | None (wrapper pattern) |
| `/src/primitives/ContractAddress/index.ts` | 23 | None (wrapper pattern) |
| `/src/primitives/ClassHash/index.ts` | 19 | None (wrapper pattern) |
| `/src/primitives/StorageKey/index.ts` | 19 | None (wrapper pattern) |
| `/src/primitives/EthAddress/index.ts` | 21 | None (wrapper pattern) |
| `/src/primitives/ShortString/index.ts` | 37 | None (wrapper pattern) |
| `/src/utils/fromResult.ts` | 6 | Null check (external constraint) |
| `/src/wasm-loader/index.ts` | 175 | `null` return (should be Option) |
| `/src/rpc/index.ts` | 200 | None (wrapper pattern) |

---

## Recommendations by Priority

### 🔴 HIGH PRIORITY
None - codebase is functional and uses appropriate patterns for a wrapper library.

### 🟡 MEDIUM PRIORITY

1. **Consider adding `@effect/schema` for domain modeling**
   - Start with high-value types like RPC request/response
   - Keep primitives as wrappers (don't duplicate validation)

2. **Change `getWasmPath()` to return `Option<string>`**
   - More idiomatic Effect style
   - Better null safety

### 🟢 LOW PRIORITY

3. **Use `Schema.Option` in `ErrorContext`** (if adding Schema)
   - Currently `?:` is acceptable
   - Schema would enable better error introspection

---

## Conclusion

This codebase **does not use Effect Schema** but follows a valid **validation wrapper pattern**. The anti-patterns found are **minor** and mostly acceptable given the architectural choice to wrap an existing library rather than build from Schema.

### Key Takeaway

**This is NOT a Schema anti-pattern** - it's a different architectural choice:
- **Schema-first**: Define schemas, derive types, use `Schema.decodeUnknown`
- **Wrapper-first** (current): Wrap existing validators, add Effect error handling

Both approaches are valid. Schema-first would provide more Effect ecosystem benefits but requires more upfront investment.

### Next Steps

If you want to add Schema benefits:
1. Start with RPC layer (most complex types)
2. Use Schema for request/response modeling
3. Keep primitive wrappers as-is (they're thin and working)
4. Add JSON parsing/serialization with Schema

Otherwise, the current approach is **production-ready** and follows Effect patterns correctly.
