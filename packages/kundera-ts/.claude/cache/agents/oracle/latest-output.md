# Research Report: abi-wan-kanabi Module Augmentation for Custom Type Mappings
Generated: 2026-02-05

## Summary

The `kanabi-config.d.ts` module augmentation is NOT being picked up because the file is never imported or included in the compilation. Module augmentation only works when the augmenting file is part of the TypeScript program. Additionally, kundera-ts defines keys (`U8Type`, `U16Type`, etc.) that abi-wan-kanabi does NOT support - it only has `IntType` for all small integers.

## Questions Answered

### Q1: How does abi-wan-kanabi's Config interface work for type customization?
**Answer:** abi-wan-kanabi uses TypeScript's declaration merging pattern. The `Config` interface in `config.d.ts` is intentionally empty (`export interface Config<...> {}`). The `ResolvedConfig` type then checks if `Config extends { PropertyName: infer type }` - if true, uses the inferred type; otherwise falls back to `DefaultConfig`.

**Source:** [abi-wan-kanabi config.d.ts](https://github.com/keep-starknet-strange/abi-wan-kanabi)
**Confidence:** High (✓ VERIFIED - read actual source)

**Code Pattern:**
```typescript
// abi-wan-kanabi/config.d.ts
export interface Config<OptionT = any, ResultT = any, ErrorT = any> {}

export type ResolvedConfig = {
  AddressType: Config extends { AddressType: infer type } 
    ? type 
    : DefaultConfig['AddressType'];  // fallback: string
  // ...
};
```

### Q2: What's the correct way to set up module augmentation so it's picked up by TypeScript?
**Answer:** Three requirements for module augmentation to work:

1. **File must be a module** - Must have `export {}` or top-level import/export
2. **File must be included in compilation** - Either:
   - Import it explicitly somewhere in your code
   - Add to `tsconfig.json` `include` array
   - Use triple-slash reference directive
3. **Module name must match exactly** - `'abi-wan-kanabi'` not `'abi-wan-kanabi/kanabi'`

**Source:** [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html), [DigitalOcean Module Augmentation](https://www.digitalocean.com/community/tutorials/typescript-module-augmentation)
**Confidence:** High

**Current Problem:** kundera-ts's `kanabi-config.d.ts` is NOT imported anywhere in the source. The file exists but TypeScript never loads it.

### Q3: Are there any known issues or gotchas with kanabi's type inference?
**Answer:** Yes, several:

1. **Limited Config keys** - abi-wan-kanabi only supports these keys:
   - `FeltType`, `AddressType`, `ClassHashType`
   - `BigIntType` (for u64, u128)
   - `IntType` (for u8, u16, u32 - NOT individual U8Type, U16Type, etc.)
   - `U256Type`, `U512Type`, `Bytes31Type`, `ByteArray`, `Secp256k1PointType`
   - `Option`, `Tuple`, `Result`, `Enum`, `Calldata`, `Call`, `CallOptions`, `InvokeOptions`, `InvokeFunctionResponse`

2. **kundera-ts defines unsupported keys:**
   - `U8Type`, `U16Type`, `U32Type`, `U64Type`, `U128Type` ← NOT SUPPORTED
   - `I8Type`, `I16Type`, `I32Type`, `I64Type`, `I128Type` ← NOT SUPPORTED

3. **Signed integers have NO config** - abi-wan-kanabi has no i8-i128 support at all

**Source:** [abi-wan-kanabi kanabi.d.ts lines 142-170](https://github.com/keep-starknet-strange/abi-wan-kanabi)
**Confidence:** High (✓ VERIFIED)

### Q4: How does starknet.js configure abi-wan-kanabi?
**Answer:** starknet.js bundles the module augmentation directly into their main `dist/index.d.ts`. This ensures the augmentation is automatically loaded whenever users import from `starknet`.

**Source:** starknet.js v6.23.1 dist/index.d.ts
**Confidence:** High (✓ VERIFIED)

**starknet.js approach:**
```typescript
// starknet/dist/index.d.ts (bundled output)
declare module 'abi-wan-kanabi' {
  interface Config<OptionT = any, ResultT = any, ErrorT = any> {
    FeltType: BigNumberish;
    U256Type: number | bigint | Uint256;
    U512Type: BigNumberish;
    Secp256k1PointType: BigNumberish;
    Option: CairoOption<OptionT>;
    Tuple: Record<number, BigNumberish | object | boolean>;
    Result: CairoResult<ResultT, ErrorT>;
    Enum: CairoCustomEnum;
    Calldata: RawArgs | Calldata;
    CallOptions: CallOptions;
    InvokeOptions: InvokeOptions;
    InvokeFunctionResponse: InvokeFunctionResponse;
  }
}
```

## Detailed Findings

### Finding 1: Module Augmentation Mechanism in abi-wan-kanabi

**How PrimitiveTypeLookup works (kanabi.d.ts:142-170):**
```typescript
type PrimitiveTypeLookup<TAbi extends Abi> = {
  [_ in CairoFelt]: ResolvedConfig['FeltType'];      // felt252 -> FeltType
  [_ in CairoInt]: ResolvedConfig['IntType'];         // u8,u16,u32 -> IntType
  [_ in CairoBigInt]: ResolvedConfig['BigIntType'];   // u64,u128 -> BigIntType
  [_ in CairoU256]: ResolvedConfig['U256Type'];       // u256 -> U256Type
  [_ in CairoContractAddress]: ResolvedConfig['AddressType'];  // ContractAddress
  [_ in CairoEthAddress]: ResolvedConfig['AddressType'];       // EthAddress
  [_ in CairoClassHash]: ResolvedConfig['ClassHashType'];      // ClassHash
  // ...
};
```

### Finding 2: Why kundera-ts Config Doesn't Work

**Current kundera-ts kanabi-config.d.ts:**
```typescript
declare module 'abi-wan-kanabi' {
  export interface Config {
    FeltType: Felt252Type;        // ✓ Supported
    AddressType: ContractAddressType;  // ✓ Supported
    ClassHashType: ClassHashType;      // ✓ Supported
    BigIntType: bigint;           // ✓ Supported
    
    // ✗ NOT SUPPORTED - these keys don't exist in ResolvedConfig
    U8Type: Uint8Type;
    U16Type: Uint16Type;
    U32Type: Uint32Type;
    U64Type: Uint64Type;
    U128Type: Uint128Type;
    I8Type: Int8Type;
    // ...
  }
}
```

**Problems:**
1. File is never imported → augmentation never loaded
2. `U8Type`, `U16Type`, etc. keys are ignored (not in ResolvedConfig)
3. Signed integer types (i8-i128) have no config option at all

### Finding 3: Correct Configuration Keys

| Cairo Type | Config Key | Default Type |
|------------|------------|--------------|
| felt252 | `FeltType` | `number \| bigint \| string` |
| u8, u16, u32 | `IntType` | `number \| bigint` |
| u64, u128 | `BigIntType` | `number \| bigint` |
| u256 | `U256Type` | `number \| bigint \| U256` |
| u512 | `U512Type` | `string` |
| ContractAddress | `AddressType` | `string` |
| EthAddress | `AddressType` | `string` |
| ClassHash | `ClassHashType` | `string` |
| bytes31 | `Bytes31Type` | `string` |
| ByteArray | `ByteArray` | `string` |

## Recommendations

### For This Codebase

1. **Fix Config keys** - Remove unsupported keys, use correct ones:
```typescript
declare module 'abi-wan-kanabi' {
  export interface Config {
    FeltType: Felt252Type;
    AddressType: ContractAddressType;
    ClassHashType: ClassHashType;
    IntType: Uint8Type | Uint16Type | Uint32Type;  // All small ints
    BigIntType: Uint64Type | Uint128Type;           // Big ints
    U256Type: Uint256Type;
  }
}
```

2. **Ensure file is included** - Add explicit import to abi/index.ts:
```typescript
// Import to trigger module augmentation
import './kanabi-config.js';
```

3. **Or bundle into dist** - Configure tsup to include the augmentation in the main output (like starknet.js does)

4. **Consider branded type union** - Since all u8/u16/u32 map to single `IntType`, you may need a union or lose granularity

### Implementation Notes

- **Gotcha:** abi-wan-kanabi has no support for signed integers (i8-i128). They all fall through to `unknown`.
- **Gotcha:** EthAddress and ContractAddress share the same `AddressType` config
- **Gotcha:** The augmentation must be in the module `'abi-wan-kanabi'`, not `'abi-wan-kanabi/kanabi'`
- **Gotcha:** Config interface needs generic parameters if overriding Option/Result: `Config<OptionT, ResultT, ErrorT>`

## Sources

1. [abi-wan-kanabi GitHub](https://github.com/keep-starknet-strange/abi-wan-kanabi) - Source code with config.ts and kanabi.ts
2. [abi-wan-kanabi npm](https://www.npmjs.com/package/abi-wan-kanabi) - Package documentation
3. [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) - Official docs
4. [DigitalOcean Module Augmentation](https://www.digitalocean.com/community/tutorials/typescript-module-augmentation) - Tutorial
5. [Starknet.js TypeScript Integration](https://starknetjs.com/docs/next/guides/contracts/abi_typescript/) - Reference implementation
6. [ABIType Config](https://abitype.dev/config) - Similar pattern from wagmi/abitype

## Open Questions

- Should kundera-ts fork abi-wan-kanabi to add per-integer-size configs?
- How to handle signed integers (i8-i128) which have no config support?
- Should we match starknet.js and use union types like `BigNumberish` instead of branded types?
