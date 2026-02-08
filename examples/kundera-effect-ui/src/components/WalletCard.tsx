import { useAtom } from '@effect-atom/atom-react';
import { useEffect, useRef, useState } from 'react';
import { swoAtom, addressAtom, setupWalletListeners } from '../atoms';
import { connectWallet, disconnectWallet } from '../wallet';
import { shortAddress } from '../constants';

export function WalletCard() {
  const [swo, setSwo] = useAtom(swoAtom);
  const [address, setAddress] = useAtom(addressAtom);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = swo !== null;
  const cleanupRef = useRef<(() => void) | null>(null);

  // Register wallet event listeners when connected
  useEffect(() => {
    if (swo) {
      cleanupRef.current = setupWalletListeners(swo, setSwo, setAddress);
    }
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [swo, setSwo, setAddress]);

  const handleConnect = async () => {
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
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectWallet();
      setSwo(null);
      setAddress(null);
    } finally {
      setBusy(false);
    }
  };

  if (!connected) {
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
