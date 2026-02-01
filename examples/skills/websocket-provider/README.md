# WebSocket Provider Skill

Real-time subscriptions using Kundera's WebSocket transport + RPC methods.
Copy into your project and customize callbacks / reconnection behavior.

## Quick Start

```ts
import { createWebSocketProvider } from './skills/websocket-provider';

const ws = createWebSocketProvider({
  url: 'wss://starknet-mainnet.public.blastapi.io',
  transport: { reconnect: true },
});

await ws.connect();

const unsubscribe = await ws.subscribeNewHeads(undefined, (head) => {
  console.log('New head:', head.block_number);
});

// later
await unsubscribe();
ws.close();
```
