# Contract Read Skill

Read-only contract calls with ABI encoding/decoding. Copy into your project.

## Quick Start

```ts
import { httpTransport } from '@kundera-sn/kundera-ts/transport';
import { readContract } from './skills/contract-read';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');

const { result, error } = await readContract(transport, {
  abi: ERC20_ABI,
  address: tokenAddress,
  functionName: 'balance_of',
  args: [accountAddress],
});

if (!error) {
  console.log('Balance:', result[0]);
}
```
