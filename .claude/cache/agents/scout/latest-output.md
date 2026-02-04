# Codebase Report: Voltaire Documentation Structure
Generated: 2026-02-04

## Summary

Voltaire uses **Mintlify** as its documentation platform. The documentation is organized as a **monorepo with multiple documentation sites**:
- **Main site**: `https://voltaire.tevm.sh` (voltaire-ts documentation)
- **Effect integration**: `https://voltaire-effect.tevm.sh` (voltaire-effect documentation)
- **Other languages**: C, Go, Python, Rust, Swift, Zig (each has a `docs/` directory)

Each sub-package has its own Mintlify configuration (`docs.json`) and `.mdx` documentation files. The main site links to sub-packages via external URLs (e.g., `voltaire-effect.tevm.sh`).

## Project Structure

```
/Users/msaug/workspace/voltaire/
├── packages/
│   ├── voltaire-ts/           # Main TypeScript library
│   │   └── docs/
│   │       ├── docs.json      # Mintlify config (3272 lines)
│   │       ├── index.mdx      # Homepage
│   │       ├── getting-started.mdx
│   │       ├── concepts/      # Core concepts
│   │       ├── skills/        # Framework integrations
│   │       ├── primitives/    # Primitive types docs
│   │       ├── crypto/        # Cryptography docs
│   │       ├── contract/      # Contract interactions
│   │       ├── evm/           # EVM-related
│   │       └── public/        # Static assets
│   │
│   ├── voltaire-effect/       # Effect.ts integration
│   │   ├── package.json       # Has "docs:dev" and "docs:build" scripts
│   │   └── docs/
│   │       ├── docs.json      # Separate Mintlify config
│   │       ├── index.mdx      # Effect-specific homepage
│   │       ├── getting-started.mdx
│   │       ├── concepts/      # Effect concepts
│   │       ├── services/      # Effect services
│   │       ├── guides/        # Migration guides
│   │       ├── primitives/    # Effect wrappers for primitives
│   │       └── crypto/        # Effect wrappers for crypto
│   │
│   ├── voltaire-c/
│   │   └── docs/
│   │       └── docs.json      # C library docs
│   │
│   ├── voltaire-go/
│   │   └── docs/              # Go library docs
│   │
│   ├── voltaire-py/
│   │   └── docs/              # Python library docs
│   │
│   ├── voltaire-rs/
│   │   └── docs/              # Rust library docs
│   │
│   ├── voltaire-swift/
│   │   └── docs/              # Swift library docs
│   │
│   └── voltaire-zig/
│       └── docs/              # Zig library docs
│
├── apps/
│   └── playground/            # Interactive playground
│       ├── package.json       # Builds to /playground/ path
│       └── vite.config.ts
│
└── .github/workflows/
    └── deploy-playground.yml  # Deploys to Vercel

```

## Documentation Tooling

### Mintlify Configuration

