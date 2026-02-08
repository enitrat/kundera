/**
 * Format Effect tagged errors and plain errors into user-readable strings.
 */
export function formatError(error: unknown): string {
  if (error && typeof error === 'object' && '_tag' in error) {
    const tagged = error as { _tag: string; message?: string };
    if (tagged._tag === 'RpcError' && tagged.message?.includes('Transaction hash not found')) {
      return 'Transaction not found. Check the hash and try again.';
    }
    return `${tagged._tag}: ${tagged.message ?? 'Unknown failure'}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
