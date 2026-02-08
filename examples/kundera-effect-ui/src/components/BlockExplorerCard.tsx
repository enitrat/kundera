import { useAtomValue } from '@effect-atom/atom-react';
import { latestBlockAtom } from '../atoms';
import { shortAddress, formatTimestamp } from '../lib/format';
import { Field } from './Field';
import { ResultView } from './ResultView';

export function BlockExplorerCard() {
  const blockResult = useAtomValue(latestBlockAtom);

  return (
    <div className="card">
      <h2>Block Explorer</h2>
      <ResultView result={blockResult}>
        {(block) => (
          <>
            <Field label="Block Number" large>{block.block_number.toLocaleString()}</Field>
            <Field label="Block Hash" mono>{shortAddress(block.block_hash)}</Field>
            <Field label="Timestamp">{formatTimestamp(block.timestamp)}</Field>
            <Field label="Transactions">{block.transactions.length}</Field>
            <Field label="Parent Hash" mono>{shortAddress(block.parent_hash)}</Field>
            <Field label="Sequencer" mono>{shortAddress(block.sequencer_address)}</Field>
          </>
        )}
      </ResultView>
    </div>
  );
}
