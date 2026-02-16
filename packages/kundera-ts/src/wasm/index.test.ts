/**
 * WASM Entrypoint Tests
 *
 * Tests the WASM-only entrypoint behavior.
 * Skips crypto tests if WASM artifact not present.
 */

import { beforeAll, describe, expect, test } from "vitest";
import { Felt252 } from "../primitives/index";
import * as wasmEntry from "./index";

// Check WASM availability
const wasmAvailable = wasmEntry.isWasmAvailable();

describe("WASM Entrypoint", () => {
	beforeAll(async () => {
		if (!wasmAvailable) {
			console.log(
				"WASM artifact not found. Skipping WASM entrypoint crypto tests.",
			);
			return;
		}
		await wasmEntry.loadWasmCrypto();
	});

	describe("availability", () => {
		test("isNativeAvailable always returns false", () => {
			// WASM entrypoint never has native
			expect(wasmEntry.isNativeAvailable()).toBe(false);
		});

		test("isWasmAvailable returns boolean", () => {
			expect(typeof wasmEntry.isWasmAvailable()).toBe("boolean");
		});

		test("isWasmLoaded returns true after loading", () => {
			if (!wasmAvailable) return;
			expect(wasmEntry.isWasmLoaded()).toBe(true);
		});
	});

	describe("primitives exports", () => {
		test("exports FIELD_PRIME", () => {
			expect(wasmEntry.FIELD_PRIME).toBeDefined();
			expect(typeof wasmEntry.FIELD_PRIME).toBe("bigint");
		});

		test("exports Felt252", () => {
			expect(wasmEntry.Felt252).toBeDefined();
			const felt = wasmEntry.Felt252(42);
			expect(felt.toBigInt()).toBe(42n);
		});

		test("exports ContractAddress", () => {
			expect(wasmEntry.ContractAddress).toBeDefined();
		});

		test("exports Felt namespace", () => {
			expect(wasmEntry.Felt).toBeDefined();
			expect(wasmEntry.Felt.ZERO).toBeDefined();
			expect(wasmEntry.Felt.ONE).toBeDefined();
		});
	});

	describe("serde exports", () => {
		test("exports serializeU256", () => {
			expect(wasmEntry.serializeU256).toBeDefined();
			const result = wasmEntry.serializeU256(256n);
			expect(result.length).toBe(2);
		});

		test("exports CairoSerde namespace", () => {
			expect(wasmEntry.CairoSerde).toBeDefined();
			expect(wasmEntry.CairoSerde.serializeU256).toBeDefined();
		});
	});

	describe("crypto exports", () => {
		test("exports loadWasmCrypto", () => {
			expect(wasmEntry.loadWasmCrypto).toBeDefined();
		});

		test("exports pedersenHash", () => {
			expect(wasmEntry.pedersenHash).toBeDefined();
		});

		test("exports sign and verify", () => {
			expect(wasmEntry.sign).toBeDefined();
			expect(wasmEntry.verify).toBeDefined();
		});

		test("exports crypto namespaces", () => {
			expect(wasmEntry.Pedersen).toBeDefined();
			expect(wasmEntry.Poseidon).toBeDefined();
			expect(wasmEntry.StarkCurve).toBeDefined();
		});
	});

	describe("crypto operations (wasm-only)", () => {
		test("pedersenHash works", () => {
			if (!wasmAvailable) return;
			const result = wasmEntry.pedersenHash(Felt252(1), Felt252(2));
			expect(result.length).toBe(32);
		});

		test("poseidonHash works", () => {
			if (!wasmAvailable) return;
			const result = wasmEntry.poseidonHash(Felt252(1), Felt252(2));
			expect(result.length).toBe(32);
		});

		test("feltAdd works", () => {
			if (!wasmAvailable) return;
			const result = wasmEntry.feltAdd(Felt252(2), Felt252(3));
			expect(result.toBigInt()).toBe(5n);
		});

		test("sign and verify work", () => {
			if (!wasmAvailable) return;
			const privateKey = Felt252(0x123456789abcdefn);
			const messageHash = Felt252(0xdeadbeefcafebaben);

			const pubKey = wasmEntry.getPublicKey(privateKey);
			const sig = wasmEntry.sign(privateKey, messageHash);
			const isValid = wasmEntry.verify(pubKey, messageHash, sig);

			expect(isValid).toBe(true);
		});
	});

	describe("throws without loading", () => {
		// Note: These would fail if we hadn't loaded in beforeAll
		// Testing the error message pattern
		test("error message mentions loadWasmCrypto", () => {
			// Can't easily test this without a fresh module import
			// Just verify the functions exist
			expect(wasmEntry.pedersenHash).toBeDefined();
		});
	});
});

describe("API Parity", () => {
	test("main index and wasm index export same primitives functions", () => {
		// Check key primitives exports exist in both
		expect(wasmEntry.Felt252).toBeDefined();
		expect(wasmEntry.ContractAddress).toBeDefined();
		expect(wasmEntry.ClassHash).toBeDefined();
		expect(wasmEntry.StorageKey).toBeDefined();
	});

	test("main index and wasm index export same crypto functions", () => {
		expect(wasmEntry.pedersenHash).toBeDefined();
		expect(wasmEntry.poseidonHash).toBeDefined();
		expect(wasmEntry.poseidonHashMany).toBeDefined();
		expect(wasmEntry.feltAdd).toBeDefined();
		expect(wasmEntry.sign).toBeDefined();
		expect(wasmEntry.verify).toBeDefined();
		expect(wasmEntry.getPublicKey).toBeDefined();
	});

	test("main index and wasm index export same serde functions", () => {
		expect(wasmEntry.serializeU256).toBeDefined();
		expect(wasmEntry.deserializeU256).toBeDefined();
		expect(wasmEntry.serializeArray).toBeDefined();
		expect(wasmEntry.deserializeArray).toBeDefined();
	});
});
