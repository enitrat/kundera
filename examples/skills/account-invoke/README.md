# Account Invoke Skill

Execute invoke transactions with a signer. Copy into your project.

## Quick Start

```ts
import { httpTransport } from '@kundera-sn/kundera-ts/transport';
import { signRaw, signatureToArray } from '@kundera-sn/kundera-ts/crypto';
import { createAccountInvoker } from './skills/account-invoke';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');
const signTransaction = (hash) => signatureToArray(signRaw(PRIVATE_KEY, hash));

const account = createAccountInvoker({
  transport,
  address: ACCOUNT_ADDRESS,
  signTransaction,
});

const { transaction_hash } = await account.execute({
  contractAddress: CONTRACT_ADDRESS,
  entrypoint: 'transfer',
  calldata: [RECIPIENT, AMOUNT],
});
```
