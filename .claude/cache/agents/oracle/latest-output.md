# Research Report: Primitives Documentation Comparison (Voltaire vs Kundera)
Generated: 2026-02-01

## Summary

Voltaire (and its reference library Ox) uses a **modular, hierarchical documentation structure** where each primitive type (Address, Hex, Uint) has its own dedicated page with sub-sections for constructors, validation, conversions, and methods. Kundera's current primitives documentation is a **single flat page** that covers all types together with minimal depth. The key gap is Kundera lacks the granular, method-by-method API reference structure that makes Voltaire/Ox documentation highly navigable.

## Questions Answered

### Q1: How does Voltaire structure primitive type documentation?
**Answer:** Voltaire follows a pattern similar to Ox (which Voltaire builds upon). Each primitive type gets:
1. **Main overview page** (`/primitives/address.md`) - concept explanation, why the type exists
2. **Sub-pages for categories**:
   - `/primitives/address/constructors.md` - all ways to create the type
   - `/primitives/address/validation.md` - validation methods
   - `/primitives/address/conversions.md` - conversion to/from other types
   - `/primitives/address/methods.md` - utility methods

**Source:** [Ox Documentation](https://oxlib.sh/), [Voltaire GitHub](https://github.com/evmts/voltaire)
**Confidence:** High (verified from Ox patterns which Voltaire mirrors)

### Q2: How does Kundera currently document its primitives?
**Answer:** Kundera uses a single flat file (`/api/primitives.mdx`) containing:
- Imports section
- Felt252 section (constructors, conversions, validation)
- Branded Address Types section (ContractAddress, ClassHash, StorageKey)
- Short Strings section
- Types section (type definitions)
- Constants section

All content is on one page with H2/H3 headings for navigation.
**Source:** `/Users/msaug/workspace/kundera/docs/api/primitives.mdx`
**Confidence:** High (verified)

### Q3: What documentation sections/patterns is Kundera missing?
**Answer:**
| Missing Pattern | Voltaire/Ox Has | Kundera Has |
|-----------------|-----------------|-------------|
| Per-type sub-pages | Yes (address/, hex/, uint/) | No (single page) |
| Constructors dedicated section | Yes (fromHex, fromBytes, fromPublicKey) | Partial (listed inline) |
| Validation dedicated section | Yes (validate, assert, isValid) | Brief mention only |
| Error handling docs | Yes (what errors are thrown) | None |
| Static methods vs instance | Clear separation | Mixed |
| Comparison methods | Yes (equals, compare, lt, gt) | Only `equals()` |
| Arithmetic methods | Yes (for Uint: add, sub, mul, div) | None documented |
| Checksumming (for Address) | Yes (toChecksummed) | N/A (Starknet doesn't use checksums) |

**Confidence:** High

### Q4: Specific recommendations for Kundera?
**Answer:** See Recommendations section below.
**Confidence:** High

## Detailed Findings

### Finding 1: Ox/Voltaire Documentation Structure

**Source:** [Ox Guides](https://oxlib.sh/guides/bytes-hex), [Ox API Reference](https://oxlib.sh/api)

**Key Structure Pattern:**
```
/primitives/
  address.md          # Overview: What is an Address?
  address/
    constructors.md   # Address(), fromHex(), fromBytes(), fromPublicKey()
    validation.md     # validate(), assert(), isValid()
    conversions.md    # toHex(), toBytes(), toChecksummed()
    methods.md        # equals(), compare()
  hex.md              # Overview: What is Hex?
  hex/
    constructors.md   # fromString(), fromNumber(), fromBytes()
    ...
  uint.md
  uint/
    ...
```

**Per-Method Documentation Pattern:**
```markdown
### Address.fromHex

Create an Address from a hex string.

**Signature:**
\`\`\`typescript
function fromHex(hex: string): Address
\`\`\`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| hex | string | Hex-encoded address with 0x prefix |

**Returns:** `Address` - Validated address instance

**Throws:** `InvalidAddressError` if not valid

**Example:**
\`\`\`typescript
const addr = Address.fromHex('0x742d35Cc...')
\`\`\`
```

### Finding 2: Kundera's Current Structure

**Source:** `/Users/msaug/workspace/kundera/docs/api/primitives.mdx`

**Current Structure:**
```
/api/primitives.mdx (single file, ~247 lines)
  ## Imports
  ## Felt252
    ### Felt252 (constructor)
    ### Felt252.fromHex / fromBigInt / fromBytes
    ### toHex / toBigInt
    ### Validation
  ## Branded Address Types
    ### ContractAddress
    ### ContractAddressUnchecked
    ### ClassHash / ClassHashUnchecked
    ### StorageKey / StorageKeyUnchecked
    ### Address.isValid
  ## Short Strings
  ## Types
  ## Constants
```

**Gaps Identified:**
1. No parameter tables for functions
2. No error documentation (what throws?)
3. No dedicated validation section per type
4. Missing methods like `equals()` documentation for addresses
5. No cross-referencing to related guides

### Finding 3: Ox Type-Safety Documentation Pattern

**Source:** [Voltaire GitHub](https://github.com/evmts/voltaire), [Ox](https://oxlib.sh)

Voltaire/Ox prominently features **type-safety documentation** showing how branded types prevent bugs:

```typescript
// Ox example - showing the problem it solves
// In viem, both are `0x${string}` - can mix them up!
const addr: Address = '0x...'
const hash: Hash = '0x...'
someFunction(hash, addr) // Compiles fine, breaks at runtime!

// In Ox/Voltaire - distinct types
const addr = Address('0x...')
const hash = Hash('0x...')
someFunction(hash, addr) // Compile error!
```

Kundera has this in `/concepts/branded-types.mdx` but could integrate examples into the primitives API docs.

## Comparison Matrix

| Aspect | Voltaire/Ox | Kundera | Priority |
|--------|-------------|---------|----------|
| **Structure** | Multi-page hierarchy | Single flat page | High |
| **Method signatures** | TypeScript + table | TypeScript only | Medium |
| **Parameters** | Documented in tables | Inline in examples | Medium |
| **Return types** | Explicit section | Inline | Low |
| **Errors thrown** | Documented | Not documented | High |
| **Examples per method** | Yes | Partial | Medium |
| **Type definitions** | Separate section | Bottom of page | Low |
| **Related links** | Per-section | Only at bottom | Medium |

## Recommendations

### For Kundera Primitives Documentation

#### 1. Split into Sub-Pages (High Priority)

**Proposed structure:**
```
/api/primitives/
  index.mdx           # Overview + imports
  felt252.mdx         # Felt252 deep dive
  felt252/
    constructors.mdx  # Felt252(), fromHex(), fromBigInt(), fromBytes()
    validation.mdx    # isValid(), isZero(), equals()
    conversions.mdx   # toHex(), toBigInt(), toBytes()
  address.mdx         # ContractAddress overview
  address/
    constructors.mdx  # ContractAddress(), ContractAddressUnchecked()
    validation.mdx    # Address.isValid()
  class-hash.mdx
  storage-key.mdx
  short-strings.mdx   # encodeShortString, decodeShortString
```

#### 2. Add Parameter Tables (Medium Priority)

For each method, add:
```markdown
### Felt252.fromHex

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| hex | string | Yes | Hex string with 0x prefix |

**Returns:** `Felt252Type`

**Throws:** `InvalidFeltError` if value exceeds FIELD_PRIME
```

#### 3. Document Errors (High Priority)

Create a section showing what errors each function can throw:
```markdown
## Errors

| Error | Thrown By | Description |
|-------|-----------|-------------|
| InvalidFeltError | Felt252(), fromHex() | Value exceeds field prime |
| InvalidAddressError | ContractAddress() | Invalid contract address format |
| ShortStringTooLongError | encodeShortString() | String exceeds 31 characters |
```

#### 4. Add Missing Methods Documentation

Document these methods that exist in the codebase but are not in docs:
- `Felt252Type.toBytes()`
- Comparison methods (if they exist)
- Any static helpers on Address, ClassHash, StorageKey

#### 5. Cross-Reference Branded Types

Add a callout box at the top of primitives:
```markdown
<Info>
Kundera uses branded types for type safety. See [Branded Types](/concepts/branded-types) for why `ContractAddress` and `ClassHash` are distinct types even though both are 252-bit values.
</Info>
```

#### 6. Add Guides Integration

Link to practical guides from API docs:
```markdown
## Related Guides
- [Encoding ABI Parameters](/guides/abi/encode-decode) - How felts are encoded in calldata
- [Contract Reads](/skills/contract-read) - Using addresses in RPC calls
```

### Implementation Checklist

- [ ] Create `/api/primitives/` directory structure
- [ ] Move Felt252 content to dedicated page with sub-pages
- [ ] Move Address types to dedicated page with sub-pages  
- [ ] Add parameter tables to all function docs
- [ ] Document error types and which functions throw them
- [ ] Add "Related" links at section level, not just page bottom
- [ ] Review source code for undocumented methods
- [ ] Add type-safety examples (from branded-types.mdx) to relevant sections

## Sources

1. [Voltaire Documentation](https://voltaire.tevm.sh/) - Main Voltaire docs site
2. [Ox Documentation](https://oxlib.sh/) - Ethereum Standard Library that Voltaire builds upon
3. [Ox Bytes & Hex Guide](https://oxlib.sh/guides/bytes-hex) - Example of guide-style documentation
4. [Ox API Reference](https://oxlib.sh/api) - API reference structure
5. [evmts/voltaire GitHub](https://github.com/evmts/voltaire) - Source repository
6. Kundera `/docs/api/primitives.mdx` - Current Kundera primitives documentation
7. Kundera `/docs/concepts/branded-types.mdx` - Branded types conceptual documentation

## Open Questions

- Does Kundera have comparison methods (lt, gt, lte, gte) for Felt252 that should be documented?
- Are there planned arithmetic methods for Felt252 (currently in crypto.mdx as feltAdd, etc.) that should be moved to primitives?
- Should short strings get their own sub-page or stay bundled with primitives?
