import { describe, expect, test } from "vitest";
import { Felt252 } from "../../primitives/Felt252/index.js";
import { Poseidon, hash, hashMany } from "./index.js";

describe("Poseidon", () => {
	// Test vectors from @scure/starknet (cairo-lang 0.11 cross-tested)
	describe("test vectors", () => {
		test("poseidonHash(1, 1)", () => {
			const h = hash(Felt252(1n), Felt252(1n));
			expect(h.toBigInt()).toBe(
				315729444126170353286530004158376771769107830460625027134495740547491428733n,
			);
		});

		test("poseidonHash(123, 123)", () => {
			const h = hash(Felt252(123n), Felt252(123n));
			expect(h.toBigInt()).toBe(
				3149184350054566761517315875549307360045573205732410509163060794402900549639n,
			);
		});

		test("poseidonHash with large values", () => {
			const big = 1231231231231231231231231312312n;
			const h = hash(Felt252(big), Felt252(big));
			expect(h.toBigInt()).toBe(
				2544250291965936388474000136445328679708604225006461780180655815882994563864n,
			);
		});
	});

	describe("hashMany test vectors", () => {
		test("poseidonHashMany([1])", () => {
			const h = hashMany([Felt252(1n)]);
			expect(h.toBigInt()).toBe(
				154809849725474173771833689306955346864791482278938452209165301614543497938n,
			);
		});

		test("poseidonHashMany([1, 2])", () => {
			const h = hashMany([Felt252(1n), Felt252(2n)]);
			expect(h.toBigInt()).toBe(
				1557996165160500454210437319447297236715335099509187222888255133199463084263n,
			);
		});

		test("poseidonHashMany([1, 2, 3])", () => {
			const h = hashMany([Felt252(1n), Felt252(2n), Felt252(3n)]);
			// Verify it produces consistent output
			const h2 = hashMany([Felt252(1n), Felt252(2n), Felt252(3n)]);
			expect(h.toBigInt()).toBe(h2.toBigInt());
		});
	});

	test("deterministic", () => {
		const a = Felt252(123n);
		const b = Felt252(456n);
		const h1 = hash(a, b);
		const h2 = hash(a, b);
		expect(h1.toBigInt()).toBe(h2.toBigInt());
	});

	test("namespace works", () => {
		expect(Poseidon.hash).toBe(hash);
		expect(Poseidon.hashMany).toBe(hashMany);
	});
});
