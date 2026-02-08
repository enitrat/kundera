import { useCallback, useState } from 'react';
import { Either } from 'effect';
import { useAtomValue } from '@effect-atom/atom-react';
import { swoAtom, runWithWallet } from '../atoms';
import { formatError } from '../lib/formatError';

interface WalletActionState<T> {
  readonly pending: boolean;
  readonly result: T | null;
  readonly error: string | null;
}

/**
 * Hook for wallet mutations. Wraps runWithWallet with loading/error state.
 *
 * Usage:
 * ```ts
 * const { execute, pending, result, error } = useWalletAction();
 * await execute(transferZeroEth(address));
 * ```
 */
export function useWalletAction<T = unknown>() {
  const swo = useAtomValue(swoAtom);
  const [state, setState] = useState<WalletActionState<T>>({
    pending: false,
    result: null,
    error: null,
  });

  const execute = useCallback(
    async (program: Parameters<typeof runWithWallet>[1]) => {
      if (!swo) return;
      setState({ pending: true, result: null, error: null });
      try {
        const either = await runWithWallet(swo, program);
        if (Either.isLeft(either)) {
          setState({ pending: false, result: null, error: formatError(either.left) });
        } else {
          setState({ pending: false, result: either.right as T, error: null });
        }
      } catch (e) {
        setState({ pending: false, result: null, error: formatError(e) });
      }
    },
    [swo],
  );

  const connected = swo !== null;

  return { ...state, execute, connected } as const;
}
