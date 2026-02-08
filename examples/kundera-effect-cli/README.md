# kundera-effect-cli - Starknet CLI using kundera-effect

A `cast`-like Starknet CLI built with [@kundera-sn/kundera-effect](../../packages/kundera-effect), using Effect services and layers.

Built from `docs/effect/` first, then validated by running the CLI.

## Installation

```bash
# From monorepo root
pnpm install

# Run the CLI
cd examples/kundera-effect-cli
pnpm dev --help
```

## Usage

```bash
# Network state
pnpm dev block-number
pnpm dev chain-id
pnpm dev block-hash
pnpm dev block [block-id]
pnpm dev block --full

# Contract/account reads
pnpm dev balance <address>
pnpm dev balance <address> --token ETH
pnpm dev nonce <address>
pnpm dev class-hash <address>
pnpm dev storage <address> <key>

# Transactions
pnpm dev tx <hash>
pnpm dev tx-status <hash>
pnpm dev tx-receipt <hash>
```

## Network selection

Default network is `mainnet`.

```bash
pnpm dev block-number --network sepolia
```

Or set a custom RPC URL:

```bash
STARKNET_RPC_URL=https://your-rpc.example.com pnpm dev block-number
```

## Notes

- `balance` uses `ContractRegistryService` + `ContractLayer`, aligned with the docs recommendation.
- Read commands use typed `JsonRpc.*` helpers instead of raw endpoint strings.
- User inputs are parsed with official schema-backed helpers from `Primitives.decode*` before RPC calls.
- Error handling is done at the CLI boundary (`runCommand`) to keep command Effects composable.

See `feedback.md` for detailed library/documentation feedback.
