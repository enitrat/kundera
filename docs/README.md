# Kundera Documentation

This is the unified documentation site for the Kundera monorepo, built with [Mintlify](https://mintlify.com).

## Structure

```
docs/
├── docs.json                  # Mintlify configuration
├── index.mdx                  # Landing page (Effect-first)
│
├── getting-started/           # Onboarding guides
│   ├── quickstart.mdx         # Effect quickstart (primary)
│   ├── effect-intro.mdx
│   ├── installation.mdx
│   ├── typescript-quickstart.mdx
│   └── typescript-to-effect.mdx
│
├── effect/                    # Effect-TS integration (primary)
│   ├── overview.mdx
│   ├── services/              # Effect services
│   ├── primitives/            # Effect primitives
│   ├── modules/               # ABI, crypto, jsonrpc, etc.
│   └── guides/                # Effect-specific guides
│
├── typescript/                # Vanilla TypeScript (secondary)
│   ├── overview.mdx
│   ├── primitives/
│   ├── skills/
│   ├── concepts/
│   └── api/
│
├── shared/                    # Shared concepts
│   ├── branded-types.mdx
│   ├── architecture.mdx
│   ├── runtime-implementations.mdx
│   ├── security.mdx
│   └── event-filtering.mdx
│
└── guides/                    # Cross-cutting guides
    ├── migration-from-starknetjs.mdx
    ├── typescript-to-effect.mdx
    ├── comparisons.mdx
    └── agentic-coding.mdx
```

## Development

### Prerequisites

Install Mintlify CLI:

```bash
pnpm install
```

### Local Development

Start the development server:

```bash
pnpm docs:dev
```

The docs will be available at `http://localhost:3000`.

### Build

Build the documentation:

```bash
pnpm docs:build
```

## Documentation Philosophy

### Effect-First

The documentation prioritizes the Effect-TS integration as the recommended approach:

1. **Landing page** highlights Effect with prominent "Quick Start" cards
2. **Navigation** places "Effect (Recommended)" before "TypeScript"
3. **Getting Started** defaults to Effect quickstart
4. **Examples** showcase Effect patterns first

### Unified Structure

Instead of separate docs per package (like Voltaire), we use a single unified site:

- **Pros**: Single search, unified navigation, easier cross-referencing
- **Cons**: Larger navigation tree, more complex organization

### Content Organization

- **effect/** - Effect-specific content (services, layers, error handling)
- **typescript/** - Vanilla TS content (skills, class-based APIs)
- **shared/** - Concepts applicable to both (branded types, architecture)
- **guides/** - Cross-cutting guides (migration, comparisons)

## Navigation

The navigation is defined in `docs.json` with the following structure:

1. **Overview** - What is Kundera, why use it
2. **Getting Started** - Quickstart guides (Effect-first)
3. **Effect (Recommended)** - Services, primitives, modules, guides
4. **TypeScript** - Primitives, skills, API reference
5. **Shared Concepts** - Branded types, architecture, security
6. **Guides** - Migration, comparisons, agentic coding

## Deployment

The documentation can be deployed via:

1. **Mintlify Cloud** (recommended) - Auto-deploy from GitHub
2. **Vercel** - Custom deployment
3. **GitHub Pages** - Static site deployment

For Mintlify Cloud, connect your GitHub repository at [mintlify.com](https://mintlify.com).

## Contributing

When adding new documentation:

1. **Choose the right section**:
   - Effect-specific → `effect/`
   - TypeScript-specific → `typescript/`
   - Applicable to both → `shared/`
   - Migration/comparison → `guides/`

2. **Update `docs.json`** - Add the page to the navigation

3. **Use MDX components** - Mintlify supports `<Card>`, `<Tabs>`, `<Accordion>`, etc.

4. **Link appropriately**:
   - Internal links: `/path/to/page` (no .mdx extension)
   - External links: Full URL

5. **Test locally** - Run `pnpm docs:dev` before committing

## Migration from Package Docs

This unified docs site consolidates content from:

- `packages/kundera-effect/docs/` → `docs/effect/`
- `packages/kundera-ts/docs/` → `docs/typescript/` + `docs/shared/`

The original package-level docs can be archived or removed after verifying all content has been migrated.
