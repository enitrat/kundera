import { Atom } from '@effect-atom/atom';
import { Effect, Either, Layer, Schedule } from 'effect';
import { JsonRpc, Presets, Services } from '@kundera-sn/kundera-effect';
import { ContractAddress, Uint256, Felt252 } from '@kundera-sn/kundera-ts';
import type { StarknetWindowObject, WalletTypedData } from '@kundera-sn/kundera-ts/provider';
import { DEFAULT_RPC_URL, ERC20_ABI, ETH_TOKEN_ADDRESS, getRpcUrl } from './constants';

// ── Layer composition (module-level, static) ────────────────────────────────

const providerLayer = Presets.createProvider(DEFAULT_RPC_URL);

const readLayer = Layer.mergeAll(
  providerLayer,
  Services.ContractLive.pipe(Layer.provide(providerLayer)),
);

/** Read-only runtime for chain data atoms. */
export const provider = Atom.runtime(readLayer);

// ── Writable state ──────────────────────────────────────────────────────────

export const swoAtom = Atom.make<StarknetWindowObject | null>(null).pipe(Atom.keepAlive);
export const addressAtom = Atom.make<string | null>(null).pipe(Atom.keepAlive);

// ── Chain read atoms ────────────────────────────────────────────────────────

export const blockNumberAtom = provider.atom(JsonRpc.blockNumber()).pipe(
  Atom.refreshOnWindowFocus,
);

export const chainIdAtom = provider.atom(JsonRpc.chainId()).pipe(Atom.keepAlive);

// ── Latest block (auto-refresh every 12s) ───────────────────────────────────

const baseLatestBlockAtom = provider.atom(
  JsonRpc.getBlockWithTxHashes('latest'),
).pipe(Atom.keepAlive);

export const latestBlockAtom = Atom.make((get) => {
  const interval = setInterval(() => {
    get.refresh(baseLatestBlockAtom);
  }, 12_000);
  get.addFinalizer(() => clearInterval(interval));
  return get(baseLatestBlockAtom);
}).pipe(Atom.keepAlive);

// ── Transaction receipt family ──────────────────────────────────────────────

export const transactionReceiptAtom = Atom.family((txHash: string) =>
  provider.atom(JsonRpc.getTransactionReceipt(Felt252(txHash))),
);

// ── Token management (localStorage-synced) ──────────────────────────────────

export interface TokenInfo {
  readonly address: string;
  readonly addedAt: number;
}

const TOKENS_STORAGE_KEY = 'kundera-custom-tokens';

function loadTokens(): TokenInfo[] {
  try {
    const raw = localStorage.getItem(TOKENS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenInfo[]) : [];
  } catch {
    return [];
  }
}

function persistTokens(tokens: TokenInfo[]): void {
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
}

export const customTokensAtom = Atom.make(loadTokens()).pipe(Atom.keepAlive);

export function addToken(
  setTokens: (updater: (prev: TokenInfo[]) => TokenInfo[]) => void,
  address: string,
): void {
  setTokens((prev) => {
    const next = [...prev, { address, addedAt: Date.now() }];
    persistTokens(next);
    return next;
  });
}

export function removeToken(
  setTokens: (updater: (prev: TokenInfo[]) => TokenInfo[]) => void,
  address: string,
): void {
  setTokens((prev) => {
    const next = prev.filter((t) => t.address.toLowerCase() !== address.toLowerCase());
    persistTokens(next);
    return next;
  });
}

// ── ERC20 balance (generic, works for any token + account pair) ─────────────

export const tokenBalanceOf = Atom.family(
  (params: { tokenAddress: string; accountAddress: string }) =>
    provider.atom(
      Services.readContract({
        contractAddress: ContractAddress(params.tokenAddress),
        abi: ERC20_ABI,
        functionName: 'balance_of',
        args: [ContractAddress(params.accountAddress)],
      }).pipe(Effect.map(Uint256.toBigInt)),
    ).pipe(Atom.refreshOnWindowFocus),
);

/** ETH balance shorthand — delegates to tokenBalanceOf with ETH token. */
export const ethBalanceOf = Atom.family((address: string) =>
  tokenBalanceOf({ tokenAddress: ETH_TOKEN_ADDRESS, accountAddress: address }),
);

// ── Wallet operations (imperative, dynamic layer) ───────────────────────────

export async function runWithWallet<A, R>(
  swo: StarknetWindowObject,
  program: Effect.Effect<A, unknown, R>,
): Promise<Either.Either<A, unknown>> {
  const chainIdHex = (await swo.request({
    type: 'wallet_requestChainId',
  })) as string;

  const rpcUrl = getRpcUrl(chainIdHex);
  const isMainnet = chainIdHex.includes('MAINNET') || chainIdHex === '0x534e5f4d41494e';
  const layer = isMainnet
    ? Presets.MainnetWalletStack({ swo, rpcUrl })
    : Presets.SepoliaWalletStack({ swo, rpcUrl });

  return Effect.runPromise(
    Effect.either(program).pipe(
      Effect.provide(layer as Layer.Layer<R, never, never>),
    ),
  );
}

// ── Effect programs for wallet actions ──────────────────────────────────────

export const transferZeroEth = Effect.fn('transferZeroEth')((recipient: string) =>
  Effect.gen(function* () {
    const contractWrite = yield* Services.ContractWriteService;
    const tx = yield* contractWrite.invokeContract({
      contractAddress: ContractAddress(ETH_TOKEN_ADDRESS),
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [ContractAddress(recipient), Uint256.from(0n)],
    });
    return tx.transactionHash;
  }),
);

export const signTypedData = Effect.fn('signTypedData')((data: WalletTypedData) =>
  Effect.gen(function* () {
    const wallet = yield* Services.WalletProviderService;
    return yield* wallet.signTypedData(data);
  }),
);

// ── Retry demo atom factory ─────────────────────────────────────────────────

export function createRetryDemoAtom(failureCount: number) {
  let attempts = 0;

  return provider.atom(
    Effect.gen(function* () {
      attempts++;
      if (attempts <= failureCount) {
        yield* Effect.fail(new Error(`Simulated RPC failure (attempt ${attempts})`));
      }
      const blockNumber = yield* JsonRpc.blockNumber();
      return { blockNumber, attempts };
    }).pipe(
      Effect.retry(
        Schedule.exponential('100 millis').pipe(
          Schedule.intersect(Schedule.recurs(5)),
          Schedule.jittered,
        ),
      ),
    ),
  );
}

export const retryDemoFamily = Atom.family(
  (params: { failureCount: number; key: number }) =>
    createRetryDemoAtom(params.failureCount),
);
