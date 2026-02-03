# Feedback - Utilisation de Kundera Effect

Ce document capture mes observations et retours en tant que premier utilisateur de la librairie kundera-effect pour créer une CLI Starknet.

## Session de travail

**Date**: 2026-02-03
**Objectif**: Créer une CLI "kdex" (à la manière de `cast` de Foundry) pour démontrer l'intégration de kundera-effect.

---

## Premières impressions

### Documentation

#### Points positifs
- [x] Documentation existante - README.md clair avec comparaison starknet.js
- [x] Documentation détaillée dans `docs/modules/` pour chaque module
- [x] Exemples de code dans la documentation
- [x] Types bien documentés avec les erreurs possibles

#### Points à améliorer
- [ ] **BUG CRITIQUE**: La documentation JSON-RPC a les paramètres dans le mauvais ordre!
  - Doc dit: `Rpc.starknet_getNonce(transport, blockId, address)`
  - Réalité: `Rpc.starknet_getNonce(transport, address, blockId)`
  - Même problème pour `starknet_getClassHashAt` et probablement d'autres
- [ ] Pas d'exemples de bout-en-bout (projet complet)
- [ ] Pas de guide "getting started" pour Node.js vs Bun

### Installation et Setup

#### Ce qui a bien marché
- Installation via workspace pnpm fonctionne bien
- Les imports subpath (`@kundera-sn/kundera-effect/jsonrpc`) fonctionnent

#### Problèmes rencontrés
1. **Import des primitives individuelles impossible**
   - J'ai essayé: `import * as ContractAddress from "@kundera-sn/kundera-effect/primitives/ContractAddress"`
   - Erreur: `ERR_PACKAGE_PATH_NOT_EXPORTED`
   - Solution: `import { ContractAddress } from "@kundera-sn/kundera-effect/primitives"`
   - **Suggestion**: Ajouter les exports subpath pour chaque primitive dans package.json

2. **httpTransport signature**
   - La doc dit `httpTransport({ url: "..." })`
   - Réalité: `httpTransport("url")` (string directement)
   - **Incohérence entre README et implémentation**

---

## Bugs et problèmes rencontrés

### BUG 1: Module WASM non partagé entre crypto et ABI (CORRIGÉ)

**Symptôme initial**:
```
ABI encoding error: Failed to parse ABI: Not implemented - call loadWasmCrypto() first or use Bun runtime
```

**Cause identifiée**:
Le module ABI importe `snKeccak` depuis `../crypto/index.js`, mais dans le contexte Node.js ESM avec pnpm workspaces, cela créait une instance séparée du module crypto. Le flag `wasmLoaded` n'était pas partagé entre les deux instances.

**Fix appliqué** dans `packages/kundera-ts/src/crypto/index.ts`:
```typescript
// Avant (bugué): variables de module locales
let wasmLoaded = false;

// Après (corrigé): singleton global via Symbol.for
const KUNDERA_CRYPTO_STATE = Symbol.for('kundera-crypto-state');
const state = (globalThis as any)[KUNDERA_CRYPTO_STATE] ??= {
  wasmLoaded: false,
  // ... autres états
};
```

**Résultat**: L'ABI encoding fonctionne maintenant après avoir appelé `loadWasmCrypto()` une fois au démarrage.

### BUG 2: Documentation RPC avec mauvais ordre de paramètres

**Fichier**: `packages/kundera-effect/docs/modules/jsonrpc.md`

**Exemples incorrects**:
```typescript
// Doc dit:
const nonce = yield* Rpc.starknet_getNonce(transport, blockId, address);

// Devrait être:
const nonce = yield* Rpc.starknet_getNonce(transport, address, blockId);
```

Même problème pour:
- `starknet_getClassHashAt`
- `starknet_getStorageAt` (probablement)

---

## Ce qui fonctionne bien

1. **Effect.gen pattern** - Très ergonomique pour enchaîner les opérations
2. **Typed errors** - `Effect.catchTag("RpcError", ...)` permet un error handling propre
3. **Branded types** - `ContractAddress.from()` valide et type correctement les adresses
4. **Transport abstraction** - Simple à créer et utiliser

---

## Suggestions d'amélioration

### Pour la documentation

1. **Synchroniser la doc avec l'implémentation** - Les signatures sont fausses
2. **Ajouter un exemple CLI complet** - Ce projet pourrait servir de base
3. **Documenter le WASM loading** - Expliquer quand c'est nécessaire et les limitations

### Pour l'API

1. **Exports subpath pour les primitives**
   ```json
   {
     "./primitives/ContractAddress": {
       "types": "./dist/primitives/ContractAddress/index.d.ts",
       "import": "./dist/primitives/ContractAddress/index.js"
     }
   }
   ```

2. **httpTransport API cohérente**
   - Décider entre `httpTransport(url)` ou `httpTransport({ url })`
   - Mettre à jour la doc en conséquence

3. **Fonction d'initialisation globale**
   ```typescript
   import { init } from "@kundera-sn/kundera-effect";
   await init(); // Charge WASM, initialise tous les modules
   ```

### Pour la structure du package

1. **Singleton pour l'état WASM** - Éviter les problèmes d'instances multiples
2. **Re-exporter les types RPC** - Actuellement il faut importer de `@kundera-sn/kundera-ts/jsonrpc` pour les types

---

## Score global

- **Clarté de la documentation**: 6/10 (présente mais avec erreurs)
- **Facilité d'intégration**: 5/10 (bugs WASM bloquants pour ABI)
- **Qualité des messages d'erreur**: 7/10 (clairs mais parfois trompeurs)
- **Expérience développeur globale**: 6/10

---

## Commandes kdex implémentées

| Commande | Status | Notes |
|----------|--------|-------|
| `kdex block-number` | ✅ | Fonctionne |
| `kdex chain-id` | ✅ | Fonctionne |
| `kdex block-hash` | ✅ | Fonctionne |
| `kdex block [id]` | ✅ | Fonctionne |
| `kdex balance <addr>` | ✅ | Sans ABI encoding (workaround) |
| `kdex nonce <addr>` | ✅ | Après fix ordre params |
| `kdex class-hash <addr>` | ✅ | Après fix ordre params |
| `kdex storage <addr> <key>` | ✅ | Fonctionne |
| `kdex tx <hash>` | ✅ | Fonctionne |
| `kdex tx-status <hash>` | ✅ | Fonctionne |
| `kdex tx-receipt <hash>` | ✅ | Fonctionne |

---

## Temps passé

- Setup initial: ~15 min
- Debugging imports: ~20 min
- Debugging WASM: ~30 min (abandonné, workaround)
- Debugging param order: ~10 min
- Total: ~1h15

Une grande partie du temps a été perdue sur des bugs qui auraient pu être évités avec une meilleure documentation et des tests d'intégration.
