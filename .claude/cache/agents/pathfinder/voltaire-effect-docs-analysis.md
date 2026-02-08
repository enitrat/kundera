# Voltaire Documentation Analysis
Generated: 2026-02-08

## Repository Overview

**URL**: https://github.com/evmts/voltaire  
**Type**: Ethereum primitives + cryptography library (TypeScript + Zig)  
**Docs Framework**: Astro Starlight  
**Philosophy**: Data-first architecture with branded types, tree-shaking, and WASM acceleration

## Directory Structure

```
src/content/docs/
├── index.mdx                    # Landing page
├── getting-started.mdx          # Full onboarding guide (~767 lines)
├── quick-start.mdx              # 3-minute quickstart (~310 lines)
├── overview.mdx                 # Architecture & design philosophy (~584 lines)
├── external-dependencies.mdx    # Dependency documentation
├── wasm.mdx                     # WASM acceleration guide
├── primitives/                  # 23 primitives (Address, Hash, Uint, etc.)
│   ├── branded-types.mdx        # Core concept explanation
│   ├── address/
│   │   ├── index.mdx            # Overview + API reference
│   │   ├── constructors.mdx     # from(), fromHex(), etc.
│   │   ├── conversions.mdx      # toHex(), toChecksummed(), etc.
│   │   ├── comparisons.mdx      # equals(), lessThan(), etc.
│   │   ├── contract-addresses.mdx # CREATE/CREATE2
│   │   ├── validation.mdx       # isValid(), is(), etc.
│   │   ├── variants.mdx         # Checksummed, Uppercase, Lowercase
│   │   ├── uint8array-methods.mdx # Inherited methods
│   │   ├── wasm.mdx             # WASM-accelerated variants
│   │   └── branded-address.mdx  # Functional API docs
│   ├── hash/
│   ├── uint/
│   ├── transaction/
│   │   ├── index.mdx
│   │   ├── types.mdx
│   │   ├── legacy.mdx
│   │   ├── eip1559.mdx
│   │   ├── eip2930.mdx
│   │   ├── eip4844.mdx
│   │   ├── signing.mdx
│   │   ├── serialization.mdx
│   │   ├── hashing.mdx
│   │   └── usage-patterns.mdx
│   └── ... (19 more primitives)
├── crypto/                      # 13 crypto modules
│   ├── comparison.mdx           # Cross-algorithm comparison
│   ├── keccak256/
│   │   └── index.mdx            # Single-page API reference
│   ├── secp256k1/
│   ├── bn254/
│   │   ├── index.mdx
│   │   ├── g2-operations.mdx
│   │   ├── test-vectors.mdx
│   │   └── usage-patterns.mdx
│   └── ... (10 more crypto modules)
└── precompiles/                 # EVM precompiles
    └── bls12-381/
```

**Key observations**:
- **Top-level pages** are large, comprehensive guides (300-800 lines)
- **Primitive docs** split into 6-10 sub-pages by operation category
- **Crypto docs** vary: simple ones (single page), complex ones (multi-page like BN254)
- **No separate "guides" directory** - guides are top-level MDX files

## Page Types & Templates

### 1. Landing Pages (index.mdx)

**Pattern**: Overview → Quick Start (tabbed code) → Types → API sections → Related docs

**Example**: `primitives/address/index.mdx`
```mdx
---
title: Address
description: 20-byte Ethereum address with EIP-55 checksumming
---

# Address

Brief description

## Overview
What it is, why it exists, what it's used for

## Quick Start
<Tabs>
  <TabItem label="Class API">...</TabItem>
  <TabItem label="Namespace API (Tree-shakeable)">...</TabItem>
</Tabs>

## Types
<Tabs>
  <TabItem label="class Address">...</TabItem>
  <TabItem label="type BrandedAddress">...</TabItem>
</Tabs>

## Constants
SIZE, HEX_SIZE, etc.

## API Documentation
Links to sub-pages (Constructors, Conversions, Comparisons, etc.)
```

**Key components**:
- Frontmatter with `title` and `description`
- Dual API tabs (Class vs Tree-shakeable namespace)
- Type definitions in tabs
- Links to sub-pages for detailed API docs

### 2. Getting Started (getting-started.mdx)

**Structure**: Prerequisites → Installation → Quick Start (5 min) → Core Architecture → Branded Types Pattern → Class API Pattern → Choosing API Style → Method Naming Convention → Quick Examples → Type Safety → Performance → First Real Task (15 min) → Troubleshooting → Migration Guides (ethers/viem/web3) → Next Steps → Design Principles

