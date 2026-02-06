# kundera-ts-cli — Starknet CLI using kundera-ts

A `cast`-like CLI for Starknet, built with [kundera-ts](../../packages/kundera-ts) (pure TypeScript, no Effect).

Built **entirely from documentation** — no source code was read. See [FEEDBACK.md](./FEEDBACK.md) for documentation friction points.

## Installation

```bash
# From the monorepo root
pnpm install

# Run the CLI
cd examples/kundera-ts-cli
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
pnpm dev block --full          # Include full transaction details
pnpm dev block 6509100         # By number
pnpm dev block 0xabc...        # By hash

# Get token balance
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
# Check ETH balance
$ pnpm dev balance 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7 --token ETH
15.392488 ETH

# Get current block
$ pnpm dev block-number
6509136

# Get chain ID (decoded)
$ pnpm dev chain-id
SN_MAIN (0x534e5f4d41494e)

# Get class hash
$ pnpm dev class-hash 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
0x7f3777c99f3700505ea966676aac4a0d692c2a9f5e667f4c606b51ca1dd3420

# Transaction status
$ pnpm dev tx-status 0x76ab7548375c2d8862dd319f9cba2920a50eccd785a1f8f83e830179606d61e
{ "execution_status": "SUCCEEDED", "finality_status": "ACCEPTED_ON_L2" }
```

## Project Structure

```
examples/kundera-ts-cli/
├── src/
│   ├── index.ts          # CLI entry point (commander)
│   ├── config.ts         # RPC configuration + token addresses
│   └── commands/
│       ├── balance.ts    # ERC-20 balance via starknet_call
│       ├── block.ts      # Block info (with/without txs)
│       ├── blockHash.ts  # Block hash and number
│       ├── blockNumber.ts
│       ├── chainId.ts    # Chain ID with short string decoding
│       ├── classHash.ts
│       ├── nonce.ts
│       ├── storage.ts
│       └── tx.ts         # tx, tx-status, tx-receipt
├── package.json
├── tsconfig.json
├── README.md
└── FEEDBACK.md           # Documentation friction report
```

## Key Patterns

### Provider + Rpc builders

```typescript
import { HttpProvider } from '@kundera-sn/kundera-ts/provider';
import { Rpc } from '@kundera-sn/kundera-ts/jsonrpc';

const provider = new HttpProvider({ url: 'https://api.zan.top/public/starknet-mainnet' });
const blockNum = await provider.request(Rpc.BlockNumberRequest());
```

### Contract calls with selector computation

```typescript
import { computeSelectorHex } from '@kundera-sn/kundera-ts/abi';

const result = await provider.request(
  Rpc.CallRequest(
    {
      contract_address: tokenAddress,
      entry_point_selector: computeSelectorHex('balanceOf'),
      calldata: [accountAddress],
    },
    'latest',
  ),
) as string[];
```

### Short string decoding (chain ID)

```typescript
import { decodeShortString } from '@kundera-sn/kundera-ts';

const chainId = await provider.request(Rpc.ChainIdRequest()) as string;
const readable = decodeShortString(chainId); // "SN_MAIN"
```

## Comparison with kdex

| | kundera-ts-cli | kdex |
|---|---|---|
| Library | kundera-ts (pure TS) | kundera-effect (Effect-TS) |
| Error handling | try/catch | Effect.catchTag |
| Provider | HttpProvider + Rpc builders | Effect services + transport |
| Async | async/await | Effect.gen + yield* |
| Complexity | Minimal | Effect ecosystem |
