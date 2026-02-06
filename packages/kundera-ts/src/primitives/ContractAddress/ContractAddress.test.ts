import { describe, expect, test } from "vitest";
import { ContractAddress } from "./ContractAddress";
import { MAX_CONTRACT_ADDRESS } from "./constants";
import { Felt252 } from "../Felt252/Felt252";
import { Address } from "../index";

describe("ContractAddress", () => {
	test("creates valid address", () => {
		const addr = ContractAddress(42n);
		expect(addr.toBigInt()).toBe(42n);
	});

	test("rejects address >= 2^251", () => {
		expect(() => ContractAddress(MAX_CONTRACT_ADDRESS)).toThrow("< 2^251");
	});

	test("accepts address just below limit", () => {
		const addr = ContractAddress(MAX_CONTRACT_ADDRESS - 1n);
		expect(addr.toBigInt()).toBe(MAX_CONTRACT_ADDRESS - 1n);
	});

	test("Address.isValid checks range", () => {
		expect(Address.isValid(Felt252(42))).toBe(true);
		// Create a felt that's >= 2^251 but < FIELD_PRIME
		const bytes = new Uint8Array(32);
		bytes[0] = 0x08; // Sets bit 251
		const largeFelt = Felt252.fromBytes(bytes);
		expect(Address.isValid(largeFelt)).toBe(false);
	});
});

describe("Constants", () => {
	test("MAX_CONTRACT_ADDRESS is 2^251", () => {
		expect(MAX_CONTRACT_ADDRESS).toBe(1n << 251n);
	});

	test("MAX_ADDRESS alias equals MAX_CONTRACT_ADDRESS", async () => {
		const { MAX_ADDRESS } = await import("../index.js");
		expect(MAX_ADDRESS).toBe(1n << 251n);
		expect(MAX_ADDRESS).toBe(MAX_CONTRACT_ADDRESS);
	});
});
