import { useCallback, useState } from 'react';
import { useAtomValue, useAtomSet } from '@effect-atom/atom-react';
import { customTokensAtom, addToken, removeToken } from '../atoms';
import { shortAddress } from '../lib/format';

export function TokenManagerCard() {
  const tokens = useAtomValue(customTokensAtom);
  const setTokens = useAtomSet(customTokensAtom);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    setError(null);
    const addr = input.trim();

    if (!addr) { setError('Please enter a token address'); return; }
    if (!addr.startsWith('0x')) { setError('Address must start with 0x'); return; }
    if (addr.length < 10) { setError('Address is too short'); return; }
    if (tokens.some((t) => t.address.toLowerCase() === addr.toLowerCase())) {
      setError('Token already added');
      return;
    }

    addToken(setTokens, addr);
    setInput('');
  }, [input, tokens, setTokens]);

  const handleRemove = useCallback(
    (address: string) => removeToken(setTokens, address),
    [setTokens],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd();
    },
    [handleAdd],
  );

  return (
    <div className="card">
      <h2>Token Manager</h2>

      <div className="search-input-group">
        <input
          type="text"
          className="search-input"
          placeholder="Token address (0x...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-primary" onClick={handleAdd} disabled={!input.trim()}>
          Add
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {tokens.length === 0 ? (
        <p className="empty">No custom tokens added yet</p>
      ) : (
        <div className="token-list">
          {tokens.map((token) => (
            <div key={token.address} className="token-item">
              <div className="token-info">
                <code className="value">{shortAddress(token.address)}</code>
                <span className="token-date">
                  Added {new Date(token.addedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                className="btn-icon"
                onClick={() => handleRemove(token.address)}
                title="Remove token"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="muted tip">Add ERC20 token addresses to track their balances</p>
    </div>
  );
}
