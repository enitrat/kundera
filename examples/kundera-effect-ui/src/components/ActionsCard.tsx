import { useAtomValue } from '@effect-atom/atom-react';
import { Either } from 'effect';
import { useState } from 'react';
import { swoAtom, addressAtom, runWithWallet, transferZeroEth, signTypedData } from '../atoms';
import { HELLO_TYPED_DATA, shortAddress } from '../constants';
import type { WalletTypedData } from '@kundera-sn/kundera-ts/provider';

type Action = 'transfer' | 'sign' | null;

export function ActionsCard() {
  const swo = useAtomValue(swoAtom);
  const address = useAtomValue(addressAtom);
  const [busy, setBusy] = useState<Action>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [signature, setSignature] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = swo !== null && address !== null;

  const handleTransfer = async () => {
    if (!swo || !address) return;
    setBusy('transfer');
    setError(null);
    try {
      const result = await runWithWallet(swo, transferZeroEth(address));
      if (Either.isLeft(result)) {
        setError(formatError(result.left));
      } else {
        setTxHash(result.right as string);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleSign = async () => {
    if (!swo) return;
    setBusy('sign');
    setError(null);
    try {
      const result = await runWithWallet(
        swo,
        signTypedData(HELLO_TYPED_DATA as unknown as WalletTypedData),
      );
      if (Either.isLeft(result)) {
        setError(formatError(result.left));
      } else {
        setSignature(result.right as string[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card full">
      <h2>Actions</h2>

      <div className="btn-row">
        <button className="btn" onClick={handleTransfer} disabled={!connected || busy !== null}>
          {busy === 'transfer' ? 'Sending...' : 'Transfer 0 ETH'}
        </button>
        <button className="btn" onClick={handleSign} disabled={!connected || busy !== null}>
          {busy === 'sign' ? 'Signing...' : 'Sign Typed Data'}
        </button>
      </div>

      {txHash && (
        <div className="field" style={{ marginTop: '0.75rem' }}>
          <span className="label">Transaction</span>
          <code className="value">{shortAddress(txHash)}</code>
        </div>
      )}

      {signature && (
        <div className="field" style={{ marginTop: txHash ? 0 : '0.75rem' }}>
          <span className="label">Signature</span>
          <code className="value">[{signature.length} felts]</code>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {!connected && <p className="empty" style={{ marginTop: '0.75rem' }}>Connect wallet to perform actions</p>}
    </div>
  );
}

function formatError(error: unknown): string {
  if (error && typeof error === 'object' && '_tag' in error) {
    const tagged = error as { _tag: string; message?: string };
    return `${tagged._tag}: ${tagged.message ?? 'Unknown failure'}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
