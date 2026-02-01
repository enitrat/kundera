# Account Deploy Skill

Deploy account contracts with a signer.

## Quick Start

```ts
import { httpTransport } from 'kundera/transport';
import { PrivateKeySigner } from 'kundera/crypto';
import { createAccountDeployer } from './skills/account-deploy';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');
const signer = new PrivateKeySigner(PRIVATE_KEY);

const deployer = createAccountDeployer({ transport, signer });

const result = await deployer.deployAccount({
  classHash: ACCOUNT_CLASS_HASH,
  constructorCalldata: [PUBLIC_KEY],
});

console.log(result.transaction_hash, result.contract_address);
```
