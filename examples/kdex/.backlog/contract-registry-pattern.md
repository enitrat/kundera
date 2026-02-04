# ContractRegistry Pattern

## Problem

Current pattern requires creating contract instances inside Effect.gen:

```typescript
const program = Effect.gen(function* () {
  const tokenContract = yield* Services.Contract.Contract(tokenAddress, ERC20_ABI);
  const balance = yield* tokenContract.read.balanceOf(accountAddress);
});
```

This makes it awkward to:
- Pre-register known contracts in a Layer
- Provide a single `Effect.provide(AppLayer)` at the end
- Have typed access to multiple contracts without nested yields

## Proposed Pattern

```typescript
const Contracts = makeContractRegistry({
  USDC: { abi: erc20Abi, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  WETH: { abi: erc20Abi, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
})

// Compose layers first
const AppLayer = Contracts.pipe(
  Layer.provide(HttpProvider('https://eth.llamarpc.com'))
)

const program = Effect.gen(function* () {
  const { USDC, WETH } = yield* ContractRegistryService
  const usdcBalance = yield* USDC.read.balanceOf(userAddress)
  const wethBalance = yield* WETH.read.balanceOf(userAddress)
  return { usdcBalance, wethBalance }
}).pipe(
  Effect.retry({ times: 3 }),           // explicit retry policy
  Effect.timeout('10 seconds'),         // explicit timeout
  Effect.provide(AppLayer)              // single provide
)

const { usdcBalance, wethBalance } = await Effect.runPromise(program)
```

## Benefits

1. **Single Layer composition** - All contracts registered upfront
2. **Typed registry access** - `{ USDC, WETH }` fully typed from ABI
3. **Clean Effect.gen** - No nested `yield* Contract(...)` calls
4. **Policy composition** - Retry/timeout at program level, not per-call

## Implementation Notes

- Need a `makeContractRegistry<T extends Record<string, ContractConfig>>()` factory
- Returns a Layer that provides `ContractRegistryService`
- Registry service exposes typed contract instances
- Contract instances are created lazily or eagerly at layer creation

## Related

- Current `ContractFactory` in `packages/kundera-effect/src/services/Contract/ContractFactory.ts`
- Effect.Service pattern for the registry service
