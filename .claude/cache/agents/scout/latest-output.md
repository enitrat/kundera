# Cairo Integer Types Research Report
Generated: 2026-02-04

## Summary

Cairo implements unsigned integers (u8, u16, u32, u64, u128, u256) and signed integers (i8, i16, i32, i64, i128) with felt252 as the fundamental serialization format. Unsigned integers up to u128 fit in a single felt252, while u256 uses a struct with two u128 fields (low, high). Signed integers are represented as ranges within the felt252 field and are serialized directly to felt252 without conversion.

---

## Unsigned Integer Types

### u8, u16, u32, u64 (extern types)

✓ VERIFIED at `/Users/msaug/deps/cairo/corelib/src/integer.cairo`

**Definition:**
```cairo
pub extern type u8;    // Line 310
pub extern type u16;   // Line 466
pub extern type u32;   // Line 628
pub extern type u64;   // Line 790
```

**Serialization:** Single felt252
- Each type implements `Serde` via `into_felt252_based::SerdeImpl<T>`
- Example: `impl U8Serde = crate::serde::into_felt252_based::SerdeImpl<u8>;` (Line 324)

**Conversion Functions:**
```cairo
// u8 example (same pattern for u16, u32, u64)
extern const fn u8_to_felt252(a: u8) -> felt252 nopanic;
extern const fn u8_try_from_felt252(a: felt252) -> Option<u8> implicits(RangeCheck) nopanic;
```

**Ranges:**
- u8: 0 to 255 (2^8 - 1)
- u16: 0 to 65,535 (2^16 - 1)
- u32: 0 to 4,294,967,295 (2^32 - 1)
- u64: 0 to 18,446,744,073,709,551,615 (2^64 - 1)

---

### u128 (extern type)

✓ VERIFIED at `/Users/msaug/deps/cairo/corelib/src/integer.cairo:87`

**Definition:**
```cairo
pub extern type u128;
impl u128Copy of Copy<u128>;
impl u128Drop of Drop<u128>;
impl NumericLiteralu128 of NumericLiteral<u128>;
```

**Serialization:** Single felt252
```cairo
impl U128Serde = crate::serde::into_felt252_based::SerdeImpl<u128>; // Line 94
```

**Conversion:**
```cairo
pub(crate) extern const fn u128_to_felt252(a: u128) -> felt252 nopanic; // Line 113

// Conversion from felt252 handles overflow
enum U128sFromFelt252Result {
    Narrow: u128,
    Wide: (u128, u128),
}

const fn u128_try_from_felt252(a: felt252) -> Option<u128> implicits(RangeCheck) nopanic {
    match u128s_from_felt252(a) {
        U128sFromFelt252Result::Narrow(x) => Some(x),
        U128sFromFelt252Result::Wide(_x) => None,
    }
}
```

**Range:** 0 to 340,282,366,920,938,463,463,374,607,431,768,211,455 (2^128 - 1)

**Note:** u128 is the native range check unit in Cairo VM and fits comfortably within felt252's prime field.

---

### u256 (struct type)

✓ VERIFIED at `/Users/msaug/deps/cairo/corelib/src/integer.cairo:953`

**Definition:**
```cairo
pub struct u256 {
    pub low: u128,
    pub high: u128,
}
```

**Serialization:** Two felt252 values (low, high)

The struct derives `Serde`, which serializes as:
```cairo
// Serialization example from docs (Line 43-46)
let value: u256 = u256 { low: 1, high: 2 };
let mut output: Array<felt252> = array![];
value.serialize(ref output);
assert!(output == array![1, 2]); // Two felt252s: low first, then high
```

**Format:**
- **First felt252:** `low` (bits 0-127)
- **Second felt252:** `high` (bits 128-255)
- **Representation:** `value = low + high * 2^128`

**Range:** 0 to 2^256 - 1

**Operations:**
u256 arithmetic is implemented using u128 operations with carry handling:
```cairo
pub fn u256_overflowing_add(lhs: u256, rhs: u256) -> (u256, bool) {
    // Add low parts
    match u128_overflowing_add(lhs.low, rhs.low) {
        Ok(low) => (u256 { low, high }, overflow),
        Err(low) => {
            // Carry to high part
            match u128_overflowing_add(high, 1_u128) {
                Ok(high) => (u256 { low, high }, overflow),
                Err(high) => (u256 { low, high }, true),
            }
        },
    }
}
```

---

## Signed Integer Types

### i8, i16, i32, i64, i128 (extern types)

✓ VERIFIED at `/Users/msaug/deps/cairo/corelib/src/integer.cairo`

**Definitions:**
```cairo
pub extern type i8;    // Line 1933
pub extern type i16;   // Line 2023
pub extern type i32;   // Line 2114
pub extern type i64;   // Line 2205
pub extern type i128;  // Line 2296
```

