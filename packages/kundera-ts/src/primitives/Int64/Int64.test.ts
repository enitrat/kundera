import { describe, expect, test } from "vitest";
import { Felt252 } from "../Felt252/index.js";
import { Int64 } from "./Int64.js";
import { MAX, MIN, PRIME } from "./constants.js";

describe("Int64", () => {
	describe("constants", () => {
		test("MIN is -2^63", () => {
			expect(MIN).toBe(-(2n ** 63n));
		});

		test("MAX is 2^63 - 1", () => {
			expect(MAX).toBe(2n ** 63n - 1n);
		});

		test("PRIME is correct Stark curve field prime", () => {
			const expected = 2n ** 251n + 17n * 2n ** 192n + 1n;
			expect(PRIME).toBe(expected);
		});
	});

	describe("from", () => {
		test("creates Int64 from positive bigint", () => {
			const value = Int64.from(9223372036854775807n);
			expect(Int64.toBigInt(value)).toBe(9223372036854775807n);
		});

		test("creates Int64 from zero", () => {
			const value = Int64.from(0n);
			expect(Int64.toBigInt(value)).toBe(0n);
		});

		test("creates Int64 from negative bigint", () => {
			const value = Int64.from(-9223372036854775808n);
			expect(Int64.toBigInt(value)).toBe(-9223372036854775808n);
		});

		test("creates Int64 from number (within safe integer range)", () => {
			const value = Int64.from(123456789);
			expect(Int64.toBigInt(value)).toBe(123456789n);
		});

		test("creates Int64 at MAX boundary", () => {
			const value = Int64.from(MAX);
			expect(Int64.toBigInt(value)).toBe(MAX);
		});

		test("creates Int64 at MIN boundary", () => {
			const value = Int64.from(MIN);
			expect(Int64.toBigInt(value)).toBe(MIN);
		});

		test("rejects value above MAX", () => {
			expect(() => Int64.from(MAX + 1n)).toThrow();
		});

		test("rejects value below MIN", () => {
			expect(() => Int64.from(MIN - 1n)).toThrow();
		});
	});

	describe("toFelt - Cairo field encoding", () => {
		test("positive value encodes directly", () => {
			const value = Int64.from(1000000000000n);
			const felt = Int64.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(1000000000000n);
		});

		test("zero encodes as zero", () => {
			const value = Int64.from(0n);
			const felt = Int64.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(0n);
		});

		test("MAX encodes directly", () => {
			const value = Int64.from(MAX);
			const felt = Int64.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(MAX);
		});

		test("-1 encodes as PRIME - 1", () => {
			const value = Int64.from(-1n);
			const felt = Int64.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(PRIME - 1n);
		});

		test("MIN encodes as PRIME + MIN", () => {
			const value = Int64.from(MIN);
			const felt = Int64.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(PRIME + MIN);
		});
	});

	describe("fromFelt - Cairo field decoding", () => {
		test("decodes positive felt to positive Int64", () => {
			const felt = Felt252.fromBigInt(1000000000000n);
			const value = Int64.fromFelt(felt);
			expect(Int64.toBigInt(value)).toBe(1000000000000n);
		});

		test("decodes PRIME - 1 to -1", () => {
			const felt = Felt252.fromBigInt(PRIME - 1n);
			const value = Int64.fromFelt(felt);
			expect(Int64.toBigInt(value)).toBe(-1n);
		});

		test("decodes PRIME + MIN to MIN", () => {
			const felt = Felt252.fromBigInt(PRIME + MIN);
			const value = Int64.fromFelt(felt);
			expect(Int64.toBigInt(value)).toBe(MIN);
		});
	});

	describe("toFelt/fromFelt roundtrip", () => {
		test("roundtrip for positive values", () => {
			const testValues = [0n, 1n, 1000000000000n, MAX - 1n, MAX];
			for (const expected of testValues) {
				const original = Int64.from(expected);
				const felt = Int64.toFelt(original);
				const decoded = Int64.fromFelt(felt);
				expect(Int64.toBigInt(decoded)).toBe(expected);
			}
		});

		test("roundtrip for negative values", () => {
			const testValues = [-1n, -1000000000000n, MIN + 1n, MIN];
			for (const expected of testValues) {
				const original = Int64.from(expected);
				const felt = Int64.toFelt(original);
				const decoded = Int64.fromFelt(felt);
				expect(Int64.toBigInt(decoded)).toBe(expected);
			}
		});
	});

	describe("utility functions", () => {
		test("isZero", () => {
			expect(Int64.isZero(Int64.from(0n))).toBe(true);
			expect(Int64.isZero(Int64.from(1n))).toBe(false);
		});

		test("isNegative", () => {
			expect(Int64.isNegative(Int64.from(-1n))).toBe(true);
			expect(Int64.isNegative(Int64.from(0n))).toBe(false);
		});

		test("isPositive", () => {
			expect(Int64.isPositive(Int64.from(1n))).toBe(true);
			expect(Int64.isPositive(Int64.from(0n))).toBe(false);
		});

		test("equals", () => {
			const big = 9000000000000000000n;
			expect(Int64.equals(Int64.from(big), Int64.from(big))).toBe(true);
			expect(Int64.equals(Int64.from(big), Int64.from(big + 1n))).toBe(false);
		});
	});

	describe("constants", () => {
		test("ZERO constant", () => {
			expect(Int64.toBigInt(Int64.ZERO)).toBe(0n);
		});

		test("ONE constant", () => {
			expect(Int64.toBigInt(Int64.ONE)).toBe(1n);
		});

		test("MIN constant", () => {
			expect(Int64.toBigInt(Int64.MIN)).toBe(MIN);
		});

		test("MAX constant", () => {
			expect(Int64.toBigInt(Int64.MAX)).toBe(MAX);
		});
	});
});
