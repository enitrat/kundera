import { useAtomValue } from '@effect-atom/atom-react';
import { blockNumberAtom, chainIdAtom } from '../atoms';
import { Field } from './Field';
import { ResultView } from './ResultView';

export function ChainCard() {
  const blockNumber = useAtomValue(blockNumberAtom);
  const chainId = useAtomValue(chainIdAtom);

  return (
    <div className="card">
      <h2>Network</h2>
      <Field label="Block" large>
        <ResultView result={blockNumber}>
          {(n) => n.toLocaleString()}
        </ResultView>
      </Field>
      <Field label="Chain ID" mono>
        <ResultView result={chainId}>
          {(id) => id}
        </ResultView>
      </Field>
    </div>
  );
}
