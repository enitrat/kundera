import { useAtomValue } from '@effect-atom/atom-react';
import { addressAtom, ethBalanceOf } from '../atoms';
import { formatEth, shortAddress } from '../lib/format';
import { ETH_TOKEN_ADDRESS } from '../constants';
import { Field } from './Field';
import { ResultView } from './ResultView';

export function BalanceCard() {
  const address = useAtomValue(addressAtom);

  if (!address) {
    return (
      <div className="card">
        <h2>Balance</h2>
        <p className="empty">Connect wallet to view balance</p>
      </div>
    );
  }

  return <BalanceDisplay address={address} />;
}

function BalanceDisplay({ address }: { address: string }) {
  const result = useAtomValue(ethBalanceOf(address));

  return (
    <div className="card">
      <h2>Balance</h2>
      <Field label="ETH" large>
        <ResultView result={result}>
          {(balance) => `${formatEth(balance)} ETH`}
        </ResultView>
      </Field>
      <Field label="Token" mono>{shortAddress(ETH_TOKEN_ADDRESS)}</Field>
    </div>
  );
}
