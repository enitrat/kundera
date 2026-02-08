import { WalletCard } from './components/WalletCard';
import { ChainCard } from './components/ChainCard';
import { BalanceCard } from './components/BalanceCard';
import { ActionsCard } from './components/ActionsCard';
import { BlockExplorerCard } from './components/BlockExplorerCard';
import { GasPriceCard } from './components/GasPriceCard';
import { TransactionSearchCard } from './components/TransactionSearchCard';
import { TokenManagerCard } from './components/TokenManagerCard';
import { TokenBalanceList } from './components/TokenBalanceList';
import { RetryDemoCard } from './components/RetryDemoCard';


export function App() {
  return (
    <main className="app">
      <header className="header">
        <h1>Kundera Effect</h1>
        <p className="subtitle">React integration showcase for Starknet dApps</p>
        <div className="tag-row">
          <span className="tag">Effect-TS</span>
          <span className="tag">Atoms</span>
          <span className="tag">Starknet</span>
        </div>
      </header>

      <section>
        <h2 className="section-title">Wallet & Account</h2>
        <div className="grid">
          <WalletCard />
          <ChainCard />
          <BalanceCard />
          <ActionsCard />
        </div>
      </section>

      <section>
        <h2 className="section-title">Chain Data</h2>
        <div className="grid">
          <BlockExplorerCard />
          <GasPriceCard />
          <TransactionSearchCard />
        </div>
      </section>

      <section>
        <h2 className="section-title">Token Tracking</h2>
        <div className="grid">
          <TokenManagerCard />
          <TokenBalanceList />
        </div>
      </section>

      <section>
        <h2 className="section-title">Effect Patterns</h2>
        <div className="grid">
          <RetryDemoCard />
        </div>
      </section>
    </main>
  );
}
