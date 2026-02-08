import { useCallback, useState } from 'react';
import { useAtomValue } from '@effect-atom/atom-react';
import { transactionReceiptAtom } from '../atoms';
import { shortAddress, formatFee } from '../lib/format';
import { Field } from './Field';
import { ResultView } from './ResultView';

export function TransactionSearchCard() {
  const [input, setInput] = useState('');
  const [searchedHash, setSearchedHash] = useState<string | null>(null);

  const handleSearch = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed) setSearchedHash(trimmed);
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  return (
    <div className="card full">
      <h2>Transaction Search</h2>

      <div className="search-input-group">
        <input
          type="text"
          className="search-input"
          placeholder="Enter transaction hash (0x...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={!input.trim()}>
          Search
        </button>
      </div>

      {searchedHash && <ReceiptDisplay txHash={searchedHash} />}
    </div>
  );
}

function ReceiptDisplay({ txHash }: { txHash: string }) {
  const receiptResult = useAtomValue(transactionReceiptAtom(txHash));

  return (
    <div className="receipt-container">
      <ResultView result={receiptResult}>
        {(receipt) => (
          <>
            <Field label="Transaction Hash" mono>{shortAddress(receipt.transaction_hash)}</Field>

            <div className="field">
              <span className="label">Status</span>
              <span className={`status-badge ${receipt.execution_status === 'SUCCEEDED' ? 'success' : 'error'}`}>
                {receipt.execution_status}
              </span>
            </div>

            <Field label="Type">{receipt.type}</Field>

            {receipt.block_number != null && (
              <Field label="Block Number">{receipt.block_number.toLocaleString()}</Field>
            )}

            {receipt.block_hash && (
              <Field label="Block Hash" mono>{shortAddress(receipt.block_hash)}</Field>
            )}

            {'actual_fee' in receipt && receipt.actual_fee && (
              <Field label="Actual Fee">{formatFee(receipt.actual_fee)}</Field>
            )}

            {'execution_resources' in receipt && receipt.execution_resources && (
              <Field label="Steps">{receipt.execution_resources.steps.toLocaleString()}</Field>
            )}

            {receipt.events && receipt.events.length > 0 && (
              <div className="field">
                <span className="label">Events ({receipt.events.length})</span>
                <div className="events-list">
                  {receipt.events.slice(0, 3).map((event, i) => (
                    <div key={i} className="event-item">
                      <Field label="From" mono>{shortAddress(event.from_address)}</Field>
                      <Field label="Keys">{event.keys.length} keys</Field>
                      <Field label="Data">{event.data.length} items</Field>
                    </div>
                  ))}
                  {receipt.events.length > 3 && (
                    <p className="empty">+ {receipt.events.length - 3} more events</p>
                  )}
                </div>
              </div>
            )}

            {receipt.messages_sent && receipt.messages_sent.length > 0 && (
              <Field label="Messages Sent">{receipt.messages_sent.length}</Field>
            )}
          </>
        )}
      </ResultView>
    </div>
  );
}
