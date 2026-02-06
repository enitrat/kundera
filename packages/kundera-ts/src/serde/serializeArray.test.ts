import { describe, expect, test } from "vitest";
import { serializeArray } from "./serializeArray";
import { deserializeArray } from "./deserializeArray";
import { Felt252 } from "../primitives/index";

describe("array serialization", () => {
	test("serializes with length prefix", () => {
		const items = [Felt252(1n), Felt252(2n), Felt252(3n)];
		const serialized = serializeArray(items);

		expect(serialized.length).toBe(4); // length + 3 items
		expect(serialized[0]?.toBigInt()).toBe(3n); // length
		expect(serialized[1]?.equals(items[0]!)).toBe(true);
		expect(serialized[2]?.equals(items[1]!)).toBe(true);
		expect(serialized[3]?.equals(items[2]!)).toBe(true);
	});

	test("deserializes correctly", () => {
		const items = [Felt252(1n), Felt252(2n), Felt252(3n)];
		const serialized = serializeArray(items);

		const { array, nextOffset } = deserializeArray(serialized);

		expect(array.length).toBe(3);
		expect(nextOffset).toBe(4);
		expect(array[0]?.equals(items[0]!)).toBe(true);
	});

	test("empty array", () => {
		const serialized = serializeArray([]);
		expect(serialized.length).toBe(1);
		expect(serialized[0]?.toBigInt()).toBe(0n);

		const { array, nextOffset } = deserializeArray(serialized);
		expect(array.length).toBe(0);
		expect(nextOffset).toBe(1);
	});
});
