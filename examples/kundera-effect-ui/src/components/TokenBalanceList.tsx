import { useAtomValue } from '@effect-atom/atom-react';
import { customTokensAtom, addressAtom, tokenBalanceOf } from '../atoms';
import { formatEth, shortAddress } from '../lib/format';
import { Field } from './Field';
import { ResultView } from './ResultView';

export function TokenBalanceList() {
  const tokens = useAtomValue(customTokensAtom);
  const address = useAtomValue(addressAtom);

  if (!address) {
    return (
      <div className="card full">
        <h2>Token Balances</h2>
        <p className="empty">Connect wallet to view token balances</p>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="card full">
        <h2>Token Balances</h2>
        <p className="empty">No custom tokens added. Use Token Manager to add tokens.</p>
      </div>
    );
  }

  return (
    <div className="card full">
      <h2>Token Balances</h2>
      <div className="token-balance-grid">
        {tokens.map((token) => (
          <TokenBalanceItem
            key={token.address}
            tokenAddress={token.address}
            accountAddress={address}
          />
        ))}
      </div>
    </div>
  );
}

function TokenBalanceItem({
  tokenAddress,
  accountAddress,
}: {
  tokenAddress: string;
  accountAddress: string;
}) {
  const balanceResult = useAtomValue(
    tokenBalanceOf({ tokenAddress, accountAddress }),
  );

  return (
    <div className="token-balance-item">
      <Field label="Token" mono>{shortAddress(tokenAddress)}</Field>
      <Field label="Balance" large>
        <ResultView result={balanceResult}>
          {(balance) => formatEth(balance)}
        </ResultView>
      </Field>
    </div>
  );
}
