# Wallet Modal Skill

Minimal adapter for wallet modal integrations (StarknetKit / get-starknet) with Kundera.

## Features

- Dynamic imports to avoid bundling wallet SDKs
- Peer dependencies only (no hard deps)
- Returns Kundera-compatible `Account` and `StarknetRpcClient`
- Follows `{ result, error }` pattern

## Installation

```bash
# Copy the skill to your project
cp -r examples/skills/wallet-modal src/skills/

# Install your preferred modal provider (peer dependency)
npm install @starknet-io/starknet-kit
# or
npm install get-starknet
```

## Usage

```typescript
import { connectWalletWithModal } from './skills/wallet-modal';
import { getContract } from 'kundera/contract';

// Connect with modal
const { result, error } = await connectWalletWithModal();

if (error) {
  console.error('Connection failed:', error.message);
  return;
}

const { account, client, address } = result;

// Use with Kundera APIs
const contract = getContract({
  abi: ERC20_ABI,
  address: tokenAddress,
  client,
  account,
});

const { result: balance } = await contract.read('balance_of', [address]);
```

## API

### `connectWalletWithModal(options?)`

Connect to a wallet using a modal UI.

**Options:**
- `modalProvider`: `'starknetkit'` | `'get-starknet'` (default: `'starknetkit'`)
- `walletIds`: Filter to specific wallets (e.g., `['argentX', 'braavos']`)
- `rpcUrl`: Custom RPC endpoint
- `chainId`: `'SN_MAIN'` | `'SN_SEPOLIA'` (default: `'SN_MAIN'`)

**Returns:** `{ result: WalletModalConnection | null, error: WalletModalError | null }`

### `disconnectWalletModal(modalProvider?)`

Disconnect from the current wallet.

## Error Codes

| Code | Description |
|------|-------------|
| `MODAL_NOT_AVAILABLE` | Modal provider not installed |
| `USER_REJECTED` | User rejected the connection |
| `NO_WALLET_FOUND` | No wallet detected |
| `CONNECTION_FAILED` | Generic connection error |
| `UNSUPPORTED_PROVIDER` | Unknown modal provider |

## Notes

- This skill uses **peer dependencies** - you must install the modal provider separately
- Works only in browser environments (requires `window`)
- The returned `account` is ready for signing transactions

## License

MIT