**Key patterns**:
- **Progressive disclosure**: 5-min example → 15-min real task → deep dives
- **Tabs for package managers**: npm/bun/pnpm/yarn
- **Tabs for runtimes**: Node.js/Bun/Browser
- **Migration guides** from competing libraries (ethers.js, viem, web3.js)
- **Troubleshooting accordions** (`<details>` elements)
- **Card grid** for next steps

### 3. Quick Start (quick-start.mdx)

**Structure**: Install → Copy-Paste Example (tabbed by runtime) → What Just Happened → Core Operations → Performance Tip → Bundle Size Tip → Next Steps → Stuck?

**Philosophy**: Get code running in <3 minutes. No theory.

**Key patterns**:
- **Single copy-paste example** that demonstrates core capabilities
- **Minimal explanation** - just "what you did"
- **Quick tips** for optimization (WASM, tree-shaking)
- **Troubleshooting as accordions** at the end

### 4. Overview (overview.mdx)

**Structure**: Architecture diagram → Design Philosophy → Why WASM? → Why Branded Types? → Dual API Pattern → Method Naming Convention → Tree-Shaking First → Branded Types Deep Dive → Multi-Language Support → Project Structure → Error Handling → Performance Patterns → Comparison with Alternatives → Related Documentation

**Philosophy**: Deep dive into "why" and "how it works" without being a tutorial.

**Key patterns**:
- **ASCII art architecture diagram**
- **Comparison tables** (Voltaire vs ethers.js vs viem vs web3.js)
- **FileTree component** for project structure
- **Tabs for language examples** (TypeScript vs Zig)
- **Performance benchmarks** with concrete numbers

### 5. API Reference Sub-Pages (e.g., constructors.mdx, conversions.mdx)

**Pattern**: Title → Method 1 (signature, description, params, returns, throws, example, source link) → Method 2 → ...

**Example structure**:
```mdx
---
title: Address Constructors
description: Creating Address instances from various input types
---

# Constructors

Brief intro

## Universal Constructor

### `new Address(value)`

Description paragraph

```typescript
// Example code
```

**Parameters:**
- `value: Type` - Description

**Returns:** `ReturnType`

**Throws:**
- `ErrorType` - When this happens

Defined in: [path/to/file.js:line](github-link)

## Static Constructors

### `Address.from(value)`

[same structure]

### `Address.fromHex(hex)`

[same structure]
```

**Key patterns**:
- **Method signature in heading** (e.g., `### Address.fromHex(hex)`)
- **Inline code examples** immediately after description
- **Structured metadata**: Parameters, Returns, Throws
- **GitHub source links** to exact file and line number
- **Both instance and static forms** documented

### 6. Concept Pages (e.g., branded-types.mdx)

**Structure**: The Problem → The Solution → Generic Brand Type → Why Symbols? → Voltaire's Approach → Creating Branded Values → Benefits (Type Safety, Self-Documenting, Zero Runtime Cost)

**Philosophy**: Teach the underlying concept with concrete examples.

**Key patterns**:
- **Problem → Solution** structure
- **Progressive complexity** (simple example → generic → real-world)
- **Runtime vs compile-time** clarification
- **Benefits section** with concrete examples
- **No tabs** - linear reading experience

## Guide Structure

**Voltaire doesn't have a separate "guides" directory.** Instead:

1. **Top-level comprehensive guides** (getting-started.mdx, quick-start.mdx, overview.mdx)
2. **API reference split by operation** (constructors, conversions, comparisons)
3. **Concept explanations** (branded-types.mdx, wasm.mdx)
4. **Usage patterns embedded in complex primitives** (transaction/usage-patterns.mdx)

**Template for usage-patterns.mdx**:
```mdx
# Usage Patterns

## Pattern 1: [Use Case]

Description

```typescript
// Example code
```

**When to use:** ...

## Pattern 2: [Use Case]

[same structure]
```

## Navigation Architecture

**Sidebar structure** (from `astro.config.mjs`):

```javascript
sidebar: [
  { label: "Getting Started", link: "/getting-started/" },
  { label: "Core Primitives", autogenerate: { directory: "primitives" } },
  { label: "Cryptography", autogenerate: { directory: "crypto" } },
  // Zig-specific sections
  { label: "Zig Overview", link: "/zig/" },
  { label: "Zig Getting Started", link: "/zig/getting-started/" },
  { label: "Zig Contributing", link: "/zig/contributing/" },
  { label: "Zig Primitives", autogenerate: { directory: "zig/primitives" } },
  { label: "Zig Cryptography", autogenerate: { directory: "zig/crypto" } },
  { label: "Zig Precompiles", autogenerate: { directory: "zig/precompiles" } },
]
```

