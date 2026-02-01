# Contract Write Skill

State-changing contract calls using an account executor. Pair this with the
`account-invoke` skill (or your own account abstraction).

## Quick Start

```ts
import { createAccountInvoker } from './skills/account-invoke';
import { writeContract } from './skills/contract-write';

const account = createAccountInvoker({ transport, address, signer });

const { result, error } = await writeContract({
  abi: ERC20_ABI,
  address: tokenAddress,
  functionName: 'transfer',
  args: [recipient, amount],
  account,
});

if (!error) {
  console.log('TX:', result.transactionHash);
}
```
