import { describe, it, expect } from "vitest";
import { Uint64, MIN, MAX, SIZE } from "./index.js";

describe("Uint64", () => {
	describe("constants", () => {
		it("should have correct MIN value", () => {
			expect(MIN).toBe(0n);
		});

		it("should have correct MAX value", () => {
			expect(MAX).toBe(18446744073709551615n);
		});

		it("should have correct SIZE in bits", () => {
			expect(SIZE).toBe(64);
		});
	});

	describe("from", () => {
		it("should create from bigint", () => {
			const value = Uint64.from(1000000000000n);
			expect(Uint64.toBigInt(value)).toBe(1000000000000n);
		});

		it("should create from number", () => {
			const value = Uint64.from(1000000);
			expect(Uint64.toBigInt(value)).toBe(1000000n);
		});

		it("should create from decimal string", () => {
			const value = Uint64.from("1000000000000");
			expect(Uint64.toBigInt(value)).toBe(1000000000000n);
		});

		it("should create from hex string", () => {
			const value = Uint64.from("0xffffffffffffffff");
			expect(Uint64.toBigInt(value)).toBe(18446744073709551615n);
		});

		it("should create MIN value", () => {
			const value = Uint64.from(0n);
			expect(Uint64.toBigInt(value)).toBe(0n);
		});

		it("should create MAX value", () => {
			const value = Uint64.from(18446744073709551615n);
			expect(Uint64.toBigInt(value)).toBe(18446744073709551615n);
		});

		it("should create MAX - 1 value", () => {
			const value = Uint64.from(18446744073709551614n);
			expect(Uint64.toBigInt(value)).toBe(18446744073709551614n);
		});

		it("should throw on negative value", () => {
			expect(() => Uint64.from(-1n)).toThrow();
			expect(() => Uint64.from(-1)).toThrow();
		});

		it("should throw on overflow", () => {
			expect(() => Uint64.from(18446744073709551616n)).toThrow();
		});

		it("should throw on non-integer number", () => {
			expect(() => Uint64.from(1.5)).toThrow();
		});
	});

	describe("toHex", () => {
		it("should convert to hex string with 0x prefix", () => {
			const value = Uint64.from(18446744073709551615n);
			expect(Uint64.toHex(value)).toBe("0xffffffffffffffff");
		});

		it("should convert zero to hex", () => {
			const value = Uint64.from(0n);
			expect(Uint64.toHex(value)).toBe("0x0");
		});

		it("should convert small value to hex", () => {
			const value = Uint64.from(4294967296n);
			expect(Uint64.toHex(value)).toBe("0x100000000");
		});
	});

	describe("toBigInt", () => {
		it("should convert to bigint", () => {
			const value = Uint64.from(123456789012345n);
			expect(Uint64.toBigInt(value)).toBe(123456789012345n);
		});

		it("should return bigint type", () => {
			const value = Uint64.from(123456789012345n);
			expect(typeof Uint64.toBigInt(value)).toBe("bigint");
		});
	});

	describe("toFelt", () => {
		it("should convert to Felt252", () => {
			const value = Uint64.from(18446744073709551615n);
			const felt = Uint64.toFelt(value);
			expect(felt.toBigInt()).toBe(18446744073709551615n);
		});

		it("should convert zero to Felt252", () => {
			const value = Uint64.from(0n);
			const felt = Uint64.toFelt(value);
			expect(felt.toBigInt()).toBe(0n);
		});
	});
});
