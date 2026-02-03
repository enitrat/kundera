# Viem-Style Contract Skill

Tree-shakeable contract interaction functions inspired by viem's API design.

## Features

- Viem-like API surface (`readContract`, `writeContract`, etc.)
- Tree-shakeable imports
- `{ result, error }` return pattern
- Works with any Starknet contract ABI

## Installation

```bash
# Copy the skill to your project
cp -r examples/skills/contract-viem src/skills/
```

No additional dependencies required - uses only Kundera core APIs.

## Usage

```ts
import { httpTransport } from 'kundera-sn/transport';
import { signRaw, signatureToArray } from 'kundera-sn/crypto';
import { createAccountInvoker } from './skills/account-invoke';
import { readContract, writeContract, watchContractEvent } from './skills/contract-viem';

const transport = httpTransport('https://starknet-mainnet.public.blastapi.io');

// Read
const { result } = await readContract(transport, {
  abi: ERC20_ABI,
  address: tokenAddress,
  functionName: 'balance_of',
  args: [accountAddress],
});

// Write
const signTransaction = (hash) => signatureToArray(signRaw(privateKey, hash));
const account = createAccountInvoker({ transport, address, signTransaction });

const { result: tx } = await writeContract(transport, {
  abi: ERC20_ABI,
  address: tokenAddress,
  functionName: 'transfer',
  args: [recipient, amount],
  account,
});

// Watch events
const unwatch = watchContractEvent(transport, {
  abi: ERC20_ABI,
  address: tokenAddress,
  eventName: 'Transfer',
  onEvent: (event) => console.log('Transfer:', event.args),
});
```

## API

### `readContract(transport, params)`

Read from a contract (view function).

### `writeContract(transport, params)`

Execute a state-changing function. Requires `account` in params.

### `simulateContract(transport, params)`

Simulate a transaction without executing.

### `estimateContractFee(transport, params)`

Get fee estimate for a transaction.

### `watchContractEvent(transport, params)`

Watch for contract events (polling-based). Returns unsubscribe function.

### `multicallRead(transport, calls)`

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
