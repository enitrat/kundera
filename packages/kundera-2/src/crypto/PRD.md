# PRD — Crypto Primitives (Pedersen & Poseidon)

## Purpose
Provide minimal, deterministic cryptographic primitives required by Starknet: Pedersen and Poseidon hashes. The implementation should use the same underlying library as `starknet.js` to ensure compatibility, while exposing a small, composable API consistent with Kundera‑2’s primitives‑first philosophy.

## Goals
- Expose Pedersen and Poseidon hash functions as pure, tree‑shakeable utilities.
- Use the same underlying crypto library as `starknet.js` for compatibility.
- Return `Felt252`‑compatible outputs for downstream ABI/Serde usage.
- Keep the API minimal and framework‑agnostic.

## Non‑Goals
- No signing, key generation, or account logic.
- No merkle trees, commitments, or proof systems.
- No WASM or native bindings.

## Scope
Core primitives to expose (names can mirror `starknet.js` for familiarity):
- `computePedersenHash(a, b)`
- `computePedersenHashOnElements(values)` (a.k.a. `hashOnElements`)
- `computePoseidonHash(a, b)`
- `computePoseidonHashOnElements(values)`
Also include selector hash:
- `starknetKeccak(data)` (a.k.a. `sn_keccak`)

Inputs accept **only internal Cairo types** (`Felt252`, `CairoValue`, or `CairoValue[]`). No `BigNumberish` inputs. When a complex Cairo value is provided, it is serialized via `serde` into `felt[]`, then hashed; primitive `Felt252` inputs are passed directly. Outputs are `Felt252` (branded bigint) to remain consistent with primitives and ABI runtime.

## Design Notes
- Use the same crypto implementation as `starknet.js` (currently `@scure/starknet`) to avoid divergence in hash results.
- Keep the module purely functional; no classes or state.
- Provide a single export surface under `crypto/` and re‑export from root `index.ts` if approved.

## File Structure
```
crypto/
├── index.ts        # Re-exports
├── pedersen.ts     # pedersen hash + hashOnElements
├── poseidon.ts     # poseidon hash + hashOnElements
├── keccak.ts       # sn_keccak
├── types.ts        # CairoValue input types (re-export or local alias)
└── errors.ts       # (optional) CryptoError or reuse errors module
```

## Dependencies
- `@scure/starknet` (same as `starknet.js`).
- `primitives` for `Felt252` branding.
- `serde` for `CairoValue -> felt[]` serialization (input normalization).
- `errors` module if we decide to throw typed errors (e.g. `KunderaError` with `CRYPTO_INVALID_INPUT`).

## Pitfalls & Mitigations
- Input normalization (CairoValue -> felt[]) must be explicit to avoid silent mismatch.
- Keep output stable and deterministic; no implicit formatting.
- Avoid leaking implementation‑specific types from the underlying library.

## Open Questions
- Should we expose hex output helpers or require consumers to call `toHex` from primitives?
