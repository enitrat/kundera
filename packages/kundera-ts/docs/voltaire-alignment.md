# Alignement Kundera ↔ Voltaire (TS + Effect)

## Portee
- Ce rapport compare uniquement les packages TypeScript et Effect.
- Sources inspectees:
- Voltaire TS: `packages/voltaire-ts`
- Voltaire Effect: `packages/voltaire-effect`
- Kundera TS: `packages/kundera-ts`
- Kundera Effect: `packages/kundera-effect`
- Les couches Zig/Rust/Python ne sont pas traitees.

## Resume executif (deltas majeurs)
- Voltaire TS est structure autour d’un `provider/` EIP-1193 type-safe + schemas JSON-RPC generes + `utils/` reusables.
- Kundera TS expose `jsonrpc/` et `transport/`, mais n’a pas de `provider/` ni de schemas type-safe type `RpcSchema`.
- Voltaire Effect expose une vraie couche `services/` (Transport/Provider/Account/Contract/Cache/Batch/Stream, etc.).
- Kundera Effect est un thin wrapper Effect des modules Kundera (primitives/crypto/serde/transport/jsonrpc), sans services.

## Architecture comparee (TS)

### 1) Provider
**Voltaire**
- Entree: `packages/voltaire-ts/src/provider/index.ts`.
- Expose `HttpProvider`, `WebSocketProvider`, `InMemoryProvider`, `ForkProvider`, `TypedProvider`, schemas et events. Exemple:

```ts
// packages/voltaire-ts/src/provider/index.ts
export { HttpProvider } from "./HttpProvider.js";
export { WebSocketProvider } from "./WebSocketProvider.js";
export type { EIP1193Provider, TypedProvider } from "./TypedProvider.js";
export type { VoltaireRpcSchema } from "./schemas/index.js";
```

- Interface type-safe: `packages/voltaire-ts/src/provider/TypedProvider.ts`.

**Kundera**
- Aucun `provider/` dans `packages/kundera-ts/src`.
- La couche haute-niveau est absente; seules les fonctions JSON-RPC/transport existent.

**Impact**
- Absence de point d’entree unifie pour requests, events, batching et schemas.
- Migration future requiert la creation d’un `provider/` Starknet.

### 2) JSON-RPC (schemas + builders)
**Voltaire**
- Index: `packages/voltaire-ts/src/jsonrpc/index.ts`.
- Expose namespaces `eth/debug/engine/...` + un namespace `Rpc` de builders.
- Schemas: `packages/voltaire-ts/src/provider/schemas/VoltaireRpcSchema.ts` fournit un tableau type-safe `Method/Parameters/ReturnType`.

Exemple (schema):
```ts
// packages/voltaire-ts/src/provider/schemas/VoltaireRpcSchema.ts
export type VoltaireRpcSchema = readonly [
  { Method: "eth_blockNumber"; Parameters: []; ReturnType: string },
  { Method: "eth_getBlockByNumber"; Parameters: [string, boolean]; ReturnType: BlockType | null },
  // ...
]
```

**Kundera**
- Index: `packages/kundera-ts/src/jsonrpc/index.ts` expose `methods/` et des types.
- Namespace `Rpc` est un simple re-export de fonctions:

```ts
// packages/kundera-ts/src/jsonrpc/namespace.ts
export * from './methods/index.js';
```

**Impact**
- Pas de schema central type-safe qui aligne provider et méthodes.
- Pas de builders de requests standardises type `Rpc.*Request`.

### 3) Transport
**Voltaire TS**
- Le transport est integre a la couche provider, pas expose comme module principal autonome.

**Kundera TS**
- Module dedie `packages/kundera-ts/src/transport/index.ts` (http + ws + helpers de batch/erreurs).
- Exemple:

```ts
// packages/kundera-ts/src/transport/index.ts
export { httpTransport } from './http.js';
export { webSocketTransport } from './websocket.js';
export { createRequest, matchBatchResponses } from './types.js';
```

**Impact**
- La structure transport est utile, mais il manque le niveau Provider (request + events + schemas).

### 4) Exports publics (package.json)
**Voltaire TS**
- Exports riches: `./provider`, `./utils`, `./jsonrpc`, `./block`, `./transaction`, `./stream`, primitives, crypto, etc.
- Voir: `packages/voltaire-ts/package.json`.

**Kundera TS**
- Exports actuels: `./jsonrpc`, `./abi`, `./transport`, `./serde`, `./crypto`, primitives principales.
- Pas de `./provider`, `./utils`, ni de modules hauts niveaux.

