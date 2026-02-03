# Account Deploy Skill

Deploy account contracts with a signer.

## Quick Start

```ts
import { httpTransport } from '@kundera-sn/kundera-ts/transport';
import { signRaw, signatureToArray } from '@kundera-sn/kundera-ts/crypto';
import { createAccountDeployer } from './skills/account-deploy';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');
const signTransaction = (hash) => signatureToArray(signRaw(PRIVATE_KEY, hash));

const deployer = createAccountDeployer({ transport, signTransaction });

const result = await deployer.deployAccount({
  classHash: ACCOUNT_CLASS_HASH,
  constructorCalldata: [PUBLIC_KEY],
});

console.log(result.transaction_hash, result.contract_address);
```
