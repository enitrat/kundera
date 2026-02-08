import { useAtomValue } from '@effect-atom/atom-react';
import { latestBlockAtom } from '../atoms';
import { formatGasPrice } from '../lib/format';
import { Field } from './Field';
import { ResultView } from './ResultView';

export function GasPriceCard() {
  const blockResult = useAtomValue(latestBlockAtom);

  return (
    <div className="card">
      <h2>Gas Prices</h2>
      <ResultView result={blockResult}>
        {(block) => (
          <>
            <Field label="L1 Gas (ETH)" large>{formatGasPrice(block.l1_gas_price.price_in_wei)}</Field>
            <Field label="L1 Gas (STRK)" large>{formatGasPrice(block.l1_gas_price.price_in_fri)}</Field>
            <Field label="L1 Data Gas (ETH)" large>{formatGasPrice(block.l1_data_gas_price.price_in_wei)}</Field>
            <Field label="L1 Data Gas (STRK)" large>{formatGasPrice(block.l1_data_gas_price.price_in_fri)}</Field>
            <Field label="DA Mode">{block.l1_da_mode}</Field>
          </>
        )}
      </ResultView>
    </div>
  );
}