**Tool**: [Mintlify](https://mintlify.com) - Modern documentation platform
**Config file**: `docs.json` (Mintlify's equivalent to VitePress's `.vitepress/config.js`)

**Key packages** (from `pnpm-lock.yaml`):
- `mintlify@4.2.255` - CLI tool
- `@mintlify/cli@4.0.859` - Build and dev server
- `@mintlify/mdx@3.0.4` - MDX processing
- `@mintlify/prebuild@1.0.780` - Pre-build processing

### NPM Scripts

```json
// packages/voltaire-effect/package.json
{
  "scripts": {
    "docs:dev": "cd docs && mintlify dev",
    "docs:build": "cd docs && mintlify build"
  }
}

// packages/voltaire-ts/package.json
{
  "devDependencies": {
    "mintlify": "^4.2.255"
  }
}
```

## Navigation Structure

### voltaire-ts (Main Site) - `https://voltaire.tevm.sh`

**Config**: `/Users/msaug/workspace/voltaire/packages/voltaire-ts/docs/docs.json`

**Top-level navigation**:
```json
{
  "navigation": {
    "anchors": [
      {
        "anchor": "Documentation",
        "icon": "book-open",
        "groups": [
          { "group": "Overview", "pages": ["introduction", "getting-started/branded-types", ...] },
          { "group": "Getting Started", "pages": ["getting-started", "playground", ...] },
          { "group": "Core Concepts", "pages": ["concepts/branded-types", ...] },
          { "group": "Skills", "pages": ["skills/index", ...] },
          { "group": "Primitives", "pages": [...] },
          { "group": "Cryptography", "pages": [...] },
          { "group": "Contract", "pages": [...] },
          { "group": "EVM", "pages": [...] }
        ]
      }
    ],
    "global": {
      "anchors": [
        { "anchor": "GitHub", "href": "https://github.com/evmts/voltaire" },
        { "anchor": "Twitter", "href": "https://twitter.com/tevmtools" }
      ]
    }
  }
}
```

**Theme customization**:
```json
{
  "theme": "mint",
  "colors": {
    "primary": "#10B981",
    "light": "#34D399",
    "dark": "#059669"
  },
  "background": {
    "color": {
      "light": "#FDF2E2",
      "dark": "#0a0a0a"
    }
  }
}
```

### voltaire-effect - `https://voltaire-effect.tevm.sh`

**Config**: `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/docs.json`

**Top-level navigation**:
```json
{
  "name": "voltaire-effect",
  "colors": {
    "primary": "#7C3AED",  // Purple (different from main)
    "light": "#A78BFA",
    "dark": "#5B21B6"
  },
  "navigation": {
    "anchors": [
      {
        "anchor": "Documentation",
        "groups": [
          { "group": "Getting Started", "pages": ["index", "why", "getting-started", ...] },
          { "group": "Concepts", "pages": ["concepts/branded-types", ...] },
          { "group": "Guides", "pages": ["guides/layers", "guides/react-integration", ...] },
          { "group": "Core Services", "pages": ["services/provider", "services/signer", ...] },
          { "group": "Advanced Services", "pages": ["services/contract-registry", ...] }
        ]
      }
    ]
  }
}
```

## How Sub-Packages Link Together

### Cross-linking Pattern

The main site (`voltaire.tevm.sh`) links to sub-package docs via **external URLs**:

**Example** (from `/Users/msaug/workspace/voltaire/packages/voltaire-ts/docs/crypto/keccak256/index.mdx`):

```markdown
- [Keccak256 (Effect)](https://voltaire-effect.tevm.sh/crypto/keccak256) - Effect.ts integration with Schema validation
```

**Pattern found in**:
- `/packages/voltaire-ts/docs/crypto/bn254/index.mdx`
- `/packages/voltaire-ts/docs/crypto/blake2/index.mdx`
- `/packages/voltaire-ts/docs/crypto/keccak256/index.mdx`
- `/packages/voltaire-ts/docs/crypto/keystore/index.mdx`
- `/packages/voltaire-ts/docs/crypto/aesgcm/index.mdx`
- And more...

### Subdomain Strategy

Each major package gets its own subdomain:
- `voltaire.tevm.sh` → voltaire-ts (main)
- `voltaire-effect.tevm.sh` → voltaire-effect
- Likely future: `c.voltaire.tevm.sh`, `go.voltaire.tevm.sh`, etc.

This allows:
1. **Independent deployments** - Each package docs can deploy separately
2. **Separate branding** - Different color schemes (green for main, purple for effect)
3. **Focused navigation** - Each site has its own sidebar/navigation
4. **Cross-linking** - Sites link to each other via external URLs

## Deployment

### Playground Deployment

**Workflow**: `/Users/msaug/workspace/voltaire/.github/workflows/deploy-playground.yml`

```yaml
- name: Build playground
  run: pnpm --filter @tevm/playground run build

- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    working-directory: apps/playground
```

**Build config** (`apps/playground/package.json`):
```json
{
  "scripts": {
    "build:docs": "vite build --base=/playground/"
  }
}
```

The playground is deployed to `https://voltaire.tevm.sh/playground/`.

### Documentation Deployment (Inferred)

Based on Mintlify patterns, likely deployed via:
1. **Mintlify Cloud** - Hosting by Mintlify (most common)
2. **Vercel** - Similar to playground deployment
3. **GitHub Pages** - Alternative hosting

**Evidence**:
- Each `docs.json` has `"$schema": "https://mintlify.com/docs.json"`
- Mintlify typically handles hosting automatically via their cloud

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `packages/voltaire-ts/docs/docs.json` | Main site navigation & config | 3272 |
| `packages/voltaire-effect/docs/docs.json` | Effect site navigation & config | ~100+ |
| `packages/voltaire-c/docs/docs.json` | C library docs config | Unknown |
| `packages/voltaire-ts/docs/index.mdx` | Main site homepage | Unknown |
| `packages/voltaire-effect/docs/index.mdx` | Effect homepage | Unknown |
| `apps/playground/package.json` | Playground build config | 28 |

## Navigation Patterns Discovered

### 1. Hierarchical Groups

Mintlify uses a hierarchical structure with "anchors" and "groups":

```json
{
  "navigation": {
    "anchors": [                    // Top-level sections
      {
        "anchor": "Documentation",  // Section title
        "icon": "book-open",
        "groups": [                 // Subsections
          {
            "group": "Getting Started",
            "icon": "rocket",
            "pages": ["getting-started", "playground"]
          }
        ]
      }
    ]
  }
}
```

### 2. Nested Page Groups

Skills section shows nested groups:

```json
{
  "group": "Skills",
  "pages": [
    "skills/index",
    {
      "group": "Provider Skills",
      "pages": ["skills/ethers-provider", "skills/viem-publicclient"]
    },
    {
      "group": "Contract Skills",
      "pages": ["skills/ethers-contract", "skills/viem-contract"]
    }
  ]
}
```

### 3. External Links in Navigation

Global anchors for external sites:

```json
{
  "navigation": {
    "global": {
      "anchors": [
        { "anchor": "GitHub", "href": "https://github.com/evmts/voltaire", "icon": "github" },
        { "anchor": "Twitter", "href": "https://twitter.com/tevmtools", "icon": "twitter" }
      ]
    }
  }
}
```

### 4. Navbar Configuration

```json
{
  "navbar": {
    "links": [
      { "label": "GitHub", "href": "https://github.com/evmts/voltaire" }
    ],
    "primary": {
      "type": "button",
      "label": "Get Started",
      "href": "https://voltaire.tevm.sh/getting-started"
    }
  }
}
```

## Content Organization

### MDX File Structure

**Frontmatter** (YAML):
```yaml
---
title: voltaire-effect
description: Effect.ts integration for Voltaire Ethereum primitives
---
```

**Content components**:
- `<Tabs>` / `<Tab>` - Code comparison tabs
- `<Warning>` - Warning callouts
- `<Info>` - Info callouts
- Custom styling via inline `<style>` tags

**Example** (`packages/voltaire-effect/docs/index.mdx`):
```mdx
---
title: voltaire-effect
description: Effect.ts integration for Voltaire Ethereum primitives
---

[Effect.ts](https://effect.website) integration for [Voltaire](https://voltaire.tevm.sh)

<Tabs>
  <Tab title="voltaire-effect">
    ```typescript
    // Code example
    ```
  </Tab>
  <Tab title="viem">
    ```typescript
    // Comparison
    ```
  </Tab>
</Tabs>
```

### Directory Naming

**Convention**: kebab-case for directories and files
- `getting-started/`
- `crypto/keccak256/`
- `primitives/address/`

**File types**:
- `.mdx` - Documentation pages (MDX = Markdown + JSX)
- `.json` - Configuration
- `index.mdx` - Directory index/overview

## How to Access voltaire-effect Docs from Main Site

### Current Implementation

**Direct URL links** in content:

From `packages/voltaire-ts/docs/crypto/keccak256/index.mdx`:
```markdown
- [Keccak256 (Effect)](https://voltaire-effect.tevm.sh/crypto/keccak256)
```

### Where Users Access It

1. **Via crypto module pages** - Each crypto module has a link to its Effect version
2. **Via skills page** - `skills/effect-ts.mdx` mentions voltaire-effect (but as unimplemented)
3. **Direct navigation** - Users go to `voltaire-effect.tevm.sh` directly

### Navigation Flow

```
User on voltaire.tevm.sh
  ↓
Reads Keccak256 docs
  ↓
Sees "Keccak256 (Effect)" link
  ↓
Clicks → redirects to voltaire-effect.tevm.sh/crypto/keccak256
  ↓
Browsing voltaire-effect site (separate nav, separate branding)
```

## Monorepo Documentation Patterns

### 1. Separate Sites (Voltaire's Approach)

**Pros**:
- ✅ Independent deployments
- ✅ Different branding per package
- ✅ Focused navigation
- ✅ Easier to maintain separate concerns

**Cons**:
- ❌ Users must navigate between sites
- ❌ No unified search across all packages
- ❌ Separate build/deploy pipelines

### 2. Mintlify-Specific Features

**Subdomain strategy**:
- Each package gets `<package>.voltaire.tevm.sh`
- Likely configured via Mintlify cloud settings (not in repo)

**Shared config**:
- Each `docs.json` is independent
- No shared navigation or theming between packages

## Open Questions

1. **How are subdomains configured?**
   - Not visible in repo → likely Mintlify cloud dashboard or DNS configuration

2. **How does search work?**
   - Mintlify provides built-in search
   - Unknown if search spans multiple subdomains

3. **Deployment trigger?**
   - No GitHub Actions workflow found for docs deployment
   - Likely uses Mintlify's GitHub integration (auto-deploy on push)

4. **Other language docs?**
   - Found `docs.json` for C, Swift
   - Unknown if they're deployed yet (no subdomain references found)

## Recommendations for Applying to Kundera

Based on Voltaire's structure:

### If Using Mintlify for Kundera

1. **Main site**: `kundera.tevm.sh` or similar
   - kundera-ts documentation

2. **Effect integration**: `kundera-effect.tevm.sh`
   - kundera-effect documentation

3. **Shared patterns**:
   - Use `docs.json` for navigation config
   - Use `.mdx` for documentation pages
   - Cross-link via external URLs
   - Separate color schemes per package

### Directory structure to create

```
packages/kundera-ts/docs/
├── docs.json              # Mintlify config
├── index.mdx              # Homepage
├── getting-started.mdx
├── concepts/
├── skills/
└── primitives/

packages/kundera-effect/docs/
├── docs.json              # Separate config
├── index.mdx
├── getting-started.mdx
├── services/
└── guides/
```

### Key migration tasks

1. Create `docs.json` for each package (based on Voltaire's structure)
2. Convert/create `.mdx` files for documentation
3. Set up Mintlify project (or choose alternative like VitePress)
4. Configure subdomains (`kundera.tevm.sh`, `kundera-effect.tevm.sh`)
5. Add cross-links between packages in content

## Related Files & Directories

**Main documentation**:
- `/Users/msaug/workspace/voltaire/packages/voltaire-ts/docs/`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/`

**Configuration**:
- `/Users/msaug/workspace/voltaire/packages/voltaire-ts/docs/docs.json`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/docs.json`

**Deployment**:
- `/Users/msaug/workspace/voltaire/.github/workflows/deploy-playground.yml`

**Package configs**:
- `/Users/msaug/workspace/voltaire/packages/voltaire-ts/package.json`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/package.json`
