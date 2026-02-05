# Codebase Report: FunctionRet Type Implementation and Typed decodeOutput
Generated: 2026-02-05

## Summary
The typed `decodeOutput` feature uses TypeScript's type inference with `abi-wan-kanabi` to provide compile-time type safety for ABI function return values. The `FunctionRet<TAbi, TFunctionName>` type extracts the return type from the ABI definition.

## 1. FunctionRet Type Definition

### Location
✓ VERIFIED: External dependency `abi-wan-kanabi@2.2.4`

**File:** `node_modules/.pnpm/abi-wan-kanabi@2.2.4/node_modules/abi-wan-kanabi/dist/kanabi.d.ts`

**Definition:**
```typescript
export type FunctionRet<
  TAbi extends Abi, 
  TFunctionName extends ExtractAbiFunctionNames<TAbi>
> = ExtractAbiFunction<TAbi, TFunctionName>['outputs'] extends readonly [] 
  ? void 
  : StringToPrimitiveType<TAbi, ExtractAbiFunction<TAbi, TFunctionName>['outputs'][0]['type']>;
```

### How It Works

1. **Extract function from ABI** - Uses `ExtractAbiFunction` to get the specific function entry
2. **Check outputs** - If `outputs` is empty array, return `void`
3. **Map first output to primitive** - Uses `StringToPrimitiveType` to convert Cairo type string to TypeScript type
4. **Type mapping** - Uses configured types from `Config` interface (see kanabi-config.d.ts)

### Type Mapping Chain

```typescript
StringToPrimitiveType<TAbi, T> 
  → checks if T is primitive (felt252, u256, etc.)
  → checks if T is generic (Array<T>, Option<T>, Result<T,E>)
  → checks if T is tuple
  → checks if T is struct (looks up in ABI)
  → checks if T is enum (looks up in ABI)
```

**Primitive Lookup:**
```typescript
{
  'core::felt252': ResolvedConfig['FeltType'],
  'core::integer::u256': ResolvedConfig['U256Type'],
  'core::starknet::contract_address::ContractAddress': ResolvedConfig['AddressType'],
  'core::bool': boolean,
  // etc.
}
```

## 2. decodeOutput Implementation

### Location
✓ VERIFIED: `/Users/msaug/workspace/kundera/packages/kundera-ts/src/abi/calldata.ts:179-206`

**Signature (Typed Overload):**
```typescript
export function decodeOutput<
  TAbi extends KanabiAbi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>
>(
  abi: TAbi,
  fnName: TFunctionName,
  output: bigint[]
): Result<FunctionRet<TAbi, TFunctionName>>;
```

**Signature (Untyped Fallback):**
```typescript
export function decodeOutput(
  abi: Abi,
  fnName: string,
  output: bigint[]
): Result<CairoValue[]>;
```

### Implementation Flow

```typescript
// 1. Parse ABI
const parsedResult = getParsedAbi(abi);

// 2. Get function entry
const fnResult = getFunction(parsed, fnName);
const fn = fnResult.result;

// 3. Decode outputs using output members
return decodeOutputs(output, fn.entry.outputs, parsed);
```

**Runtime decoding** is handled by `decodeOutputs()` in `decode.ts:303`, which:
- Iterates through output members
- Decodes each value according to its Cairo type
- Returns array of `CairoValue[]`

**Type system** ensures the returned `CairoValue[]` matches `FunctionRet<TAbi, TFunctionName>` at compile time.

## 3. Current ABI Type System

### Core Types

**File:** `/Users/msaug/workspace/kundera/packages/kundera-ts/src/abi/types.ts`

| Type | Purpose |
|------|---------|
| `Abi` | Array of ABI entries |
| `AbiEntry` | Union of function/struct/enum/event/constructor/interface/impl |
| `AbiFunctionEntry` | Function definition with inputs/outputs |
| `AbiMember` | Input/output parameter |
| `ParsedAbi` | Indexed ABI with Maps for fast lookup |
| `CairoValue` | Runtime value type (bigint/string/boolean/array/object/enum) |
| `DecodedStruct` | Object with named fields |
| `Result<T, E>` | Voltaire-style result type |

### Kanabi Integration Types

**File:** `/Users/msaug/workspace/kundera/packages/kundera-ts/src/abi/calldata.ts:7-20`

```typescript
import type {
  Abi as KanabiAbi,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
  ExtractArgs,
  FunctionRet,
} from 'abi-wan-kanabi/kanabi';
```

### Type Configuration

