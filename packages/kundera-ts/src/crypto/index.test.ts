/**
 * Crypto Module Export Tests
 *
 * Verifies that the public API exports the correct functions.
 * Actual crypto correctness is tested in backend-specific test files.
 */

import { describe, expect, test } from "vitest";
import {
	Felt,
	Pedersen,
	Poseidon,
	StarkCurve,
	feltAdd,
	feltDiv,
	feltInverse,
	feltMul,
	feltNeg,
	feltPow,
	feltSqrt,
	feltSub,
	getPublicKey,
	pedersenHash,
	poseidonHash,
	poseidonHashMany,
	recover,
	sign,
	verify,
} from "./index";

describe("Namespace exports", () => {
	test("Pedersen namespace has hash", () => {
		expect(Pedersen.hash).toBe(pedersenHash);
	});

	test("Poseidon namespace has hash and hashMany", () => {
		expect(Poseidon.hash).toBe(poseidonHash);
		expect(Poseidon.hashMany).toBe(poseidonHashMany);
	});

	test("StarkCurve namespace has sign, verify, getPublicKey, recover", () => {
		expect(StarkCurve.sign).toBe(sign);
		expect(StarkCurve.verify).toBe(verify);
		expect(StarkCurve.getPublicKey).toBe(getPublicKey);
		expect(StarkCurve.recover).toBe(recover);
	});

	test("Felt namespace has all arithmetic operations", () => {
		expect(Felt.add).toBe(feltAdd);
		expect(Felt.sub).toBe(feltSub);
		expect(Felt.mul).toBe(feltMul);
		expect(Felt.div).toBe(feltDiv);
		expect(Felt.neg).toBe(feltNeg);
		expect(Felt.inverse).toBe(feltInverse);
		expect(Felt.pow).toBe(feltPow);
		expect(Felt.sqrt).toBe(feltSqrt);
	});
});
