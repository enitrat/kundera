/**
 * Felt Arithmetic Functions
 */

import type { Felt252Type } from "../primitives/index.js";
import { withCrypto } from "./helpers.js";

/**
 * Add two felts (a + b mod P)
 */
export const feltAdd = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
	native: (n, a, b) => n.feltAdd(a, b),
	wasm: (w, a, b) => w.wasmFeltAdd(a, b),
});

/**
 * Subtract two felts (a - b mod P)
 */
export const feltSub = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
	native: (n, a, b) => n.feltSub(a, b),
	wasm: (w, a, b) => w.wasmFeltSub(a, b),
});

/**
 * Multiply two felts (a * b mod P)
 */
export const feltMul = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
	native: (n, a, b) => n.feltMul(a, b),
	wasm: (w, a, b) => w.wasmFeltMul(a, b),
});

/**
 * Divide two felts (a / b mod P)
 */
export const feltDiv = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
	native: (n, a, b) => n.feltDiv(a, b),
	wasm: (w, a, b) => w.wasmFeltDiv(a, b),
});

/**
 * Negate a felt (-a mod P)
 */
export const feltNeg = withCrypto<[Felt252Type], Felt252Type>({
	native: (n, a) => n.feltNeg(a),
	wasm: (w, a) => w.wasmFeltNeg(a),
});

/**
 * Multiplicative inverse (1/a mod P)
 */
export const feltInverse = withCrypto<[Felt252Type], Felt252Type>({
	native: (n, a) => n.feltInverse(a),
	wasm: (w, a) => w.wasmFeltInverse(a),
});

/**
 * Power (base^exp mod P)
 */
export const feltPow = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
	native: (n, base, exp) => n.feltPow(base, exp),
	wasm: (w, base, exp) => w.wasmFeltPow(base, exp),
});

/**
 * Square root (returns sqrt if exists)
 */
export const feltSqrt = withCrypto<[Felt252Type], Felt252Type>({
	native: (n, a) => n.feltSqrt(a),
	wasm: (w, a) => w.wasmFeltSqrt(a),
});
