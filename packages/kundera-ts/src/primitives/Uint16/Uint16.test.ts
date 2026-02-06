import { describe, it, expect } from "vitest";
import { Uint16, MIN, MAX, SIZE } from "./index.js";

describe("Uint16", () => {
	describe("constants", () => {
		it("should have correct MIN value", () => {
			expect(MIN).toBe(0n);
		});

		it("should have correct MAX value", () => {
			expect(MAX).toBe(65535n);
		});

		it("should have correct SIZE in bits", () => {
			expect(SIZE).toBe(16);
		});
	});

	describe("from", () => {
		it("should create from bigint", () => {
			const value = Uint16.from(1000n);
			expect(Uint16.toBigInt(value)).toBe(1000n);
		});

		it("should create from number", () => {
			const value = Uint16.from(1000);
			expect(Uint16.toBigInt(value)).toBe(1000n);
		});

		it("should create from decimal string", () => {
			const value = Uint16.from("1000");
			expect(Uint16.toBigInt(value)).toBe(1000n);
		});

		it("should create from hex string", () => {
			const value = Uint16.from("0xffff");
			expect(Uint16.toBigInt(value)).toBe(65535n);
		});

		it("should create MIN value", () => {
			const value = Uint16.from(0n);
			expect(Uint16.toBigInt(value)).toBe(0n);
		});

		it("should create MAX value", () => {
			const value = Uint16.from(65535n);
			expect(Uint16.toBigInt(value)).toBe(65535n);
		});

		it("should create MAX - 1 value", () => {
			const value = Uint16.from(65534n);
			expect(Uint16.toBigInt(value)).toBe(65534n);
		});

		it("should throw on negative value", () => {
			expect(() => Uint16.from(-1n)).toThrow();
			expect(() => Uint16.from(-1)).toThrow();
		});

		it("should throw on overflow", () => {
			expect(() => Uint16.from(65536n)).toThrow();
			expect(() => Uint16.from(65536)).toThrow();
		});

		it("should throw on non-integer number", () => {
			expect(() => Uint16.from(1.5)).toThrow();
		});
	});

	describe("toHex", () => {
		it("should convert to hex string with 0x prefix", () => {
			const value = Uint16.from(65535n);
			expect(Uint16.toHex(value)).toBe("0xffff");
		});

		it("should convert zero to hex", () => {
			const value = Uint16.from(0n);
			expect(Uint16.toHex(value)).toBe("0x0");
		});

		it("should convert small value to hex", () => {
			const value = Uint16.from(256n);
			expect(Uint16.toHex(value)).toBe("0x100");
		});
	});

	describe("toBigInt", () => {
		it("should convert to bigint", () => {
			const value = Uint16.from(12345n);
			expect(Uint16.toBigInt(value)).toBe(12345n);
		});

		it("should return bigint type", () => {
			const value = Uint16.from(12345n);
			expect(typeof Uint16.toBigInt(value)).toBe("bigint");
		});
	});

	describe("toFelt", () => {
		it("should convert to Felt252", () => {
			const value = Uint16.from(65535n);
			const felt = Uint16.toFelt(value);
			expect(felt.toBigInt()).toBe(65535n);
		});

		it("should convert zero to Felt252", () => {
			const value = Uint16.from(0n);
			const felt = Uint16.toFelt(value);
			expect(felt.toBigInt()).toBe(0n);
		});
	});
});