**File:** `/Users/msaug/workspace/kundera/packages/kundera-ts/src/abi/kanabi-config.d.ts`

Declares module augmentation for `abi-wan-kanabi` to map Cairo types to Kundera branded types:

```typescript
declare module 'abi-wan-kanabi' {
  export interface Config {
    FeltType: Felt252Type;
    AddressType: ContractAddressType;
    ClassHashType: ClassHashType;
    BigIntType: bigint;
    U8Type: Uint8Type;
    U16Type: Uint16Type;
    // ... all integer types
  }
}
```

This allows `FunctionRet` to resolve to branded primitive types like `Uint256Type` instead of raw `bigint`.

### FunctionArgs Type

**Location:** `abi-wan-kanabi/dist/kanabi.d.ts`

```typescript
export type FunctionArgs<
  TAbi extends Abi, 
  TFunctionName extends ExtractAbiFunctionNames<TAbi>
> = ExtractAbiFunction<TAbi, TFunctionName>['inputs'] extends readonly [] 
  ? [] 
  : _BuildArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>['inputs'], []> extends [infer T] 
    ? T 
    : _BuildArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>['inputs'], []>;
```

**Purpose:** Extract input parameter types for type-safe `encodeCalldata`

## 4. Contract Interaction Patterns

### Pattern 1: Manual Read (contract-read.ts)

**File:** `/Users/msaug/workspace/kundera/packages/kundera-ts/docs/skills/contract-read.ts:44-76`

```typescript
export async function readContract(
  transport: Transport,
  params: ReadContractParams,
): Promise<ContractResult<unknown[]>> {
  const { abi, address, functionName, args = [], blockId } = params;

  // 1. Encode calldata
  const calldataResult = encodeCalldata(abi, functionName, args as any);
  
  // 2. Prepare JSON-RPC call
  const selector = getFunctionSelectorHex(functionName);
  const calldata = calldataResult.result.map((value) => Felt252(value).toHex());
  
  const call: FunctionCall = {
    contract_address: address,
    entry_point_selector: selector,
    calldata: calldata as any,
  };

  // 3. Call via transport
  const output = await starknet_call(transport, call, blockId) as string[];
  
  // 4. Decode output
  const outputFelts = output.map((value) => BigInt(value));
  const decoded = decodeOutput(abi, functionName, outputFelts);
  
  return ok(decoded.result);
}
```

**Usage:**
```typescript
import { readContract } from './contract-read';
import { httpTransport } from '@kundera-sn/kundera-ts/transport';

const result = await readContract(transport, {
  abi: ERC20_ABI,
  address: '0x...',
  functionName: 'balance_of',
  args: [accountAddress],
});
```

### Pattern 2: Viem-Style Contract (contract-viem.ts)

**File:** `/Users/msaug/workspace/kundera/packages/kundera-ts/docs/skills/contract-viem.ts:137-176`

```typescript
export async function readContract(
  transport: Transport,
  params: ReadContractParams,
): Promise<ContractResult<unknown[]>> {
  // Similar to Pattern 1 but with more comprehensive error handling
  
  // Uses same primitives:
  // - encodeCalldata() for args
  // - starknet_call() for RPC
  // - decodeOutput() for results
}
```

**Also includes:**
- `writeContract()` - invoke transactions
- `simulateContract()` - transaction simulation
- `estimateFee()` - fee estimation
- `watchContractEvent()` - event polling

### Pattern 3: Multicall (contract-multicall.ts)

**File:** `/Users/msaug/workspace/kundera/packages/kundera-ts/docs/skills/contract-multicall.ts:57-111`

```typescript
export async function multicall(
  transport: Transport,
  params: MulticallParams,
): Promise<ContractResult<unknown[][]>> {
  const { abi, address, calls } = params;

  // Encode each call
  for (const call of calls) {
    const calldata = encodeCalldata(abi, call.functionName, call.args || []);
    // ...
  }

  // Execute aggregate call
  const output = await starknet_call(transport, aggregateCall);

  // Decode each result
  for (const meta of callMetadata) {
    const outputFelts = /* extract from aggregate output */;
    const decoded = decodeOutput(meta.abi, meta.functionName, outputFelts);
    results.push(decoded.result);
  }
}
```

## 5. Usage Examples

### Example 1: Basic Typed Decode

✓ VERIFIED: `/Users/msaug/workspace/kundera/packages/kundera-ts/src/abi/index.test.ts:338`

```typescript
const result = decodeOutput(ERC20_ABI, 'balance_of', output);
expect(result.error).toBeNull();
// result.result is typed as CairoValue[] (or FunctionRet if using typed overload)
```

