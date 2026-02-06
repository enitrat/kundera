import { describe, expect, test } from "vitest";
import { StorageKey } from "./StorageKey";
import { Felt252 } from "../Felt252/Felt252";

describe("StorageKey", () => {
	test("creates valid storage key", () => {
		const key = StorageKey(42n);
		expect(key.toBigInt()).toBe(42n);
	});

	test("rejects storage key >= 2^251", () => {
		const bytes = new Uint8Array(32);
		bytes[0] = 0x08; // Sets bit 251
		const tooLarge = Felt252.fromBytes(bytes);
		expect(() => StorageKey(tooLarge)).toThrow("< 2^251");
	});
});
