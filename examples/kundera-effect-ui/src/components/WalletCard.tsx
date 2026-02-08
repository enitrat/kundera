import { useAtom } from '@effect-atom/atom-react';
import { useCallback, useEffect, useState } from 'react';
import { swoAtom, addressAtom } from '../atoms';
import { connectWallet, disconnectWallet } from '../wallet';
import { shortAddress } from '../lib/format';
import type { StarknetWindowObject } from '@kundera-sn/kundera-ts/provider';

export function WalletCard() {
  const [swo, setSwo] = useAtom(swoAtom);
  const [address, setAddress] = useAtom(addressAtom);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useWalletListeners(swo, setSwo, setAddress);

  const handleConnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const conn = await connectWallet();
      if (!conn) {
        setError('Connection cancelled');
        return;
      }
      setSwo(conn.swo);
      setAddress(conn.address);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [setSwo, setAddress]);

  const handleDisconnect = useCallback(async () => {
    setBusy(true);
    try {
      await disconnectWallet();
      setSwo(null);
      setAddress(null);
    } finally {
      setBusy(false);
    }
  }, [setSwo, setAddress]);

  if (!swo) {
    return (
      <div className="card">
        <h2>Wallet</h2>
        <button className="btn btn-primary" onClick={handleConnect} disabled={busy}>
          {busy ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Wallet</h2>
      <div className="field">
        <span className="label">Address</span>
        <code className="value">{shortAddress(address ?? '')}</code>
      </div>
      <button className="btn" onClick={handleDisconnect} disabled={busy}>
        {busy ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </div>
  );
}

/** Subscribe to wallet account changes. Clean up on unmount or SWO change. */
function useWalletListeners(
  swo: StarknetWindowObject | null,
  setSwo: (v: StarknetWindowObject | null) => void,
  setAddress: (v: string | null) => void,
) {
  useEffect(() => {
    if (!swo) return;

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setSwo(null);
        setAddress(null);
      } else {
        setAddress(accounts[0]);
      }
    };

    swo.on('accountsChanged', onAccountsChanged);
    return () => {
      swo.off('accountsChanged', onAccountsChanged);
    };
  }, [swo, setSwo, setAddress]);
}
