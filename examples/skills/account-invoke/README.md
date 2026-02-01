# Account Invoke Skill

Execute invoke transactions with a signer. Copy into your project.

## Quick Start

```ts
import { httpTransport } from 'kundera/transport';
import { PrivateKeySigner } from 'kundera/crypto';
import { createAccountInvoker } from './skills/account-invoke';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');
const signer = new PrivateKeySigner(PRIVATE_KEY);

const account = createAccountInvoker({
  transport,
  address: ACCOUNT_ADDRESS,
  signer,
});

const { transaction_hash } = await account.execute({
  contractAddress: CONTRACT_ADDRESS,
  entrypoint: 'transfer',
  calldata: [RECIPIENT, AMOUNT],
});
```
