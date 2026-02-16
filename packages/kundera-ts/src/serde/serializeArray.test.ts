import { describe, expect, test } from "vitest";
import { Felt252 } from "../primitives/index";
import { deserializeArray } from "./deserializeArray";
import { serializeArray } from "./serializeArray";

describe("array serialization", () => {
	test("serializes with length prefix", () => {
		const items = [Felt252(1n), Felt252(2n), Felt252(3n)];
		const [firstItem, secondItem, thirdItem] = items;
		if (!firstItem || !secondItem || !thirdItem) {
			throw new Error("Expected three items");
		}
		const serialized = serializeArray(items);

		expect(serialized.length).toBe(4); // length + 3 items
		expect(serialized[0]?.toBigInt()).toBe(3n); // length
		expect(serialized[1]?.equals(firstItem)).toBe(true);
		expect(serialized[2]?.equals(secondItem)).toBe(true);
		expect(serialized[3]?.equals(thirdItem)).toBe(true);
	});

	test("deserializes correctly", () => {
		const items = [Felt252(1n), Felt252(2n), Felt252(3n)];
		const firstItem = items[0];
		if (!firstItem) throw new Error("Expected first item");
		const serialized = serializeArray(items);

		const { array, nextOffset } = deserializeArray(serialized);

		expect(array.length).toBe(3);
		expect(nextOffset).toBe(4);
		expect(array[0]?.equals(firstItem)).toBe(true);
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
