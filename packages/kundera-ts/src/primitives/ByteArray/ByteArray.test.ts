import { describe, expect, test } from "vitest";
import { ByteArray, BYTES_PER_WORD } from "./index";

describe("ByteArray", () => {
	test("from empty Uint8Array", () => {
		const ba = ByteArray.from(new Uint8Array(0));
		expect(ba.data).toEqual([]);
		expect(ba.pendingWord).toBe(0n);
		expect(ba.pendingWordLen).toBe(0);
	});

	test("from small Uint8Array (< 31 bytes)", () => {
		const bytes = new Uint8Array([1, 2, 3, 4, 5]);
		const ba = ByteArray.from(bytes);
		expect(ba.data).toEqual([]);
		expect(ba.pendingWordLen).toBe(5);
		// 0x0102030405 = 4328719365
		expect(ba.pendingWord).toBe(0x0102030405n);
	});

	test("from exactly 31 bytes (one full word)", () => {
		const bytes = new Uint8Array(31).fill(0xff);
		const ba = ByteArray.from(bytes);
		expect(ba.data.length).toBe(1);
		expect(ba.pendingWordLen).toBe(0);
		expect(ba.pendingWord).toBe(0n);
	});

	test("from 32 bytes (one word + 1 pending)", () => {
		const bytes = new Uint8Array(32);
		bytes.fill(0xaa, 0, 31);
		bytes[31] = 0xbb;
		const ba = ByteArray.from(bytes);
		expect(ba.data.length).toBe(1);
		expect(ba.pendingWordLen).toBe(1);
		expect(ba.pendingWord).toBe(0xbbn);
	});

	test("toBytes roundtrip", () => {
		const original = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		const ba = ByteArray.from(original);
		const result = ByteArray.toBytes(ba);
		expect(result).toEqual(original);
	});

	test("toBytes roundtrip with multiple words", () => {
		const original = new Uint8Array(100);
		for (let i = 0; i < 100; i++) {
			original[i] = i % 256;
		}
		const ba = ByteArray.from(original);
		const result = ByteArray.toBytes(ba);
		expect(result).toEqual(original);
	});

	test("fromString creates correct ByteArray", () => {
		const ba = ByteArray.fromString("hello");
		expect(ba.pendingWordLen).toBe(5);
		// 'h'=0x68, 'e'=0x65, 'l'=0x6c, 'l'=0x6c, 'o'=0x6f
		expect(ba.pendingWord).toBe(0x68656c6c6fn);
	});

	test("toString roundtrip", () => {
		const original = "Hello, World!";
		const ba = ByteArray.fromString(original);
		const result = ByteArray.toString(ba);
		expect(result).toBe(original);
	});

	test("toString roundtrip with long string", () => {
		const original = "A".repeat(100);
		const ba = ByteArray.fromString(original);
		const result = ByteArray.toString(ba);
		expect(result).toBe(original);
	});

	test("length returns correct byte count", () => {
		expect(ByteArray.length(ByteArray.from(new Uint8Array(0)))).toBe(0);
		expect(ByteArray.length(ByteArray.from(new Uint8Array(5)))).toBe(5);
		expect(ByteArray.length(ByteArray.from(new Uint8Array(31)))).toBe(31);
		expect(ByteArray.length(ByteArray.from(new Uint8Array(32)))).toBe(32);
		expect(ByteArray.length(ByteArray.from(new Uint8Array(100)))).toBe(100);
	});

	test("BYTES_PER_WORD is 31", () => {
		expect(BYTES_PER_WORD).toBe(31);
	});
});
