import { useCallback, useState } from 'react';
import { useAtomValue } from '@effect-atom/atom-react';
import { Result } from '@effect-atom/atom';
import { retryDemoFamily } from '../atoms';
import { Field } from './Field';
import { ResultView } from './ResultView';

export function RetryDemoCard() {
  const [failureCount, setFailureCount] = useState(2);
  const [demoKey, setDemoKey] = useState(0);
  const [started, setStarted] = useState(false);

  const handleRun = useCallback(() => {
    setStarted(true);
    setDemoKey((k) => k + 1);
  }, []);

  return (
    <div className="card">
      <h2>Retry Demo</h2>
      <p className="muted description">
        Simulates RPC failures and demonstrates Effect.retry with exponential backoff
      </p>

      <Field label="Failures to Simulate">
        <div className="slider-group">
          <input
            type="range"
            min="0"
            max="5"
            value={failureCount}
            onChange={(e) => setFailureCount(Number(e.target.value))}
            className="slider"
          />
          <span>{failureCount}</span>
        </div>
      </Field>

      <button className="btn btn-primary run-btn" onClick={handleRun}>
        Run Demo
      </button>

      {started && (
        <RetryResult failureCount={failureCount} demoKey={demoKey} />
      )}
    </div>
  );
}

/**
 * Separated into its own component so useAtomValue is called unconditionally.
 * Fixes the Rules-of-Hooks violation from the old code.
 */
function RetryResult({ failureCount, demoKey }: { failureCount: number; demoKey: number }) {
  const result = useAtomValue(retryDemoFamily({ failureCount, key: demoKey }));

  return (
    <div className="demo-result" key={demoKey}>
      {Result.isInitial(result) ? (
        <Field label="Status">Running with {failureCount} simulated failures...</Field>
      ) : (
        <ResultView result={result}>
          {(data) => (
            <>
              <div className="field">
                <span className="label">Result</span>
                <span className="status-badge success">Success</span>
              </div>
              <Field label="Block Number">{data.blockNumber.toLocaleString()}</Field>
              <Field label="Total Attempts">{data.attempts}</Field>
              <p className="muted tip">
                Succeeded after {data.attempts - 1} failure(s) using exponential backoff
              </p>
            </>
          )}
        </ResultView>
      )}
    </div>
  );
}
