# Account Declare Skill

Declare contract classes with a signer.

## Quick Start

```ts
import { httpTransport } from 'kundera-sn/transport';
import { signRaw, signatureToArray } from 'kundera-sn/crypto';
import { createAccountDeclarer } from './skills/account-declare';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');
const signTransaction = (hash) => signatureToArray(signRaw(PRIVATE_KEY, hash));

const declarer = createAccountDeclarer({
  transport,
  address: ACCOUNT_ADDRESS,
  signTransaction,
});

const { transaction_hash, class_hash } = await declarer.declare({
  contract: SIERRA_CLASS,
  classHash: SIERRA_CLASS_HASH,
  compiledClassHash: CASM_CLASS_HASH,
});
```