### Example 2: Integer Types Round-Trip

✓ VERIFIED: `/Users/msaug/workspace/kundera/packages/kundera-ts/src/abi/integer-types.test.ts:111-119`

```typescript
const TEST_ABI: Abi = [{
  type: 'function',
  name: 'test_all_integers',
  outputs: [{ name: 'result', type: 'core::integer::u256' }],
  // ...
}];

const outputData = [1000000000000000000n, 0n]; // low, high

const result = decodeOutput(TEST_ABI, 'test_all_integers', outputData);
expect(result.error).toBeNull();
// result.result is Uint256Type (via FunctionRet inference)
expect(Uint256.toBigInt(result.result![0])).toBe(1000000000000000000n);
```

### Example 3: decodeOutputObject (Named Fields)

✓ VERIFIED: `/Users/msaug/workspace/kundera/packages/kundera-ts/src/abi/calldata.ts:217-244`

```typescript
const result = decodeOutputObject(ERC20_ABI, 'balance_of', output);
// Returns: Result<{ balance: Uint256Type }>
// Named fields instead of positional array
```

## Key Insights

### Type Safety Architecture

1. **Compile-time inference** - `FunctionRet` extracts return type from ABI at compile time
2. **Runtime decoding** - `decodeOutputs()` performs actual decoding at runtime
3. **Branded types** - Kundera primitives (Uint256Type, Felt252Type) replace raw bigint
4. **Config-driven** - Type mappings declared in kanabi-config.d.ts

### Dual API Pattern

```typescript
// Typed API (with generic parameters)
decodeOutput<TAbi, TFunctionName>(abi: TAbi, fnName: TFunctionName, ...)
  → Result<FunctionRet<TAbi, TFunctionName>>

// Untyped API (without generics)
decodeOutput(abi: Abi, fnName: string, ...)
  → Result<CairoValue[]>
```

**TypeScript picks the typed overload when:**
- `abi` is typed as specific ABI (const assertion or `as const`)
- `fnName` is string literal type (not `string`)

### Limitations

1. **Single return value** - `FunctionRet` only handles `outputs[0]`, multi-output functions return array
2. **No tuple unpacking** - Must index into result array for multiple outputs
3. **Requires const assertion** - ABI must be `as const` for inference to work

## Architecture Map

```
[User Code]
    ↓
[decodeOutput<TAbi, TFunctionName>]  ← Type inference happens here
    ↓
[getParsedAbi] → Parse ABI into indexed structure
    ↓
[getFunction] → Lookup function by name
    ↓
[decodeOutputs] → Runtime decoding (decode.ts)
    ↓
    ├─ [decodeValue] → Decode single value
    │     ↓
    │     ├─ Primitive (felt252, u256, etc.)
    │     ├─ Array/Tuple
    │     ├─ Struct (recursive)
    │     └─ Enum
    │
[Result<FunctionRet<TAbi, TFunctionName>>]  ← Typed return value
```

## Files Reference

| File | Purpose | Entry Points |
|------|---------|--------------|
| `src/abi/types.ts` | Core ABI type definitions | `Abi`, `CairoValue`, `Result` |
| `src/abi/calldata.ts` | High-level encode/decode API | `decodeOutput`, `decodeOutputObject` |
| `src/abi/decode.ts` | Runtime decoding logic | `decodeOutputs`, `decodeValue` |
| `src/abi/parse.ts` | ABI parsing and indexing | `parseAbi`, `getFunction` |
| `src/abi/kanabi-config.d.ts` | Type config for abi-wan-kanabi | Module augmentation |
| `src/abi/index.ts` | Public API re-exports | All ABI functions |
| `docs/skills/contract-read.ts` | Manual read pattern | `readContract()` |
| `docs/skills/contract-viem.ts` | Viem-style helpers | `readContract()`, `writeContract()` |
| `docs/skills/contract-multicall.ts` | Batch calls | `multicall()` |

## Testing Coverage

✓ VERIFIED Test files:
- `src/abi/index.test.ts` - Core ABI encode/decode tests
- `src/abi/integer-types.test.ts` - Integer type integration tests
- `docs/skills/contract-read.test.ts` - Contract read pattern validation

## Open Questions

1. **Multi-output handling** - How should FunctionRet handle functions with multiple outputs?
2. **Tuple unpacking** - Should there be a typed variant that unpacks tuples?
3. **Named vs positional** - When to use `decodeOutput` vs `decodeOutputObject`?
