# Contract Multicall Skill

Batch multiple read-only calls using `transport.requestBatch`.

## Quick Start

```ts
import { httpTransport } from 'kundera/transport';
import { multicallRead } from './skills/contract-multicall';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');

const results = await multicallRead(transport, [
  { abi: ERC20_ABI, address: token1, functionName: 'balance_of', args: [account] },
  { abi: ERC20_ABI, address: token2, functionName: 'balance_of', args: [account] },
]);

for (const { result, error } of results) {
  if (!error) console.log(result[0]);
}
```
