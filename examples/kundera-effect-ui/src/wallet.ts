import type { StarknetWindowObject } from '@kundera-sn/kundera-ts/provider';

export interface WalletConnection {
  readonly swo: StarknetWindowObject;
  readonly address: string;
  readonly walletId: string;
}

export async function connectWallet(): Promise<WalletConnection | null> {
  const kit = await import('starknetkit').catch(() => null);
  if (!kit) return null;

  const connection = await kit.connect({ modalMode: 'alwaysAsk' });
  if (!connection?.wallet) return null;

  const swo = connection.wallet as StarknetWindowObject;
  const accounts = (await swo.request({ type: 'wallet_requestAccounts' })) as string[];
  const address = accounts[0];
  if (!address) return null;

  return { swo, address, walletId: swo.id ?? 'unknown' };
}

export async function disconnectWallet(): Promise<void> {
  const kit = await import('starknetkit').catch(() => null);
  if (kit?.disconnect) await kit.disconnect();
}
