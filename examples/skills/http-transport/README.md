# HTTP Transport Skill

Advanced HTTP JSON-RPC transport with batching, retries, and timeouts.

## Quick Start

```bash
cp -r examples/skills/http-transport src/skills/
```

## Usage

```ts
import { httpTransport } from './skills/http-transport';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io', {
  batch: { batchWait: 10, batchSize: 50 },
  retries: 3,
  timeout: 30000,
});

const response = await transport.request({
  jsonrpc: '2.0',
  method: 'starknet_blockNumber',
  params: [],
});
```

## Notes

- `batch` enables auto-batching for concurrent requests.
- `retries` uses exponential backoff (`retryDelay * 2^attempt`).
