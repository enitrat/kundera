# Wallet Modal Skill

Minimal adapter for StarknetKit/get-starknet modal integrations.
Returns a wallet provider + transport that you can wire into your own skills.

## Usage

```ts
import { connectWalletWithModal } from './skills/wallet-modal';

const { result, error } = await connectWalletWithModal({
  modalProvider: 'starknetkit',
  chainId: 'SN_MAIN',
});

if (result) {
  const { walletProvider, transport, address } = result;
  console.log('Connected:', address);
}
```

## Notes

- This skill does not create an account abstraction. Pair it with your own
  account skill (e.g. `account-invoke`) or wallet-specific flow.
- Requires peer dependencies: `@starknet-io/starknet-kit` or `get-starknet`.
