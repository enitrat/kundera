# Feedback - Kundera Effect (point de vue expert Effect TS)

## Contexte

Objectif: construire un CLI type `cast` en s'appuyant d'abord sur `docs/effect/*`, puis valider par execution.
Implementation de reference: privilegier les requetes typees `JsonRpc.*` et limiter les appels endpoint string low-level.

## Ce qui est bien dans la librairie

1. Architecture service/layer pertinente pour Effect: separation `Provider`, `Contract`, `Signer`, `Nonce`, `FeeEstimator`.
2. `ContractRegistryService` est une tres bonne abstraction: composition DI propre, API de lecture agreable.
3. Usage des erreurs taggees (`RpcError`, `TransportError`, etc.) coherent avec les patterns Effect.
4. Presence de presets (`createHttpProvider`, `createHttpProviderWithBatch`) utile pour demarrer vite.
5. Modele "programmes purs + provide a la frontiere" adapte aux usages CLI/API.
6. Bonne granularite des services pour tests et substitution d'implementations.

## Ce qui est bien dans la documentation

1. La doc pousse les bons patterns Effect (`Effect.gen`, propagation d'erreurs, DI via layers).
2. Les pages services expliquent bien l'intention de chaque service.
3. La doc insiste sur `ContractRegistryService` comme voie recommandee (bon choix pour la maintenabilite).
4. Les exemples d'error handling donnent un cadre clair de gestion a la frontiere.
5. Couverture fonctionnelle large (services, modules, guides, primitives).

## Ce qui n'est pas bien (frictions majeures)

1. Incoherences d'API entre pages: memes concepts, noms differents selon la page.
2. Plusieurs exemples semblent obsoletes (imports/constructeurs) et ne correspondent pas toujours a la surface publiee.
3. Certains snippets melangent styles incompatibles (`ProviderService.getBlockNumber()` vs `provider.request(...)`).
4. Forme des params RPC pas uniforme dans les exemples (`params: []` vs objets imbriques).
5. Les guides `testing` / `react-integration` utilisent un vocabulaire de services different de la doc services principale.
6. Des exemples montrent des chemins d'import qui ne sont pas clairement couverts par les exports du package.
7. Le niveau d'abstraction est parfois flou: quand utiliser `JsonRpc` free functions vs `ProviderService` vs `ContractService`.
8. Peu de "recipes" CLI e2e read-only pretes a copier (block/tx/storage/balance) malgre une promesse "pragmatique".
9. Manque de matrice de compatibilite "doc snippet <-> API stable actuelle".
10. Les conventions de types d'entree (string vs primitive brandee) ne sont pas toujours explicites/constantes.

## Divergences doc <-> implementation observees

1. Doc: `Services.Contract.makeContractRegistry(...)` (Layer)  
   Runtime actuel: `Services.makeContractRegistry(...)` (Effect necessitant `ContractService`).
2. Doc: `Services.Presets.createHttpProvider(...)`  
   Runtime actuel: `Presets.createProvider(...)`.
3. Doc: `yield* Services.Provider.ProviderService` + `request({ method, params })`  
   Runtime actuel: `yield* Services.ProviderService` + `request(method, params, options?)`.
4. Doc: `contract.read.balanceOf(...)` (methodes generees)  
   Runtime actuel: `contract.read("balanceOf", args, options?)`.
5. Doc: plusieurs guides montrent `@kundera-sn/kundera-effect/services` avec API style `ProviderService.layer(...)`  
   Runtime actuel: surface principale exportee differemment (tags/layers nommes via `Services.*Live`, `Presets.*`).

## Impact concret observe pendant la creation du CLI

1. Il faut inferer certains appels RPC depuis Starknet JSON-RPC plutot que depuis une table canonique doc.
2. Pour un utilisateur externe, la probabilite d'ecrire un premier snippet non compilable est encore elevee.
3. La valeur d'Effect est bien visible conceptuellement, mais l'ergonomie d'onboarding est freinee par la coherence documentaire.

## Recommandations prioritaires

1. `P0` Publier une "API map" unique et versionnee:
   - Imports officiels
   - Layers officiels
   - Signatures canoniques
   - Snippets compiles/testes CI
2. `P0` Ajouter un guide "Build a cast-like CLI with kundera-effect" (read-only) base uniquement sur APIs stables.
3. `P0` Declarer une preference explicite: utiliser en priorite les requetes typees `JsonRpc.*` plutot que `provider.request("starknet_*", ...)`.
4. `P0` Positionner `provider.request(...)` comme escape hatch low-level uniquement, avec cas d'usage limites documentes.
5. `P0` Ajouter une table de mapping "typed request -> endpoint JSON-RPC -> params" pour eviter les appels string.
6. `P0` Exposer un module `Primitives` schema-first (`effect/Schema`) pour parser `string -> ContractAddress/StorageKey/Felt252/ClassHash` sans helpers custom app.
7. `P0` Documenter explicitement le pattern "Decode -> Use -> Provide" avec `ParseError` formate a la frontiere CLI/API.
8. `P1` Introduire une page "How to choose":
   - `JsonRpc` free functions
   - `ProviderService`
   - `ContractRegistryService`
   - `ContractService`
9. `P1` Mettre en place des tests docs (doctest/typecheck) pour eviter la derive des snippets.
10. `P2` Ajouter des "starter stacks" prets a l'emploi (read-only CLI, write CLI, watcher stream).

## Conclusion

Le socle architecturel Effect est bon et credible. Le principal levier d'amelioration est la coherence documentaire et la stabilisation de la "happy path" externe.