**Autogeneration**: Starlight automatically builds navigation from directory structure. Sub-pages appear nested under parent.

**Organization principles**:
1. **Top-level quick access** (Getting Started)
2. **Category-based grouping** (Primitives, Crypto, Precompiles)
3. **Multi-language separation** (TypeScript in main docs, Zig in dedicated section)
4. **Autogenerated sub-navigation** (no manual maintenance)

## Service Documentation Pattern

**Not applicable** - Voltaire is a primitives library, not an Effect-based service library. However, it documents **dual APIs** (class vs namespace) extensively.

**Dual API documentation pattern**:

1. **Index page shows both APIs side-by-side** in tabs:
   ```mdx
   <Tabs>
     <TabItem label="Class API">
       const addr = new Address("0x...")
       addr.toHex()
     </TabItem>
     <TabItem label="Namespace API (Tree-shakeable)">
       const addr = Address.fromHex("0x...")
       Address.toHex(addr)
     </TabItem>
   </Tabs>
   ```

2. **API reference pages document static methods**:
   ```mdx
   ### `instance.toHex()`
   [description]
   
   **Static form:**
   ```typescript
   Address.toHex(addr)
   ```
   ```

3. **Separate page for functional API** (`branded-address.mdx`) documents tree-shakeable namespace

**Key insight for kundera-effect**: This dual-API pattern maps to **Effect Layer vs raw service** documentation.

## Code Examples in Docs

**Location**: Inline in MDX files

**Pattern**:
```mdx
### Method name

Description paragraph

```typescript
// Inline example
const result = method(input)
console.log(result)
```

**Parameters:**
...
```

**Testing**: Not visible. Examples are NOT extracted and tested separately. (This is a potential weakness.)

**Tabs for variants**:
```mdx
<Tabs>
  <TabItem label="Class API">
    // Example 1
  </TabItem>
  <TabItem label="Namespace API">
    // Example 2
  </TabItem>
  <TabItem label="WASM">
    // Example 3
  </TabItem>
</Tabs>
```

**Key patterns**:
- **Inline, immediately after description**
- **Complete, runnable examples** (not snippets)
- **Tabs for API variants** (class vs namespace vs WASM)
- **Comments explain key points**
- **No separate examples directory**

## Getting Started Flow

**Three entry points**:

1. **README.md** → Quick overview → Link to "Getting Started Guide"
2. **quick-start.mdx** → 3-minute copy-paste example → Links to deep dives
3. **getting-started.mdx** → Comprehensive 767-line guide covering everything

**Progression**:
```
README (skim) → quick-start.mdx (3 min) → getting-started.mdx (30 min)
                                       ↓
                              Primitives / Crypto docs
```

**getting-started.mdx structure**:
1. **Prerequisites** (Node version, package manager, knowledge)
2. **Installation** (tabs for npm/bun/pnpm/yarn)
3. **Quick Start (5 Minutes)** - Runnable example with steps
4. **Core Architecture** - Branded types + namespaces explanation
5. **Branded Types Pattern** - Deep dive with examples
6. **Class API Pattern** - Alternative approach
7. **Choosing an API Style** - Decision guide (tabs)
8. **Method Naming Convention** - Universal patterns
9. **Quick Examples** - Common operations
10. **Type Safety** - Benefits with examples
11. **Performance** - WASM, tree-shaking, constant-time ops
12. **First Real Task (15 Minutes)** - Sign a transaction (steps)
13. **Troubleshooting** - Common issues (accordions)
14. **Migration Guides** - From ethers/viem/web3 (tabs)
15. **Next Steps** - Card grid with links
16. **Design Principles** - Philosophy summary

**Key insight**: Progressive disclosure from "copy-paste code" → "understand concepts" → "make architectural decisions" → "migrate from X" → "go deeper"

## Presets/Recipes

**No dedicated recipes section.** Instead:

1. **usage-patterns.mdx files** in complex primitives (e.g., `transaction/usage-patterns.mdx`)
2. **Quick examples embedded in getting-started.mdx**
3. **Migration guides** (ethers → Voltaire, viem → Voltaire, web3 → Voltaire)

