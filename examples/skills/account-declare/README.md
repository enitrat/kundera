# Account Declare Skill

Declare contract classes with a signer.

## Quick Start

```ts
import { httpTransport } from 'kundera/transport';
import { PrivateKeySigner } from 'kundera/crypto';
import { createAccountDeclarer } from './skills/account-declare';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');
const signer = new PrivateKeySigner(PRIVATE_KEY);

const declarer = createAccountDeclarer({
  transport,
  address: ACCOUNT_ADDRESS,
  signer,
});

const { transaction_hash, class_hash } = await declarer.declare({
  contract: SIERRA_CLASS,
  classHash: SIERRA_CLASS_HASH,
  compiledClassHash: CASM_CLASS_HASH,
});
```
