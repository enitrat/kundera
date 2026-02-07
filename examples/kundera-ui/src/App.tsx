import { useState, useCallback } from 'react';
import {
  connectWallet,
  disconnectWallet,
  type WalletModalConnection,
} from './skills/wallet-modal-starknetkit';
import {
  createWalletAccount,
  onAccountsChanged,
  onNetworkChanged,
  type WalletAccount,
} from './skills/wallet-account';
import { readContract } from './skills/contract-read';
import { writeContract } from './skills/contract-write';
import { ContractAddress } from '@kundera-sn/kundera-ts/ContractAddress';
import { Uint256 } from '@kundera-sn/kundera-ts/Uint256';

const ETH_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

const ERC20_ABI = [
  {
    type: 'function' as const,
    name: 'balance_of',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'view' as const,
  },
  {
    type: 'function' as const,
    name: 'transfer',
    inputs: [
      { name: 'recipient', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount', type: 'core::integer::u256' },
    ],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'external' as const,
  },
] as const;

export function App() {
  const [connection, setConnection] = useState<WalletModalConnection | null>(null);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [chainId, setChainId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // ── Connect ──────────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    setError(null);
    addLog('Opening StarknetKit modal...');

    const { result, error: connectError } = await connectWallet({
      chainId: 'SN_MAIN',
    });

    if (connectError) {
      setError(`${connectError.code}: ${connectError.message}`);
      addLog(`Connection failed: ${connectError.code}`);
      return;
    }

    if (!result) return;

    setConnection(result);
    addLog(`Connected to ${result.walletId} — ${result.address}`);

    // Skills compose directly — result.swo is a StarknetWindowObject
    const walletAccount = createWalletAccount({
      swo: result.swo,
      transport: result.transport,
    });

    setAccount(walletAccount);
    addLog('WalletAccount created');

    // Subscribe to wallet events
    onAccountsChanged(result.swo, (accounts) => {
      addLog(`accountsChanged: ${accounts.join(', ')}`);
    });
    onNetworkChanged(result.swo, (newChainId) => {
      addLog(`networkChanged: ${newChainId}`);
      setChainId(newChainId);
    });
  }, [addLog]);

  // ── Disconnect ───────────────────────────────────────────────────────
  const handleDisconnect = useCallback(async () => {
    await disconnectWallet();
    setConnection(null);
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setTxHash(null);
    addLog('Disconnected');
  }, [addLog]);

  // ── Get Chain ID ─────────────────────────────────────────────────────
  const handleGetChainId = useCallback(async () => {
    if (!account) return;
    try {
      const id = await account.chainId();
      setChainId(id);
      addLog(`chainId: ${id}`);
    } catch (e) {
      addLog(`chainId error: ${e}`);
    }
  }, [account, addLog]);

  // ── Get ETH Balance (readContract via node transport) ────────────────
  const handleGetBalance = useCallback(async () => {
    if (!connection || !account) return;
    try {
      addLog('readContract(balance_of) via node transport...');
      const { result: decoded, error: readError } = await readContract(
        account.nodeTransport,
        {
          abi: ERC20_ABI,
          address: ETH_ADDRESS,
          functionName: 'balance_of',
          args: [ContractAddress(connection.address)],
        },
      );
      if (readError) {
        addLog(`readContract error: ${readError.code} — ${readError.message}`);
        return;
      }
      const raw = BigInt(decoded as string | bigint);
      const formatted = `${(Number(raw) / 1e18).toFixed(6)} ETH`;
      setBalance(formatted);
      addLog(`Balance: ${formatted} (raw: ${raw})`);
    } catch (e) {
      addLog(`balance error: ${e}`);
    }
  }, [account, connection, addLog]);

  // ── Transfer 0 ETH (writeContract via wallet) ──────────────────────
  const handleTransfer = useCallback(async () => {
    if (!account || !connection) return;
    try {
      addLog('writeContract(transfer) via wallet provider...');
      const { result: writeResult, error: writeError } = await writeContract({
        abi: ERC20_ABI,
        address: ETH_ADDRESS,
        functionName: 'transfer',
        args: [ContractAddress(connection.address), Uint256.from(0n)],
        account,
      });
      if (writeError) {
        addLog(`writeContract error: ${writeError.code} — ${writeError.message}`);
        return;
      }
      setTxHash(writeResult!.transactionHash);
      addLog(`tx sent: ${writeResult!.transactionHash}`);
    } catch (e) {
      addLog(`transfer error: ${e}`);
    }
  }, [account, connection, addLog]);

  // ── Sign Typed Data (SNIP-12) ───────────────────────────────────────
  const handleSign = useCallback(async () => {
    if (!account) return;
    try {
      addLog('Requesting SNIP-12 signature...');
      const signature = await account.signTypedData({
        types: {
          StarkNetDomain: [
            { name: 'name', type: 'felt' },
            { name: 'version', type: 'felt' },
            { name: 'chainId', type: 'felt' },
          ],
          Message: [{ name: 'content', type: 'felt' }],
        },
        primaryType: 'Message',
        domain: { name: 'KunderaUI', version: '1', chainId: 'SN_MAIN' },
        message: { content: '0x48656c6c6f' }, // "Hello"
      });
      addLog(`signature: [${signature.join(', ')}]`);
    } catch (e) {
      addLog(`sign error: ${e}`);
    }
  }, [account, addLog]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <h1>Kundera UI — Wallet Integration Test</h1>

      {/* Connection */}
      <section style={{ marginBottom: 24 }}>
        <h2>Connection</h2>
        {!connection ? (
          <button onClick={handleConnect}>Connect Wallet</button>
        ) : (
          <div>
            <p>
              <strong>Wallet:</strong> {connection.walletId}
            </p>
            <p>
              <strong>Address:</strong>{' '}
              <code>{connection.address.slice(0, 10)}...{connection.address.slice(-8)}</code>
            </p>
            <p>
              <strong>Chain:</strong> {chainId ?? connection.chainId}
            </p>
            <button onClick={handleDisconnect}>Disconnect</button>
          </div>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>

      {/* Actions */}
      {connection && (
        <section style={{ marginBottom: 24 }}>
          <h2>Actions</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleGetChainId}>Get Chain ID</button>
            <button onClick={handleGetBalance}>Get ETH Balance</button>
            <button onClick={handleTransfer}>Transfer 0 ETH (test)</button>
            <button onClick={handleSign}>Sign Typed Data</button>
          </div>
          {balance && (
            <p>
              <strong>Balance:</strong> {balance}
            </p>
          )}
          {txHash && (
            <p>
              <strong>Last TX:</strong> <code>{txHash}</code>
            </p>
          )}
        </section>
      )}

      {/* Log */}
      <section>
        <h2>Log</h2>
        <div
          style={{
            background: '#1a1a1a',
            color: '#0f0',
            padding: 16,
            borderRadius: 4,
            maxHeight: 300,
            overflow: 'auto',
            fontSize: 13,
          }}
        >
          {log.length === 0 ? (
            <span style={{ color: '#666' }}>No events yet...</span>
          ) : (
            log.map((entry, i) => <div key={i}>{entry}</div>)
          )}
        </div>
      </section>
    </div>
  );
}