**Example migration guide structure**:
```mdx
### From ethers.js

<Tabs>
  <TabItem label="Addresses">
    // ethers code
    // Voltaire equivalent
  </TabItem>
  <TabItem label="Hashing">
    // ethers code
    // Voltaire equivalent
  </TabItem>
  <TabItem label="Signing">
    // ethers code
    // Voltaire equivalent
  </TabItem>
</Tabs>
```

**Pattern for usage-patterns.mdx**:
```mdx
# Usage Patterns

## Pattern 1: Creating Legacy Transactions

Description

```typescript
const tx = {
  type: 0,
  // ...
}
```

**When to use**: Pre-EIP-2718 transactions

## Pattern 2: EIP-1559 Transactions

[same structure]
```

## Key Takeaways for kundera-effect

### What to Steal

1. **Dual API documentation pattern** (Class vs Namespace → Layer vs Raw Service)
   - Index page with side-by-side tabs
   - API reference documents both forms
   - Separate page for functional API

2. **Progressive onboarding**:
   - README → quick-start.mdx (3 min) → getting-started.mdx (30 min) → deep dives
   - Copy-paste example first, theory later

3. **API reference split by operation category**:
   - Not one giant page per primitive
   - Separate pages: constructors.mdx, conversions.mdx, comparisons.mdx, etc.
   - Makes navigation easier, reduces cognitive load

4. **Method signature as heading**: `### FunctionName.method(param)`
   - Scannable
   - Inline examples immediately follow
   - Structured metadata (Parameters, Returns, Throws)

5. **Migration guides** from competing libraries:
   - Side-by-side code examples in tabs
   - One tab per common operation
   - Helps users transition

6. **Concept pages** (branded-types.mdx, wasm.mdx):
   - Problem → Solution → Benefits structure
   - Teach underlying pattern, not just API

7. **Troubleshooting as accordions** (`<details>` elements):
   - Common issues at end of getting-started
   - Doesn't clutter main flow
   - Easy to scan

8. **Comparison tables**:
   - Voltaire vs competitors (bundle size, features, etc.)
   - Helps users understand tradeoffs

9. **GitHub source links** in API docs:
   - Direct link to implementation
   - Exact file + line number
   - Builds trust, enables contribution

10. **Card grid for next steps**:
    - Visual, clickable links to related docs
    - Better than bullet list

### What to Adapt for Effect

1. **Service documentation pattern**:
   - **Shape** section: Type signature of the service
   - **Layer** section: How to construct (ChainService.Live, ChainService.Default)
   - **Dependencies** section: What services it requires
   - **Errors** section: What can go wrong (with Effect.gen examples)
   - **Usage** section: Effect.gen example with all() / andThen() patterns

2. **Effect-specific concepts**:
   - Dedicated pages for Layer composition, FiberRef, Resource management
   - Problem → Solution → Effect way structure

3. **Error handling examples**:
   - Voltaire uses try/catch (TypeScript)
   - kundera-effect needs Effect.gen + Error.match patterns

4. **Testing patterns**:
   - Voltaire doesn't show this (weakness)
   - kundera-effect should document TestContext, Layer.succeed, Effect.runPromise

5. **Common recipes**:
   - Not "usage-patterns.mdx" but "recipes.mdx"
   - Read balance → Check sufficient → Transfer (Effect.gen composition)
   - Batch operations with Effect.all
   - Timeout/retry patterns with Effect.timeout / Effect.retry

### Structure Recommendation for kundera-effect

```
docs/
├── index.mdx                     # Landing
├── getting-started.mdx           # Comprehensive guide (Effect.gen, Layer, etc.)
├── quick-start.mdx               # 3-min example
├── overview.mdx                  # Architecture + philosophy
├── effect-concepts/              # Effect-specific patterns
│   ├── layers.mdx
│   ├── error-handling.mdx
│   ├── resource-management.mdx
│   └── testing.mdx
├── services/                     # One directory per service
│   ├── ChainService/
│   │   ├── index.mdx             # Overview + Quick Start
│   │   ├── shape.mdx             # Type signature
│   │   ├── layer.mdx             # Layer construction
│   │   ├── errors.mdx            # Error types
│   │   └── usage.mdx             # Effect.gen examples
│   ├── TransportService/
│   ├── WalletService/
│   └── ... (10 more services)
├── recipes/
│   ├── read-write-pattern.mdx
│   ├── batch-operations.mdx
│   ├── timeout-retry.mdx
│   └── testing-strategies.mdx
└── migration/
    ├── from-viem.mdx
    └── from-ethers.mdx
```

