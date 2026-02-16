import { describe, expect, test } from "vitest";
import {
	ensureLoaded,
	hash,
	hashHex,
	hashHexSync,
	hashSync,
	isLoaded,
} from "./hash.wasm.js";

describe("Keccak256 WASM Backend", () => {
	test("ensureLoaded resolves", async () => {
		await ensureLoaded();
		expect(isLoaded()).toBe(true);
	});

	test("hash returns 32 bytes (async)", async () => {
		const h = await hash("hello");
		expect(h.length).toBe(32);
	});

	test("hashSync returns 32 bytes", () => {
		const h = hashSync("hello");
		expect(h.length).toBe(32);
	});

	test("hashHex returns correct value (async)", async () => {
		const h = await hashHex("hello");
		expect(h).toBe(
			"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
		);
	});

	test("hashHexSync returns correct value", () => {
		const h = hashHexSync("hello");
		expect(h).toBe(
			"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
		);
	});

	test("known vector - empty input", async () => {
		const h = await hashHex("");
		expect(h).toBe(
			"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		);
	});
});
