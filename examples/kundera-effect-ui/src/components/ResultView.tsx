import type { ReactNode } from 'react';
import { Result } from '@effect-atom/atom';
import { Cause } from 'effect';
import { formatError } from '../lib/formatError';

interface ResultViewProps<A, E> {
  readonly result: Result.Result<A, E>;
  readonly children: (value: A) => ReactNode;
  readonly loading?: ReactNode;
  readonly error?: (err: unknown) => ReactNode;
}

const defaultLoading = <span className="muted">Loading...</span>;

function defaultError(err: unknown): ReactNode {
  return <span className="error" title={String(err)}>{formatError(err)}</span>;
}

/**
 * Declarative Result renderer. Eliminates Result.builder boilerplate.
 *
 * Usage:
 * ```tsx
 * <ResultView result={blockNumber}>
 *   {(n) => n.toLocaleString()}
 * </ResultView>
 * ```
 */
export function ResultView<A, E = unknown>({
  result,
  children,
  loading = defaultLoading,
  error = defaultError,
}: ResultViewProps<A, E>): ReactNode {
  return Result.match(result, {
    onInitial: () => loading,
    onSuccess: (s) => children(s.value),
    onFailure: (f) => error(Cause.squash(f.cause)),
  });
}