**Key differences from Voltaire**:
- **effect-concepts/** directory for Effect-specific patterns (not in Voltaire)
- **services/** instead of primitives/ (domain terminology)
- **recipes/** for Effect composition patterns
- **shape.mdx + layer.mdx** instead of constructors.mdx (Effect terminology)

### Navigation for kundera-effect

```javascript
sidebar: [
  { label: "Getting Started", link: "/getting-started/" },
  { label: "Effect Concepts", autogenerate: { directory: "effect-concepts" } },
  { label: "Services", autogenerate: { directory: "services" } },
  { label: "Recipes", autogenerate: { directory: "recipes" } },
  { label: "Migration", autogenerate: { directory: "migration" } },
]
```

## Anti-patterns to Avoid

1. **No tested code examples**:
   - Voltaire's inline examples aren't tested
   - kundera-effect should extract examples to `.test.ts` files

2. **Overly long pages**:
   - getting-started.mdx is 767 lines (borderline too long)
   - Split into sub-pages if >500 lines

3. **Inconsistent terminology**:
   - Voltaire sometimes says "Namespace API", sometimes "Tree-shakeable", sometimes "Functional API"
   - Pick one term and stick to it

4. **Missing progressive examples**:
   - Some API reference pages just list methods without showing full workflow
   - Always show "how methods compose"

5. **No recipes for common patterns**:
   - Users have to piece together from API reference
   - kundera-effect should have explicit recipes

6. **GitHub links break on refactors**:
   - Line numbers change
   - Consider linking to function name anchor instead

7. **No visual diagrams for complex flows**:
   - Voltaire has one ASCII art diagram (architecture)
   - Could benefit from more (e.g., transaction signing flow)
   - kundera-effect should have diagrams for Layer composition, service dependencies

## Final Recommendations

### Documentation Strategy for kundera-effect

1. **Start with quick-start.mdx** (3-min copy-paste Effect.gen example)
2. **Write getting-started.mdx** covering:
   - Effect.gen basics
   - Layer composition
   - ChainService + TransportService wiring
   - Error handling with Error.match
   - First real task: Read balance and transfer
3. **Create service template**:
   - index.mdx (overview + quick start)
   - shape.mdx (service type signature)
   - layer.mdx (Layer.effect, Layer.succeed patterns)
   - errors.mdx (what can fail, how to handle)
   - usage.mdx (Effect.gen recipes)
4. **Document Effect patterns** in effect-concepts/:
   - layers.mdx (Layer composition, dependency injection)
   - error-handling.mdx (Error.match, catchTag, fallback)
   - resource-management.mdx (Scope, acquire/release)
   - testing.mdx (TestContext, Effect.runPromise, Layer.succeed mocks)
5. **Add recipes/** for common workflows:
   - Read balance → check → transfer
   - Batch calls with Effect.all
   - Timeout/retry patterns
   - Fallback provider logic
6. **Include migration guides** from viem, ethers, wagmi
7. **Test all examples** (extract to .test.ts files)

### Content Priorities

**P0 (must have)**:
- quick-start.mdx
- getting-started.mdx (Effect.gen intro, Layer basics, first service usage)
- ChainService/index.mdx
- TransportService/index.mdx
- effect-concepts/layers.mdx
- effect-concepts/error-handling.mdx

**P1 (should have)**:
- All service index.mdx pages
- recipes/read-write-pattern.mdx
- recipes/batch-operations.mdx
- effect-concepts/testing.mdx

**P2 (nice to have)**:
- Service sub-pages (shape, layer, errors, usage)
- migration/from-viem.mdx
- Additional recipes

### Style Guide

**Adopt from Voltaire**:
- Method signature as heading (`### ServiceName.method(param)`)
- Inline examples immediately after description
- Structured metadata (Parameters, Returns, Errors)
- Tabs for variants (Layer vs Raw, Effect.gen vs pipe)
- GitHub source links
- Card grids for navigation
- Accordions for troubleshooting

**Adapt for Effect**:
- Use `Effect.gen` in all primary examples
- Show pipe as alternative in tabs
- Document errors as Effect errors (not thrown exceptions)
- Show Layer composition patterns
- Use TestContext in examples

---

**Generated by**: Pathfinder agent  
**Source**: https://github.com/evmts/voltaire  
**Date**: 2026-02-08
