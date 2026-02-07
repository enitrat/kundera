# PRD: Primitive Input Decoding & Typed Inputs Parity (Voltaire -> Kundera)

Date: February 7, 2026  
Owner: Kundera TS + Effect  
Status: Proposed

## 1. Contexte produit

Sur `kundera-effect`, les APIs `JsonRpc.*` pour les lectures Starknet attendent majoritairement des types brandes (`ContractAddressType`, `StorageKeyType`, `Felt252Type`, `ClassHashType`).

En pratique, un utilisateur externe part souvent de `string` (CLI args, env vars, JSON input) et doit aujourd'hui ecrire ses propres helpers de parsing pour convertir vers ces types (ex: `parseContractAddress` dans `examples/kundera-effect-cli/src/inputs.ts`).

Cela degrade l'onboarding et donne l'impression que la lib n'offre pas de "boundary decoding" officiel.

## 2. Probleme a resoudre

### Probleme principal

Eviter que les utilisateurs ecrivent des parseurs ad hoc pour des primitives Starknet courantes.

### Frictions observees

1. Repetition de logique de parsing dans les apps/CLI.
2. Incoherence ergonomique entre API compile-time type-safe et usage runtime.
3. Documentation Kundera Effect peu explicite sur la strategie "decode at boundaries".
4. Ecart avec Voltaire Effect, qui expose explicitement:
   - des schemas de decoding (`S.decodeSync(Address.Hex)(...)`)
   - des `*Input` unions (`AddressInput`, `HashInput`) pour accepter directement des hex strings.

## 3. Benchmark Voltaire (source d'inspiration)

## 3.1 Ce que Voltaire fait bien

### A) Decode explicite a la frontiere (docs)

Exemple docs Voltaire:

```ts
const addr = S.decodeSync(Address.Hex)("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
```

Sources:
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/getting-started.mdx`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/examples/schema-validation.mdx`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/snippets/decode-address.mdx`

### B) Inputs ergonomiques cote services

Voltaire accepte souvent:

```ts
type AddressInput = AddressType | `0x${string}`;
type HashInput = HashType | `0x${string}`;
```

Source:
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/services/Provider/types.ts`

### C) Normalisation des inputs

Voltaire convertit `AddressInput/HashInput` en hex via des helpers (`toAddressHex`, `toHashHex`).