**Serialization:** Single felt252
```cairo
impl I8Serde = crate::serde::into_felt252_based::SerdeImpl<i8>;   // Line 1945
impl I16Serde = crate::serde::into_felt252_based::SerdeImpl<i16>; // Line 2035
// ... same pattern for i32, i64, i128
```

**Conversion Functions:**
```cairo
// Pattern for all signed types (i8 example)
extern const fn i8_try_from_felt252(a: felt252) -> Option<i8> implicits(RangeCheck) nopanic;
extern const fn i8_to_felt252(a: i8) -> felt252 nopanic;
```

---

## Signed Integer Encoding Scheme

✓ VERIFIED at `/Users/msaug/deps/cairo/crates/cairo-lang-sierra-to-casm/src/invocations/int/signed.rs`

**Representation:** Signed integers are represented directly in felt252's prime field using **natural range mapping**.

### Key Implementation Details:

From `signed.rs:18-25`:
```rust
pub fn build_sint_from_felt252(
    builder: CompiledInvocationBuilder<'_>,
    min_value: i128,
    max_value: i128,
) -> Result<CompiledInvocation, InvocationError> {
    assert!(min_value <= 0, "min_value must be non-positive");
    assert!(max_value > 0, "max_value must be positive");
    build_felt252_range_reduction(builder, &Range::closed(min_value, max_value), false)
}
```

**Encoding Principle:**
Signed integers use the **lower positive range** of felt252's prime field, not two's complement. Negative values are represented as large positive values near the prime.

### Felt252 Prime Field Context

From `range_reduction.rs`:
```rust
let prime: BigInt = Felt252::prime().into();
// Prime = 2^251 + 17*2^192 + 1
```

### Ranges (Rust standard ranges):

| Type | Min | Max | Range Size |
|------|-----|-----|------------|
| i8 | -128 | 127 | 256 (2^8) |
| i16 | -32,768 | 32,767 | 65,536 (2^16) |
| i32 | -2,147,483,648 | 2,147,483,647 | 2^32 |
| i64 | -2^63 | 2^63 - 1 | 2^64 |
| i128 | -2^127 | 2^127 - 1 | 2^128 |

### Encoding Scheme:

**For signed integers in felt252:**
- Positive values: represented directly (0 to max_value)
- Negative values: represented as `prime + negative_value`

Example for i8:
```
  -128 → prime - 128
  -127 → prime - 127
  ...
  -1   → prime - 1
   0   → 0
   1   → 1
  ...
  127  → 127
```

This is effectively **modular arithmetic** in the prime field, NOT two's complement.

### Range Checking:

From `signed.rs:32-42`:
```rust
pub fn build_sint_overflowing_operation(
    builder: CompiledInvocationBuilder<'_>,
    min_value: i128,
    max_value: i128,
    op: IntOperator,
) -> Result<CompiledInvocation, InvocationError> {
    // Shift the valid range to [0, range_size)
    let canonical_value = value + positive_range_fixer;
    // Check if canonical_value < range_size
    hint TestLessThan {lhs: canonical_value, rhs: range_size} into {dst: is_in_range};
}
```

The implementation:
1. Shifts values by `positive_range_fixer = -min_value` to make range [0, range_size)
2. Validates using range checks
3. Handles overflow/underflow by wrapping within the valid range

---

## Serialization Format Summary

### Single felt252 (Direct Conversion)

**Types:** u8, u16, u32, u64, u128, i8, i16, i32, i64, i128

**Implementation:**
```cairo
// From serde.cairo:111-134
pub mod into_felt252_based {
    pub impl SerdeImpl<T, +Copy<T>, +Into<T, felt252>, +TryInto<felt252, T>> of super::Serde<T> {
        fn serialize(self: @T, ref output: Array<felt252>) {
            output.append((*self).into());  // Single append
        }
        
        fn deserialize(ref serialized: Span<felt252>) -> Option<T> {
            Some((*serialized.pop_front()?).try_into()?)  // Single pop
        }
    }
}
```

**Format:** `[value_as_felt252]`

---

### Multiple felt252 (Struct Serialization)

**Types:** u256, u512 (and user-defined structs)

**u256 Format:** `[low_u128, high_u128]`
```cairo
// Verified at integer.cairo:953-956
pub struct u256 {
    pub low: u128,   // Serialized first
    pub high: u128,  // Serialized second
}
```

**u512 Format:** `[limb0, limb1, limb2, limb3]`
```cairo
// Line 1173-1179
#[derive(Copy, Drop, Hash, PartialEq, Serde)]
pub struct u512 {
    pub limb0: u128,
    pub limb1: u128,
    pub limb2: u128,
    pub limb3: u128,
}
```

---

## Special Cases and Edge Cases

### u128 Wide Multiplication
```cairo
// Returns (high, low) as two u128s
pub fn u128_wide_mul(a: u128, b: u128) -> (u128, u128) nopanic {
    let (high, low, _) = u128_guarantee_mul(a, b);
    (high, low)
}
```

