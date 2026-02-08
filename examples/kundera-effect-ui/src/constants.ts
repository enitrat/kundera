// Public RPC endpoints (no auth required)
export const RPC_URLS = {
  MAINNET: 'https://api.zan.top/public/starknet-mainnet',
  SEPOLIA: 'https://api.zan.top/public/starknet-sepolia',
} as const;

export const DEFAULT_RPC_URL =
  import.meta.env.VITE_STARKNET_RPC_URL ?? RPC_URLS.SEPOLIA;

export function getRpcUrl(chainId: string): string {
  if (chainId.includes('MAINNET') || chainId === '0x534e5f4d41494e') {
    return RPC_URLS.MAINNET;
  }
  return RPC_URLS.SEPOLIA;
}

export const ETH_TOKEN_ADDRESS =
  '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

export const ERC20_ABI = [
  {
    type: 'function' as const,
    name: 'balance_of',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'view' as const,
  },
  {
    type: 'function' as const,
    name: 'transfer',
    inputs: [
      { name: 'recipient', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount', type: 'core::integer::u256' },
    ],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'external' as const,
  },
] as const;

export function chainIdToString(chainIdHex: string): string {
  if (chainIdHex.includes('MAINNET') || chainIdHex === '0x534e5f4d41494e') {
    return 'SN_MAINNET';
  }
  return 'SN_SEPOLIA';
}

export function createHelloTypedData(chainIdHex: string) {
  return {
    types: {
      StarkNetDomain: [
        { name: 'name', type: 'felt' },
        { name: 'version', type: 'felt' },
        { name: 'chainId', type: 'felt' },
      ],
      Message: [{ name: 'content', type: 'felt' }],
    },
    primaryType: 'Message',
    domain: {
      name: 'KunderaEffect',
      version: '1',
      chainId: chainIdToString(chainIdHex),
    },
    message: {
      content: '0x48656c6c6f',
    },
  };
}