Source:
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/services/Provider/utils.ts`

### D) Nuance importante

Dans Voltaire, l'acceptation des strings dans les services n'implique pas toujours une validation stricte runtime.  
La validation stricte est orientee "boundary decode" via Schema/constructeurs.

## 3.2 Ce que Kundera doit adapter (pas copier aveuglement)

Kundera est Starknet-first, donc les primitives cibles sont:
- `ContractAddress`
- `StorageKey`
- `Felt252`
- `ClassHash`

La strategie cible doit combiner:
1. Ergonomie d'entree (`*Input` unions).
2. Decode stricte officielle via `effect/Schema` (obligatoire).
3. Signature API coherente avec Effect.
4. Validation explicite en frontiere (pas de cast string implicite dans les parcours recommandes).

## 4. Objectifs produit

1. Permettre d'appeler les APIs JSON-RPC read avec des inputs string standardises (`0x...`) sans parseur custom utilisateur.
2. Exposer une voie officielle de decode stricte pour les frontieres (CLI/API HTTP).
3. Documenter clairement quand utiliser:
   - decode strict (`Schema` / constructors effect-wrapped)
   - input union ergonomique (`*Input`).
4. Garder la lisibilite des typed requests `Rpc.*Request` (pas de regression vers endpoint strings hardcodes).

## 5. Non-objectifs

1. Ne pas reimplementer les primitives cryptographiques deja presentes dans `kundera-ts`.
2. Ne pas changer les noms des methodes JSON-RPC Starknet.
3. Ne pas introduire de DSL contractuel additionnel.

## 6. Exigences fonctionnelles

### FR-1: Ajouter des `*Input` types publics dans `kundera-effect`

Ajouter des types d'entree ergonomiques:

```ts
export type ContractAddressInput = ContractAddressType | `0x${string}`;
export type StorageKeyInput = StorageKeyType | `0x${string}`;
export type Felt252Input = Felt252Type | `0x${string}`;
export type ClassHashInput = ClassHashType | `0x${string}`;
```

### FR-2: Ajouter des normalizers officiels

Helpers internes/publics pour convertir vers hex canonical pour RPC:

```ts
toContractAddressHex(input: ContractAddressInput): `0x${string}`;
toStorageKeyHex(input: StorageKeyInput): `0x${string}`;
toFelt252Hex(input: Felt252Input): `0x${string}`;
toClassHashHex(input: ClassHashInput): `0x${string}`;
```

Regle v1 (parite Voltaire):  
- parcours recommande: decoder d'abord avec les schemas (`decodeUnknown*`), puis normaliser via `.toHex()`.
- les APIs strictes ne doivent pas caster une `string` sans validation.
- si un parcours ergonomique accepte `string`, il doit passer par le decode schema et exposer `ParseError`.

### FR-3: Elargir les signatures `JsonRpc` cote Kundera Effect

Exemples:

Avant:

```ts
getNonce(contractAddress: ContractAddressType, blockId?: BlockId)
getStorageAt(contractAddress: ContractAddressType, key: StorageKeyType, blockId?: BlockId)
getTransactionByHash(txHash: Felt252Type)
```

Apres:

```ts
getNonce(contractAddress: ContractAddressInput, blockId?: BlockId)
getStorageAt(contractAddress: ContractAddressInput, key: StorageKeyInput, blockId?: BlockId)
getTransactionByHash(txHash: Felt252Input)
```

### FR-4: Exposer decode strict officiel via schemas (obligatoire)

Ajouter un module primitives Effect avec codecs `effect/Schema` pour le decoding explicite de boundary:

```ts
S.decodeSync(Primitives.ContractAddress.Hex)(input)
S.decodeSync(Primitives.StorageKey.Hex)(input)
S.decode(Primitives.Felt252.Hex)(input)
S.decode(Primitives.ClassHash.Hex)(input)
```

Chaque schema doit:
1. decoder `string -> type branded` en reutilisant les constructeurs `kundera-ts`;
2. encoder `type branded -> hex string` via `.toHex()`;
3. exposer des erreurs de parse coherentes (`ParseError` Schema).

Note: l'impl doit reutiliser `kundera-ts` (constructeurs existants), pas dupliquer la logique metier.

### FR-5: Documentation officielle "Decode -> Use"

Ajouter un guide qui montre:
1. mode ergonomique (string input direct)
2. mode strict (decode boundary + branded types internes)
3. recommandation explicite: "decode strict en bordure pour UX d'erreur propre".

### FR-6: Helpers derives des schemas

Exposer des helpers data-first adosses aux schemas pour les parcours ergonomiques:

```ts
Primitives.decodeContractAddress(input) // Effect<ContractAddressType, ParseError>
Primitives.decodeStorageKey(input)      // Effect<StorageKeyType, ParseError>
Primitives.decodeFelt252(input)         // Effect<Felt252Type, ParseError>
Primitives.decodeClassHash(input)       // Effect<ClassHashType, ParseError>
```

### FR-7: Mettre a jour l'exemple CLI de demo

Retirer le parsing custom local et utiliser la voie officielle de la lib (mode ergonomique ou strict selon section du guide).

### FR-8: Regle de securite DX

Interdire les chemins publics recommandes qui font:
- `input as \`0x\${string}\``
- ou toute conversion string -> primitive sans decode schema.

Objectif: garantir que "input utilisateur" implique toujours validation explicite.

## 7. Design API propose (Kundera)

## 7.1 Mapping Voltaire -> Kundera

| Concept Voltaire | Kundera cible |
|---|---|
| `AddressInput` | `ContractAddressInput` |
| `HashInput` | `Felt252Input` / `StorageKeyInput` / `ClassHashInput` selon methode |
| `toAddressHex` | `toContractAddressHex` |
| `S.decodeSync(Address.Hex)` | `S.decodeSync(Primitives.ContractAddress.Hex)` |
| `Decode -> Use` docs pattern | `Decode -> JsonRpc.*` docs pattern |

## 7.2 Exemple d'adaptation explicite

### Exemple Voltaire (docs)

```ts
const addr = S.decodeSync(Address.Hex)("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const balance = yield* getBalance(addr, "latest");
```

### Equivalent cible Kundera

```ts
import * as S from "effect/Schema";
import { JsonRpc, Primitives } from "@kundera-sn/kundera-effect";

const account = S.decodeSync(Primitives.ContractAddress.Hex)(
  "0x0123..."
);

const nonce = yield* JsonRpc.getNonce(account, "latest");
```

### Variante ergonomique cible Kundera

```ts
const nonce = yield* JsonRpc.getNonce("0x0123...", "latest");
```

## 8. Impact technique attendu

### Modules a modifier (minimum)

1. `packages/kundera-effect/src/jsonrpc/index.ts`
2. `packages/kundera-effect/src/index.ts` (exports)
3. `packages/kundera-effect/src/jsonrpc/__tests__/index.test.ts`
4. `packages/kundera-effect/docs/index.mdx` + nouvelle page guide inputs/decode
5. `examples/kundera-effect-cli/src/*` (suppression parsing custom local)

### Modules a ajouter (proposes)

1. `packages/kundera-effect/src/primitives/index.ts`
2. `packages/kundera-effect/src/primitives/inputs.ts`
3. `packages/kundera-effect/src/primitives/schema/*` (obligatoire)
4. `packages/kundera-effect/src/primitives/decode.ts`
5. `packages/kundera-effect/src/primitives/format.ts` (formatage `ParseError` pour UX CLI/API)

