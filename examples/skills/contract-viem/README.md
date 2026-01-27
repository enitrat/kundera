# Viem-Style Contract Skill

Tree-shakeable contract interaction functions inspired by viem's API design.

## Features

- Viem-like API surface (`readContract`, `writeContract`, etc.)
- Tree-shakeable imports
- Follows `{ result, error }` pattern
- Works with any Starknet contract ABI

## Installation

```bash
# Copy the skill to your project
cp -r examples/skills/contract-viem src/skills/
```

No additional dependencies required - uses only Kundera core APIs.

## Usage

```typescript
import { readContract, writeContract, watchContractEvent } from './skills/contract-viem';
import { createClient } from 'kundera/rpc';
import { createAccount, createSigner } from 'kundera/account';

const client = createClient({ url: 'https://starknet-mainnet.public.blastapi.io' });

// Read
const { result } = await readContract(client, {
  abi: ERC20_ABI,
  address: tokenAddress,
  functionName: 'balance_of',
  args: [accountAddress],
});

// Write
const signer = createSigner(privateKey);
const account = createAccount(client, address, signer);

const { result: tx } = await writeContract(client, {
  abi: ERC20_ABI,
  address: tokenAddress,
  functionName: 'transfer',
  args: [recipient, amount],
  account,
});

// Watch events
const unwatch = watchContractEvent(client, {
  abi: ERC20_ABI,
  address: tokenAddress,
  eventName: 'Transfer',
  onEvent: (event) => console.log('Transfer:', event.args),
});
```

## API

### `readContract(client, params)`

Read from a contract (view function).

### `writeContract(client, params)`

Execute a state-changing function. Requires `account` in params.

### `simulateContract(client, params)`

Simulate a transaction without executing.

### `estimateContractFee(client, params)`

Get fee estimate for a transaction.

### `watchContractEvent(client, params)`

Watch for contract events (polling-based). Returns unsubscribe function.

### `multicallRead(client, calls)`

Read from multiple contracts in parallel.

## Error Codes

| Code | Description |
|------|-------------|
| `FUNCTION_NOT_FOUND` | Function name not in ABI |
| `ENCODE_ERROR` | Failed to encode calldata |
| `DECODE_ERROR` | Failed to decode response |
| `ACCOUNT_REQUIRED` | Write operation needs an account |
| `EXECUTION_REVERTED` | Contract execution failed |
| `NETWORK_ERROR` | RPC connection error |

## License

MIT
