# Integration Testing Research — Starknet RPC + Wallet

> Research conducted 2026-02-06. Covers starknet.js, Voltaire, viem, and snapshot/fixture patterns.

---

## 1. starknet.js Integration Testing

**Source:** https://github.com/starknet-io/starknet.js

### Approach: Live endpoints, zero fixtures

All integration tests hit real RPC endpoints. No recorded fixtures anywhere.

**Two modes:**
1. **Devnet (default on PR/push):** `starknet-devnet-rs` Docker container at `localhost:5050`
2. **Sepolia testnet (on `main`):** Real Juno/Pathfinder nodes. Full matrix: `{Juno, Pathfinder} × {RPC, WS} × {v0.8, v0.9}`

### Test infrastructure stack

- Docker service: `shardlabs/starknet-devnet-rs:0.7.0`
- `starknet-devnet` npm package (`^0.4.4`) for devnet API (predeployed accounts, block creation)
- Auto-detection pipeline (`strategyResolver.ts`): probes localhost, fetches accounts, detects spec version, sets env flags
- Conditional skipping: `describeIfDevnet`, `describeIfTestnet`, `describeIfRpc09`
- Schema validation: `jest-json-schema` + `ajv` against official `starknet-specs` JSON schemas
- 50-minute Jest timeout. Every test suite deploys contracts from scratch.

### RPC methods tested end-to-end

`getBlockNumber`, `getBlockWithTxHashes`, `getBlockWithTxs`, `getBlockWithReceipts`, `getTransactionByHash`, `getTransactionStatus`, `getTransactionReceipt`, `getTransactionTrace`, `getClassHashAt`, `getClassAt`, `getClass`, `getEvents`, `estimateFee`, `estimateMessageFee`, `getStateUpdate`, `syncing`, `specVersion`, `chainId`, plus all write operations (`addInvokeTransaction`, `addDeclareTransaction`, `addDeployAccountTransaction`) via Account.

### Wallet testing: dead stub

```typescript
// __tests__/walletAccount.test.ts — this is the ENTIRE file
// TODO Mock: get-starknet UI connect/disconnect wallet
// TODO Create Mock Wallet;
describe('wallet account test', () => {
  test('estimateInvokeFee Cairo 0', async () => { return true; });
});
```

Nobody has solved wallet integration testing in the Starknet ecosystem.

### CI configuration

- Devnet tests: triggered on every PR and push to dev branches
- Testnet tests: triggered on pushes to `main` only
- Node matrix: Juno + Pathfinder (both maintained by community)
- Protocol matrix: v0.8, v0.9
- Transport matrix: HTTP, WebSocket

### Key patterns adoptable by Kundera

- `describeIfDevnet` / `describeIfTestnet` conditional gates → translate to vitest
- `DevnetProvider.getPredeployedAccounts()` for account setup
- `createBlockForDevnet()` helper for block production
- Schema validation against official JSON schemas

---

## 2. Voltaire Integration Testing

**Source:** https://github.com/evmts/voltaire (previously YohanTz/voltaire)

### Approach: Zero integration tests

All 4,332 test files are unit tests against mocks. Three mock strategies:

#### 1. TestTransport (Effect layer)
Method→response map, primary testing primitive:
```typescript
const transport = TestTransport({
  starknet_blockNumber: () => Effect.succeed(12345),
  starknet_getBlockWithTxHashes: () => Effect.succeed({...}),
})
```

#### 2. MockRpcClient
In-memory EIP-1193 provider with account/block state:
- Tracks accounts, blocks, nonces
- Dispatches based on method name
- No network calls

#### 3. InMemoryProvider
Full in-process provider with mining modes and snapshot/revert:
- Simulates block production
- State snapshot + revert for test isolation
- Most complex mock — not used for RPC codec testing

### Assessment

Voltaire's `TestTransport` is elegant for unit testing Effect services but doesn't validate codec correctness against real data. Their mock data is hand-crafted, same risk as Kundera's current approach.

---

## 3. viem / Ethereum Ecosystem

**Source:** https://github.com/wevm/viem

### Approach: Anvil per test worker, no fixtures

- `@viem/anvil` package manages Anvil (local EVM) instances
- Each vitest worker gets its own Anvil via `VITEST_POOL_ID`
- Tests fork mainnet at a pinned block number
- Every test hits a real execution environment
- No VCR/recorded fixture pattern anywhere

### Why this doesn't apply to Starknet

- Anvil is fast (Rust, in-process) — devnet-rs is slower and requires Docker
- Ethereum has deterministic state at block N — Starknet does too, but devnet has different genesis
- viem tests write operations (deploy, send tx) — we primarily need read validation

---

## 4. Snapshot/Fixture Testing Tools

### The JSON-RPC body-matching problem

Unlike REST APIs where URLs differentiate endpoints, JSON-RPC sends everything to `/rpc` with the `method` field in the POST body. This eliminates simple URL-matching tools.

### Tool comparison

| Tool | JSON-RPC support | Verdict |
|------|-----------------|---------|
| **nock** | Poor — URL-based matching, body matching is hacky | Skip |
| **Polly.js** (Netflix) | Poor — designed for REST, same URL problem | Skip |
| **MSW** (Mock Service Worker) | Good — intercepts at network level, body matching natural | **Use this** |
| **vi.fn() on fetch** | Works but manual — must parse body yourself | Current approach in Kundera |

### MSW for JSON-RPC