## 9. Compatibilite & versioning

Proposition: **minor release** si implementation additive:
- elargissement de types en parametre (acceptation string en plus des branded types)
- nouveaux exports `primitives`
- aucune suppression/renommage.

Risque semver:
- Si la signature des erreurs `Effect<E>` est elargie sur les fonctions existantes, verifier impact DX.
- Recommandation v1: conserver le channel d'erreur actuel des wrappers JSON-RPC (parite Voltaire service ergonomique), et fournir decode strict via API dediee.

## 10. Plan d'implementation (ordre recommande)

### Phase 1: Ergonomie inputs (P0)

1. Ajouter types `*Input` + normalizers.
2. Elargir signatures `JsonRpc`.
3. Ajouter tests d'acceptation string + branded.

Acceptance:
- `JsonRpc.getNonce("0x...")` compile et envoie params corrects.
- les appels existants avec branded types restent inchanges.

### Phase 2: Schema layer primitive (P0)

1. Ajouter module `Primitives` schema-first (`Hex` codecs).
2. Documenter pattern boundary decode.
3. Ajouter tests decode success/failure.

Acceptance:
- un utilisateur peut supprimer ses parseurs custom et utiliser `S.decode(Primitives.*.Hex)` officiel.
- les helpers `Primitives.decode*` reposent sur les schemas (pas de voie parallele).
- aucun helper public recommande ne fait de passthrough string non validee.

### Phase 3: Documentation + CLI demo (P0)

1. Nouveau guide "Inputs ergonomiques vs decode strict".
2. Adapter `examples/kundera-effect-cli` pour ne plus definir de parse helpers custom metier.
3. Ajouter section "typed request preference" (rester sur `JsonRpc.*`).

Acceptance:
- le CLI compile et execute en mode read-only.
- la doc montre les deux parcours (strict/ergonomique) et le trade-off.

## 11. Plan de test

1. Unit tests `jsonrpc`:
   - string input -> params RPC corrects
   - branded input -> params RPC corrects
2. Unit tests primitives decode:
   - hex valide -> type branded
   - hex invalide -> erreur attendue
3. Type tests:
   - inference correcte des `*Input`
4. Doc examples:
   - snippets typecheck en CI (recommande)
5. Error UX tests:
   - `ParseError` -> message TreeFormatter stable
   - mode debug -> ArrayFormatter (path + message)

## 12. Risques et mitigations

1. Risque: confusion "string acceptee = toujours valide".
   - Mitigation: doc explicite sur decode strict recommande en frontiere.
2. Risque: derive entre doc et API reelle.
   - Mitigation: snippets testes en CI.
3. Risque: duplication logique entre kundera-ts et kundera-effect.
   - Mitigation: reexport/wrapping uniquement, zero reimplementation metier.
4. Risque: divergence avec Voltaire sur l'acceptation implicite de strings.
   - Mitigation: expliciter la decision: Kundera privilegie validation stricte des inputs utilisateurs.

## 13. Critere de succes produit

1. Un exemple CLI read-only complet ne contient plus de parse helpers metier custom.
2. Les nouveaux utilisateurs peuvent:
   - soit passer des strings directement
   - soit decoder explicitement avec API officielle
   sans ecrire leurs propres parseurs.
3. Les docs expliquent clairement quand utiliser chaque mode.
4. Les exemples officiels montrent `decode -> typed JsonRpc` comme happy path.

## 15. Strategy detaillee (Effect best practices)

Le detail d'implementation "schema-first + boundary validation" est documente ici:
- `thoughts/shared/plans/effect-input-validation-strategy.md`

## 14. References exactes utilisees

Voltaire docs:
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/getting-started.mdx`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/examples/schema-validation.mdx`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/snippets/decode-address.mdx`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/docs/cheatsheet.mdx`

Voltaire implementation:
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/services/Provider/types.ts`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/services/Provider/utils.ts`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/services/Provider/functions/getBalance.ts`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/primitives/Address/Hex.ts`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/primitives/Address/from.ts`
- `/Users/msaug/workspace/voltaire/packages/voltaire-effect/src/primitives/Address/index.ts`

Kundera baseline:
- `packages/kundera-effect/src/jsonrpc/index.ts`
- `examples/kundera-effect-cli/src/inputs.ts`

Effect docs (best practices utilisees):
- `https://effect.website/docs/schema/introduction/`
- `https://effect.website/docs/schema/getting-started/`
- `https://effect.website/docs/schema/transformations/`
- `https://effect.website/docs/schema/error-formatters/`
- `https://effect.website/docs/schema/annotations/`
- `https://effect.website/docs/error-management/expected-errors/`
