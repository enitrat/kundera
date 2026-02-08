import { Atom } from '@effect-atom/atom';
import { Effect, Either, Layer } from 'effect';
import { JsonRpc, Presets, Services } from '@kundera-sn/kundera-effect';
import { ContractAddress, Uint256 } from '@kundera-sn/kundera-ts';
import type { StarknetWindowObject, WalletTypedData } from '@kundera-sn/kundera-ts/provider';
import { DEFAULT_RPC_URL, ERC20_ABI, ETH_TOKEN_ADDRESS } from './constants';

// ── Layer composition (module-level) ────────────────────────────────────────

const providerLayer = Presets.createProvider(DEFAULT_RPC_URL);

const readLayer = Layer.mergeAll(
  providerLayer,
  Services.ContractLive.pipe(Layer.provide(providerLayer)),
);

// ── Provider runtime (read-only chain data) ─────────────────────────────────

export const provider = Atom.runtime(readLayer);

// ── Writable state ──────────────────────────────────────────────────────────

export const swoAtom = Atom.make<StarknetWindowObject | null>(null);
export const addressAtom = Atom.make<string | null>(null);

// ── Read atoms (reactive, from provider) ────────────────────────────────────

export const blockNumberAtom = provider.atom(JsonRpc.blockNumber()).pipe(
  Atom.refreshOnWindowFocus,
);
export const chainIdAtom = provider.atom(JsonRpc.chainId()).pipe(
  Atom.keepAlive,
);

// ── Balance (parameterized by address) ──────────────────────────────────────

export const balanceOf = Atom.family((address: string) =>
  provider.atom(
    Services.readContract({
      contractAddress: ContractAddress(ETH_TOKEN_ADDRESS),
      abi: ERC20_ABI,
      functionName: 'balance_of',
      args: [ContractAddress(address)],
    }).pipe(Effect.map(Uint256.toBigInt)),
  ),
);

// ── Wallet operations (imperative, requires SWO) ────────────────────────────

export async function runWithWallet<A, R>(
  swo: StarknetWindowObject,
  program: Effect.Effect<A, unknown, R>,
): Promise<Either.Either<A, unknown>> {
  const layer = Presets.SepoliaWalletStack({ swo, rpcUrl: DEFAULT_RPC_URL });
  const provided = Effect.either(program).pipe(
    Effect.provide(layer as Layer.Layer<R, never, never>),
  );
  return Effect.runPromise(provided);
}

// ── Effect programs for wallet actions ──────────────────────────────────────

export const requestChainId = Effect.gen(function* () {
  const wallet = yield* Services.WalletProviderService;
  return yield* wallet.requestChainId();
});

export const transferZeroEth = (recipient: string) =>
  Effect.gen(function* () {
    const contractWrite = yield* Services.ContractWriteService;
    const tx = yield* contractWrite.invokeContract({
      contractAddress: ContractAddress(ETH_TOKEN_ADDRESS),
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [ContractAddress(recipient), Uint256.from(0n)],
    });
    return tx.transactionHash;
  });

export const signTypedData = (data: WalletTypedData) =>
  Effect.gen(function* () {
    const wallet = yield* Services.WalletProviderService;
    return yield* wallet.signTypedData(data);
  });

// ── Wallet event listeners ──────────────────────────────────────────────────

let cleanupWalletListeners: (() => void) | null = null;

export function setupWalletListeners(
  swo: StarknetWindowObject,
  setSwo: (swo: StarknetWindowObject | null) => void,
  setAddress: (address: string | null) => void,
): () => void {
  // Clean up previous listeners if any
  cleanupWalletListeners?.();

  const onAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setSwo(null);
      setAddress(null);
    } else {
      setAddress(accounts[0]);
    }
  };

  const onNetworkChanged = (_chainId: string) => {
    // Force re-fetch of chain-dependent atoms by refreshing the registry
    // (block number will auto-refresh on focus; balance will update on next read)
  };

  swo.on('accountsChanged', onAccountsChanged);
  swo.on('networkChanged', onNetworkChanged);

  const cleanup = () => {
    swo.off('accountsChanged', onAccountsChanged);
    swo.off('networkChanged', onNetworkChanged);
    cleanupWalletListeners = null;
  };

  cleanupWalletListeners = cleanup;
  return cleanup;
}
