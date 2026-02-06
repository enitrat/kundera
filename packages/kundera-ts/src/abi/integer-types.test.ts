/**
 * Integer Types Integration Test
 *
 * Verifies ABI encoding/decoding support for all integer primitive wrappers.
 */

import { describe, expect, it } from "vitest";
import "../test-utils/setupCrypto";
import {
	encodeCalldata,
	decodeCalldata,
	decodeOutput,
} from "./index.js";
import * as Uint8 from "../primitives/Uint8/index.js";
import type { Uint8Type } from "../primitives/Uint8/index.js";
import * as Uint16 from "../primitives/Uint16/index.js";
import type { Uint16Type } from "../primitives/Uint16/index.js";
import * as Uint32 from "../primitives/Uint32/index.js";
import type { Uint32Type } from "../primitives/Uint32/index.js";
import * as Uint64 from "../primitives/Uint64/index.js";
import type { Uint64Type } from "../primitives/Uint64/index.js";
import * as Uint128 from "../primitives/Uint128/index.js";
import type { Uint128Type } from "../primitives/Uint128/index.js";
import * as Uint256 from "../primitives/Uint256/index.js";
import type { Uint256Type } from "../primitives/Uint256/index.js";
import * as Int8 from "../primitives/Int8/index.js";
import type { Int8Type } from "../primitives/Int8/index.js";
import * as Int16 from "../primitives/Int16/index.js";
import type { Int16Type } from "../primitives/Int16/index.js";
import * as Int32 from "../primitives/Int32/index.js";
import type { Int32Type } from "../primitives/Int32/index.js";
import * as Int64 from "../primitives/Int64/index.js";
import type { Int64Type } from "../primitives/Int64/index.js";
import * as Int128 from "../primitives/Int128/index.js";
import type { Int128Type } from "../primitives/Int128/index.js";

const TEST_ABI = [
	{
		type: "function",
		name: "test_all_integers",
		inputs: [
			{ name: "a", type: "core::integer::u8" },
			{ name: "b", type: "core::integer::u16" },
			{ name: "c", type: "core::integer::u32" },
			{ name: "d", type: "core::integer::u64" },
			{ name: "e", type: "core::integer::u128" },
			{ name: "f", type: "core::integer::u256" },
			{ name: "g", type: "core::integer::i8" },
			{ name: "h", type: "core::integer::i16" },
			{ name: "i", type: "core::integer::i32" },
			{ name: "j", type: "core::integer::i64" },
			{ name: "k", type: "core::integer::i128" },
		],
		outputs: [{ type: "core::integer::u256" }],
		state_mutability: "view",
	},
] as const;

describe("Integer Types - ABI Integration", () => {
	it("should encode all integer types", () => {
		const result = encodeCalldata(TEST_ABI, "test_all_integers", [
			Uint8.from(255), // u8 max
			Uint16.from(65535), // u16 max
			Uint32.from(4294967295n), // u32 max
			Uint64.from(100000000n), // u64
			Uint128.from(1000000000000000n), // u128
			Uint256.from(1000000000000000000n), // u256
			Int8.from(-128), // i8 min
			Int16.from(-32768), // i16 min
			Int32.from(-100000), // i32
			Int64.from(-10000000000n), // i64
			Int128.from(-1000000000n), // i128
		]);
		expect(result.error).toBeNull();
		expect(result.result).toBeDefined();
		// u8, u16, u32, u64, u128, u256(2 felts = low+high), i8, i16, i32, i64, i128 = 12 total
		expect(result.result!.length).toBeGreaterThan(10);
	});

	it("should decode unsigned integer types", () => {
		const args = [
			Uint8.from(42),
			Uint16.from(1000),
			Uint32.from(100000),
			Uint64.from(10000000000n),
			Uint128.from(1000000000000000n),
			Uint256.from(1000000000000000000n),
			Int8.from(-42),
			Int16.from(-1000),
			Int32.from(-100000),
			Int64.from(-10000000000n),
			Int128.from(-1000000000n),
		] as const;

		const encoded = encodeCalldata(TEST_ABI, "test_all_integers", args);
		expect(encoded.error).toBeNull();

		const decoded = decodeCalldata(
			TEST_ABI,
			"test_all_integers",
			encoded.result!,
		);
		expect(decoded.error).toBeNull();
		expect(decoded.result).toBeDefined();

		// Verify the values round-trip correctly
		const values = decoded.result!;
		expect(Uint8.toBigInt(values[0] as Uint8Type)).toBe(42n);
		expect(Uint16.toBigInt(values[1] as Uint16Type)).toBe(1000n);
		expect(Uint32.toBigInt(values[2] as Uint32Type)).toBe(100000n);
		expect(Uint64.toBigInt(values[3] as Uint64Type)).toBe(10000000000n);
		expect(Uint128.toBigInt(values[4] as Uint128Type)).toBe(1000000000000000n);
		expect(Uint256.toBigInt(values[5] as Uint256Type)).toBe(
			1000000000000000000n,
		);
		expect(Int8.toBigInt(values[6] as Int8Type)).toBe(-42n);
		expect(Int16.toBigInt(values[7] as Int16Type)).toBe(-1000n);
		expect(Int32.toBigInt(values[8] as Int32Type)).toBe(-100000n);
		expect(Int64.toBigInt(values[9] as Int64Type)).toBe(-10000000000n);
		expect(Int128.toBigInt(values[10] as Int128Type)).toBe(-1000000000n);
	});

	it("should decode u256 output", () => {
		const outputData = [1000000000000000000n, 0n]; // low, high

		const result = decodeOutput(TEST_ABI, "test_all_integers", outputData);
		expect(result.error).toBeNull();
		expect(result.result).toBeDefined();
		// decodeOutput unwraps single output to scalar
		expect(Uint256.toBigInt(result.result! as Uint256Type)).toBe(
			1000000000000000000n,
		);
	});

	it("should handle edge cases", () => {
		// Test with max values for unsigned types
		const maxValues = encodeCalldata(TEST_ABI, "test_all_integers", [
			Uint8.from(255), // u8 max
			Uint16.from(65535), // u16 max
			Uint32.from(4294967295n), // u32 max
			Uint64.from(18446744073709551615n), // u64 max
			Uint128.from("340282366920938463463374607431768211455"), // u128 max
			Uint256.from(
				"115792089237316195423570985008687907853269984665640564039457584007913129639935",
			), // u256 max
			Int8.from(-128), // i8 min
			Int16.from(-32768), // i16 min
			Int32.from(-2147483648), // i32 min
			Int64.from(-9223372036854775808n), // i64 min
			Int128.from("-170141183460469231731687303715884105728"), // i128 min
		]);
		expect(maxValues.error).toBeNull();
		expect(maxValues.result).toBeDefined();
	});
});
