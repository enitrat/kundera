# kdex - Starknet CLI using Kundera Effect

A `cast`-like CLI for Starknet, built with [kundera-effect](../../packages/kundera-effect) to demonstrate how to integrate Kundera in a real project.

## Installation

```bash
# From the monorepo root
pnpm install

# Run the CLI
cd examples/kdex
pnpm dev --help
```

## Usage

```bash
# Get current block number
pnpm dev block-number

# Get chain ID
pnpm dev chain-id

# Get block hash and number
pnpm dev block-hash

# Get block information
pnpm dev block [block-id]
pnpm dev block --full  # Include full transaction details

# Get STRK balance
pnpm dev balance <address>
pnpm dev balance <address> --token ETH

# Get account nonce
pnpm dev nonce <address>

# Get class hash at address
pnpm dev class-hash <address>

# Get storage value
pnpm dev storage <address> <key>

# Get transaction details
pnpm dev tx <hash>
pnpm dev tx-status <hash>
pnpm dev tx-receipt <hash>
```

## Network Selection

By default, commands use mainnet. Use `--network` to switch:

```bash
pnpm dev block-number --network sepolia
```

Or set the `STARKNET_RPC_URL` environment variable:

```bash
STARKNET_RPC_URL=https://your-rpc.com pnpm dev block-number
```

## Examples

```bash
# Check ETH balance of the ETH contract itself
$ pnpm dev balance 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7 --token ETH
15.392488 ETH

# Get current block
$ pnpm dev block-number
6407527

# Get class hash of ETH contract
$ pnpm dev class-hash 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
0x7f3777c99f3700505ea966676aac4a0d692c2a9f5e667f4c606b51ca1dd3420
```

## Project Structure

```
examples/kdex/
├── src/
│   ├── index.ts          # CLI entry point (commander)
│   ├── config.ts         # RPC configuration
│   └── commands/         # Individual commands
│       ├── balance.ts
│       ├── block.ts
│       ├── blockNumber.ts
│       ├── chainId.ts
│       ├── classHash.ts
│       ├── nonce.ts
│       ├── storage.ts
│       └── tx.ts
├── package.json
├── tsconfig.json
├── README.md
└── FEEDBACK.md           # Developer feedback on kundera-effect
```

## Key Patterns Used

### Creating a transport

```typescript
import { httpTransport } from "@kundera-sn/kundera-effect/transport";

const transport = httpTransport("https://api.zan.top/public/starknet-mainnet");
```

### Making RPC calls with Effect

```typescript
import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";

const program = Effect.gen(function* () {
  const blockNumber = yield* Rpc.starknet_blockNumber(transport);
  return blockNumber;
});

const result = await Effect.runPromise(program);
```

### Using branded primitives

```typescript
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";

const program = Effect.gen(function* () {
  // Validates and creates a typed address
  const address = yield* ContractAddress.from("0x049d...");
  return address.toHex();
});
```

### Error handling

```typescript
const program = Effect.gen(function* () {
  // ... operations
}).pipe(
  Effect.catchTag("PrimitiveError", (e) => {
    console.error(`Invalid input: ${e.message}`);
    return Effect.succeed(fallbackValue);
  }),
  Effect.catchTag("RpcError", (e) => {
    console.error(`RPC error: ${e.message}`);
    return Effect.succeed(fallbackValue);
  })
);
```

## Feedback

See [FEEDBACK.md](./FEEDBACK.md) for detailed developer feedback on using kundera-effect, including bugs found and suggestions for improvement.
