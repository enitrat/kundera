# HTTP Provider Skill

A minimal HTTP JSON-RPC provider built on Kundera transports + RPC methods.
Copy into your project and customize the method surface for your needs.

## Quick Start

```ts
// Copy this folder into your codebase, then:
import { createHttpProvider } from './skills/http-provider';

const provider = createHttpProvider({
  url: 'https://starknet-mainnet.public.blastapi.io',
  transport: { batch: { batchWait: 10, batchSize: 50 }, timeout: 30000 },
});

const chainId = await provider.chainId();
const block = await provider.blockNumber();
```

## Notes

- All methods are thin wrappers around `kundera/rpc` functions.
- Add/remove methods to match your app's needs.
- `provider.transport` exposes the low-level transport for custom calls.