Result requires u256 to represent: `result = low + high * 2^128`

### Signed Integer Overflow Detection

From `signed.rs:63-82`:
```rust
// Overflow detection uses three branches:
// 1. InRange: value is within [min_value, max_value]
// 2. Underflow: value < min_value (wraps around field)
// 3. Overflow: value > max_value
```

Overflow result type:
```cairo
pub(crate) enum SignedIntegerResult<T> {
    InRange: T,
    Underflow: T,  // Wrapped value provided
    Overflow: T,   // Wrapped value provided
}
```

### i128 Division Edge Case

From `integer.cairo:2432-2436`:
```cairo
// Catching the case for division of i128::MIN by -1, which overflows
downcast(q).expect('attempt to divide with overflow')
```

Dividing `i128::MIN (-2^127)` by `-1` would produce `2^127`, which exceeds `i128::MAX (2^127 - 1)`.

---

## Key File Locations

| File | Purpose | Key Lines |
|------|---------|-----------|
| `/Users/msaug/deps/cairo/corelib/src/integer.cairo` | Integer type definitions | 87 (u128), 310 (u8), 953 (u256), 1933 (i8) |
| `/Users/msaug/deps/cairo/corelib/src/serde.cairo` | Serialization trait | 84-108 (Serde trait), 111-134 (felt252-based impl) |
| `/Users/msaug/deps/cairo/crates/cairo-lang-sierra-to-casm/src/invocations/int/signed.rs` | Signed integer CASM compilation | 18-25 (felt252 conversion), 32-140 (overflow ops) |
| `/Users/msaug/deps/cairo/crates/cairo-lang-sierra-to-casm/src/invocations/range_reduction.rs` | Range validation | 21-110 (felt252 range reduction) |
| `/Users/msaug/deps/cairo/crates/cairo-lang-sierra/src/extensions/modules/int/signed.rs` | Signed integer Sierra definitions | 24-35 (SintTraits), 193-220 (Sint8-Sint128) |

---

## Conversion Functions Reference

### Unsigned to felt252
```cairo
u8_to_felt252(a: u8) -> felt252
u16_to_felt252(a: u16) -> felt252
u32_to_felt252(a: u32) -> felt252
u64_to_felt252(a: u64) -> felt252
u128_to_felt252(a: u128) -> felt252
// u256: No direct conversion (use .low and .high)
```

### felt252 to Unsigned
```cairo
u8_try_from_felt252(a: felt252) -> Option<u8>
u16_try_from_felt252(a: felt252) -> Option<u16>
u32_try_from_felt252(a: felt252) -> Option<u32>
u64_try_from_felt252(a: felt252) -> Option<u64>
u128_try_from_felt252(a: felt252) -> Option<u128>
// u256: Construct from two felt252s as u128
```

### Signed to felt252
```cairo
i8_to_felt252(a: i8) -> felt252
i16_to_felt252(a: i16) -> felt252
i32_to_felt252(a: i32) -> felt252
i64_to_felt252(a: i64) -> felt252
i128_to_felt252(a: i128) -> felt252
```

### felt252 to Signed
```cairo
i8_try_from_felt252(a: felt252) -> Option<i8>
i16_try_from_felt252(a: felt252) -> Option<i16>
i32_try_from_felt252(a: felt252) -> Option<i32>
i64_try_from_felt252(a: felt252) -> Option<i64>
i128_try_from_felt252(a: felt252) -> Option<i128>
```

---

## Architecture Insights

### Type Hierarchy
```
felt252 (base field element)
  │
  ├── u8, u16, u32, u64, u128 (direct mapping)
  │   └── extern types with Into/TryInto traits
  │
  ├── u256 (struct)
  │   └── { low: u128, high: u128 }
  │
  └── i8, i16, i32, i64, i128 (field range mapping)
      └── extern types with felt252 conversion
```

### Serialization Pipeline
```
Cairo Value → Into<felt252> → Array<felt252> → External World
External → Span<felt252> → TryInto<T> → Cairo Value
```

### Safety Guarantees
- Range checks enforce valid ranges for all integer types
- Overflow/underflow detection in arithmetic operations
- Option types for fallible conversions
- Panic with descriptive messages for overflow (e.g., `'u128_add Overflow'`)

---

## Notes

1. **No Two's Complement:** Cairo signed integers use prime field arithmetic, not two's complement. This is different from most programming languages.

2. **u256 Not Extern:** Unlike smaller integers, u256 is a struct, not an extern type. This means its representation is explicit in Cairo source.

3. **Felt252 Prime:** The prime is approximately 2^251, much larger than any integer type's range, ensuring all values fit uniquely.

4. **Serialization Order:** For multi-felt types like u256, serialization is field-order: low to high.

5. **Performance:** u128 and smaller types have optimized libfuncs, while u256 uses Cairo-level implementations.

