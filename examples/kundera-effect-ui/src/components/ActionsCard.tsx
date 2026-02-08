import { useAtomValue } from '@effect-atom/atom-react';
import { useCallback, useState } from 'react';
import { swoAtom, addressAtom, transferZeroEth, signTypedData } from '../atoms';
import { useWalletAction } from '../hooks/useWalletAction';
import { createHelloTypedData } from '../constants';
import { shortAddress } from '../lib/format';
import type { WalletTypedData } from '@kundera-sn/kundera-ts/provider';

type ActionKind = 'transfer' | 'sign' | null;

export function ActionsCard() {
  const swo = useAtomValue(swoAtom);
  const address = useAtomValue(addressAtom);
  const transfer = useWalletAction<string>();
  const sign = useWalletAction<string[]>();
  const [activeAction, setActiveAction] = useState<ActionKind>(null);

  const connected = swo !== null && address !== null;

  const handleTransfer = useCallback(async () => {
    if (!swo || !address) return;
    setActiveAction('transfer');
    await transfer.execute(transferZeroEth(address));
    setActiveAction(null);
  }, [swo, address, transfer.execute]);

  const handleSign = useCallback(async () => {
    if (!swo) return;
    setActiveAction('sign');
    const chainIdHex = (await swo.request({ type: 'wallet_requestChainId' })) as string;
    const typedData = createHelloTypedData(chainIdHex);
    await sign.execute(signTypedData(typedData as unknown as WalletTypedData));
    setActiveAction(null);
  }, [swo, sign.execute]);

  return (
    <div className="card full">
      <h2>Actions</h2>

      <div className="btn-row">
        <button className="btn" onClick={handleTransfer} disabled={!connected || activeAction !== null}>
          {activeAction === 'transfer' ? 'Sending...' : 'Transfer 0 ETH'}
        </button>
        <button className="btn" onClick={handleSign} disabled={!connected || activeAction !== null}>
          {activeAction === 'sign' ? 'Signing...' : 'Sign Typed Data'}
        </button>
      </div>

      {transfer.result && (
        <div className="field action-result">
          <span className="label">Transaction</span>
          <code className="value">{shortAddress(transfer.result)}</code>
        </div>
      )}

      {sign.result && (
        <div className="field action-result">
          <span className="label">Signature</span>
          <code className="value">[{sign.result.length} felts]</code>
        </div>
      )}

      {(transfer.error ?? sign.error) && (
        <p className="error">{transfer.error ?? sign.error}</p>
      )}

      {!connected && <p className="empty action-result">Connect wallet to perform actions</p>}
    </div>
  );
}