## Architecture comparee (Effect)

### 1) Services
**Voltaire Effect**
- Dossier `packages/voltaire-effect/src/services/` large et structure:
- Transport: `services/Transport/*` (config, rate limiting, batch scheduler, fallback, interceptors).
- Provider: `services/Provider/*` (actions, ens helpers, exec plan, etc.).
- RpcBatch, Cache, Account, Contract, BlockStream, TransactionStream, etc.
- Entree: `packages/voltaire-effect/src/services/index.ts`.

**Kundera Effect**
- Pas de dossier `services/`.
- L’index `packages/kundera-effect/src/index.ts` re-exporte des wrappers `Abi/Primitives/Crypto/Serde/Transport/JsonRpc`.

**Impact**
- La couche Effect ne propose pas encore de services composables (DI/layers/presets) alignes a Voltaire.

### 2) JSON-RPC wrapper
**Kundera Effect**
- `packages/kundera-effect/src/jsonrpc/index.ts` wrappe chaque methode en `Effect.tryPromise`.
- Pas d’integration avec un provider schema-driven, ni batching.

**Voltaire Effect**
- JSON-RPC et Provider sont relies via services (Transport + Provider + RpcBatch).

## Divergences concretes (exemples)

### Provider inexistant (Kundera TS)
- Voltaire: `packages/voltaire-ts/src/provider/index.ts` expose `HttpProvider`, `WebSocketProvider`, `TypedProvider`.
- Kundera: aucun module `packages/kundera-ts/src/provider/*`.

### Schema JSON-RPC central
- Voltaire: `packages/voltaire-ts/src/provider/schemas/VoltaireRpcSchema.ts`.
- Kundera: types disperses dans `packages/kundera-ts/src/jsonrpc/types.ts`, pas de `RpcSchema` global.

### Effect services
- Voltaire: `packages/voltaire-effect/src/services/Transport/*`, `.../Provider/*`, `.../RpcBatch/*`.
- Kundera: pas de `packages/kundera-effect/src/services`.

### Exports
- Voltaire TS: expose `./provider` et `./utils`.
- Kundera TS: pas de `./provider` ni `./utils`.

## Recommandations de transition (alignees roadmap)

### Phase 1: Provider (TS)
- Creer `packages/kundera-ts/src/provider/` avec `Provider.ts`, `TypedProvider.ts`, `HttpProvider.ts`, `WebSocketProvider.ts`.
- Utiliser l’API transport existante pour implementer `request()`.
- Ajouter `./provider` dans `packages/kundera-ts/package.json`.

### Phase 2: JSON-RPC schemas + builders
- Introduire `packages/kundera-ts/src/provider/schemas/StarknetRpcSchema.ts` avec `Method/Parameters/ReturnType`.
- Creer un namespace `Rpc` (constructeurs de requests) sur le modele Voltaire.
- Brancher `TypedProvider<StarknetRpcSchema>`.

### Phase 3: Utils
- Ajouter `packages/kundera-ts/src/utils/` (retry, poll, batch, timeout, rateLimit) si necessaire.
- Exporter `./utils`.

### Phase 4: Effect services
- Creer `packages/kundera-effect/src/services/`.
- Priorites minimales:
- `Transport` (service + live layer)
- `Provider` (actions Starknet read/write)
- `RpcBatch` (batching + resolver)
- Optionnel: `Cache`, `RateLimiter`, `Account`.

### Phase 5: Tests + docs
- Ajouter tests unitaires pour provider, schemas, batching.
- Ajouter tests d’integration simples (ex: provider + jsonrpc sur devnet).
- Mettre a jour `packages/kundera-effect/docs/*` et `packages/kundera-ts/docs/api/*`.

## Notes d’alignement specifique Starknet
- Le provider Starknet ne sera pas EIP-1193, mais peut repliquer l’interface `request({ method, params })` + `on/removeListener`.
- Les transports web socket peuvent exposer `subscribe/unsubscribe` conformes a `starknet_subscribe*`.
- Les schemas Starknet doivent couvrir `starknet_*` + namespaces additionnels si necessaire.

## Next steps proposes
1. Valider la surface d’API du futur `provider` Starknet (request + events + batching minimal).
2. Lister les methodes `starknet_*` a integrer dans `StarknetRpcSchema`.
3. Prioriser quels services Effect sont essentiels pour la V1 (Transport/Provider/RpcBatch).