MSW intercepts at the network level (service worker in browser, interceptor in Node). Perfect for JSON-RPC because:

1. `http.post('*/rpc')` catches all RPC calls
2. Handler reads `request.json()` → matches on `body.method`
3. Returns pre-recorded fixture from file
4. `onUnhandledRequest: 'error'` prevents network leaks

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.post('*/rpc', async ({ request }) => {
    const body = await request.json();
    const fixture = fixtures[body.method];
    if (!fixture) return HttpResponse.json({ error: 'unmatched' }, { status: 404 });
    return HttpResponse.json(fixture);
  }),
];

const server = setupServer(...handlers);
```

### starknet-devnet-rs capabilities

**Repo:** https://github.com/0xSpaceShard/starknet-devnet

- `--seed` flag for deterministic predeployed accounts
- `--dump-path` / `--load-path` for state persistence (file-based snapshot)
- Mint endpoint for funding accounts
- Block creation on demand
- Supports v0.8 spec

**Good for:** Write operations (deploy, invoke, declare), account lifecycle
**Overkill for:** Read-only RPC parsing tests (our immediate need)

### starknet-devnet-js

**Package:** `starknet-devnet` on npm

TypeScript client for devnet API:
```typescript
import { DevnetProvider } from 'starknet-devnet';
const devnet = new DevnetProvider();
const accounts = await devnet.getPredeployedAccounts();
await devnet.mint(address, amount);
await devnet.createBlock();
```

---

## 5. Recommended Architecture for Kundera

### 3-Tier Testing Strategy

| Tier | Tool | Tests | When to add |
|------|------|-------|-------------|
| **1. Unit** | `vi.fn()` (existing) | Provider mechanics, retry, timeout, error handling | Already have |
| **2. RPC Fixtures** | MSW + recorded JSON | Full pipeline: request builder → HTTP → response → fromRpc → domain types | **Now** |
| **3. Devnet** | starknet-devnet-rs | Account ops, tx signing, state mutations, write operations | When account/tx flows exist |

### Tier 2: Record Once, Replay Forever

**Step 1: Record**
- Script hits mainnet for ~15 RPC methods
- Block/tx hashes hardcoded (mainnet is immutable)
- Saves raw `{jsonrpc, id, result}` envelopes as JSON files
- Committed to repo — deterministic, reviewable

**Step 2: Replay**
- MSW intercepts HttpProvider's fetch calls
- Matches on `body.method` (+ `body.params` for parameterized methods)
- Returns recorded fixture
- `onUnhandledRequest: 'error'` catches any unmatched calls

**Step 3: Test**
- Full pipeline: `provider.request(Rpc.XxxRequest(...))` → parse → assert
- Round-trip: `fromRpc(wire)` → `toRpc(rich)` → compare with original fixture
- Covers all 8 domain primitives against real Starknet data

### Methods to record (covers all primitives)

| Method | Primitive(s) tested |
|--------|-------------------|
| `starknet_getBlockWithTxHashes` | Block, BlockHeader |
| `starknet_getBlockWithTxs` | Block, Transaction |
| `starknet_getBlockWithReceipts` | Block, Receipt, Event |
| `starknet_getTransactionByHash` | Transaction (INVOKE_V3 + DECLARE) |
| `starknet_getTransactionReceipt` | Receipt, Event |
| `starknet_getStateUpdate` | StateUpdate |
| `starknet_estimateFee` | FeeEstimate |
| `starknet_traceTransaction` | Trace |
| `starknet_traceBlockTransactions` | Trace |
| `starknet_getEvents` | Event |
| `starknet_blockNumber` | Smoke test |
| `starknet_blockHashAndNumber` | Smoke test |
| `starknet_chainId` | Smoke test |
| `starknet_specVersion` | Smoke test |
| `starknet_getClassAt` | Contract class |

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Recorded fixtures** (recommended) | Fast, deterministic, CI-friendly, validates real data | Stale if spec changes (re-record) |
| **Live devnet** | Tests write ops, fresh data | Slow, Docker dependency, non-deterministic timing |
| **Live testnet** | Tests against real network | Flaky, slow, rate limits, not CI-friendly |
| **Hand-crafted mocks** (current) | Fast, simple | Risk of drift from real responses |

### Wallet RPC Testing

Ecosystem gap — nobody has solved this. Recommended approach:
- Mock `StarknetWindowObject` with `vi.fn()` implementing `{request({type, params})}`
- Return canned wallet responses
- Unit test territory, not integration
- The `type` vs `method` translation (SWO uses `type`, JSON-RPC uses `method`) is a skill-level concern

---

## 6. Key References

| Resource | URL |
|----------|-----|
| starknet.js repo | https://github.com/starknet-io/starknet.js |
| Voltaire repo | https://github.com/evmts/voltaire |
| viem repo | https://github.com/wevm/viem |
| starknet-devnet-rs | https://github.com/0xSpaceShard/starknet-devnet |
| starknet-devnet-js | https://github.com/0xSpaceShard/starknet-devnet-js |
| starknet-devnet docs | https://0xspaceshard.github.io/starknet-devnet/ |
| starknet-specs | https://github.com/starkware-libs/starknet-specs |
| MSW docs | https://mswjs.io/ |
| @viem/anvil | https://www.npmjs.com/package/@viem/anvil |
| wallet API spec | starkware-libs/starknet-specs/wallet-api/wallet_rpc.json |
