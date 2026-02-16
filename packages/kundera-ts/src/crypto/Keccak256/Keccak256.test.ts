import { describe, expect, test } from "vitest";
import { DIGEST_SIZE, Keccak256, hash, hashHex } from "./index.js";

describe("Keccak256", () => {
	test("DIGEST_SIZE is 32", () => {
		expect(DIGEST_SIZE).toBe(32);
	});

	test("hash returns 32 bytes", () => {
		const h = hash(new Uint8Array([1, 2, 3]));
		expect(h.length).toBe(32);
	});

	test("hash accepts string", () => {
		const h = hash("hello");
		expect(h.length).toBe(32);
	});

	test("hashHex returns hex string", () => {
		const h = hashHex("hello");
		expect(h.startsWith("0x")).toBe(true);
		expect(h.length).toBe(66); // 0x + 64 hex chars
	});

	test("deterministic - same input same output", () => {
		const h1 = hash("test");
		const h2 = hash("test");
		expect(h1).toEqual(h2);
	});

	test("known vector - empty input", () => {
		// Keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
		const h = hashHex("");
		expect(h).toBe(
			"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		);
	});

	test("known vector - hello", () => {
		// keccak256("hello") = 0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8
		const h = hashHex("hello");
		expect(h).toBe(
			"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
		);
	});

	test("known vector - bytes", () => {
		// keccak256([0x00])
		const h = hashHex(new Uint8Array([0]));
		expect(h).toBe(
			"0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a",
		);
	});

	test("namespace export works", () => {
		expect(Keccak256.hash).toBe(hash);
		expect(Keccak256.hashHex).toBe(hashHex);
		expect(Keccak256.DIGEST_SIZE).toBe(32);
	});

	test("different inputs produce different outputs", () => {
		const h1 = hash("a");
		const h2 = hash("b");
		expect(h1).not.toEqual(h2);
	});

	test("hash result is Uint8Array", () => {
		const h = hash("test");
		expect(h).toBeInstanceOf(Uint8Array);
	});
});
