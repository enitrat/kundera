import { describe, expect, test } from "vitest";
import { Int16 } from "./Int16.js";
import { MIN, MAX, PRIME } from "./constants.js";
import { Felt252 } from "../Felt252/index.js";

describe("Int16", () => {
	describe("constants", () => {
		test("MIN is -32768", () => {
			expect(MIN).toBe(-32768n);
		});

		test("MAX is 32767", () => {
			expect(MAX).toBe(32767n);
		});

		test("PRIME is correct Stark curve field prime", () => {
			const expected = 2n ** 251n + 17n * 2n ** 192n + 1n;
			expect(PRIME).toBe(expected);
		});
	});

	describe("from", () => {
		test("creates Int16 from positive bigint", () => {
			const value = Int16.from(1000n);
			expect(Int16.toBigInt(value)).toBe(1000n);
		});

		test("creates Int16 from zero", () => {
			const value = Int16.from(0n);
			expect(Int16.toBigInt(value)).toBe(0n);
		});

		test("creates Int16 from negative bigint", () => {
			const value = Int16.from(-1000n);
			expect(Int16.toBigInt(value)).toBe(-1000n);
		});

		test("creates Int16 from number", () => {
			const value = Int16.from(12345);
			expect(Int16.toBigInt(value)).toBe(12345n);
		});

		test("creates Int16 from negative number", () => {
			const value = Int16.from(-12345);
			expect(Int16.toBigInt(value)).toBe(-12345n);
		});

		test("creates Int16 at MAX boundary (32767)", () => {
			const value = Int16.from(MAX);
			expect(Int16.toBigInt(value)).toBe(32767n);
		});

		test("creates Int16 at MIN boundary (-32768)", () => {
			const value = Int16.from(MIN);
			expect(Int16.toBigInt(value)).toBe(-32768n);
		});

		test("rejects value above MAX (32768)", () => {
			expect(() => Int16.from(32768n)).toThrow();
		});

		test("rejects value below MIN (-32769)", () => {
			expect(() => Int16.from(-32769n)).toThrow();
		});
	});

	describe("toFelt - Cairo field encoding", () => {
		test("positive value encodes directly", () => {
			const value = Int16.from(1000n);
			const felt = Int16.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(1000n);
		});

		test("zero encodes as zero", () => {
			const value = Int16.from(0n);
			const felt = Int16.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(0n);
		});

		test("MAX (32767) encodes directly", () => {
			const value = Int16.from(MAX);
			const felt = Int16.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(32767n);
		});

		test("-1 encodes as PRIME - 1", () => {
			const value = Int16.from(-1n);
			const felt = Int16.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(PRIME - 1n);
		});

		test("MIN (-32768) encodes as PRIME - 32768", () => {
			const value = Int16.from(MIN);
			const felt = Int16.toFelt(value);
			expect(Felt252.toBigInt(felt)).toBe(PRIME - 32768n);
		});
	});

	describe("fromFelt - Cairo field decoding", () => {
		test("decodes positive felt to positive Int16", () => {
			const felt = Felt252.fromBigInt(1000n);
			const value = Int16.fromFelt(felt);
			expect(Int16.toBigInt(value)).toBe(1000n);
		});

		test("decodes PRIME - 1 to -1", () => {
			const felt = Felt252.fromBigInt(PRIME - 1n);
			const value = Int16.fromFelt(felt);
			expect(Int16.toBigInt(value)).toBe(-1n);
		});

		test("decodes PRIME - 32768 to MIN", () => {
			const felt = Felt252.fromBigInt(PRIME - 32768n);
			const value = Int16.fromFelt(felt);
			expect(Int16.toBigInt(value)).toBe(-32768n);
		});
	});

	describe("toFelt/fromFelt roundtrip", () => {
		test("roundtrip for positive values", () => {
			const testValues = [0n, 1n, 1000n, 32766n, 32767n];
			for (const expected of testValues) {
				const original = Int16.from(expected);
				const felt = Int16.toFelt(original);
				const decoded = Int16.fromFelt(felt);
				expect(Int16.toBigInt(decoded)).toBe(expected);
			}
		});

		test("roundtrip for negative values", () => {
			const testValues = [-1n, -1000n, -32767n, -32768n];
			for (const expected of testValues) {
				const original = Int16.from(expected);
				const felt = Int16.toFelt(original);
				const decoded = Int16.fromFelt(felt);
				expect(Int16.toBigInt(decoded)).toBe(expected);
			}
		});
	});

	describe("utility functions", () => {
		test("isZero", () => {
			expect(Int16.isZero(Int16.from(0n))).toBe(true);
			expect(Int16.isZero(Int16.from(1n))).toBe(false);
		});

		test("isNegative", () => {
			expect(Int16.isNegative(Int16.from(-1n))).toBe(true);
			expect(Int16.isNegative(Int16.from(0n))).toBe(false);
		});

		test("isPositive", () => {
			expect(Int16.isPositive(Int16.from(1n))).toBe(true);
			expect(Int16.isPositive(Int16.from(0n))).toBe(false);
		});

		test("equals", () => {
			expect(Int16.equals(Int16.from(1000n), Int16.from(1000n))).toBe(true);
			expect(Int16.equals(Int16.from(1000n), Int16.from(1001n))).toBe(false);
		});
	});

	describe("constants", () => {
		test("ZERO constant", () => {
			expect(Int16.toBigInt(Int16.ZERO)).toBe(0n);
		});

		test("ONE constant", () => {
			expect(Int16.toBigInt(Int16.ONE)).toBe(1n);
		});

		test("MIN constant", () => {
			expect(Int16.toBigInt(Int16.MIN)).toBe(-32768n);
		});

		test("MAX constant", () => {
			expect(Int16.toBigInt(Int16.MAX)).toBe(32767n);
		});
	});
});
