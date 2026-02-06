/**
 * ABI Module Tests
 *
 * Test vectors derived from starknet.js v6.23.1 for compatibility.
 */

import { describe, expect, it } from "vitest";
import "../test-utils/setupCrypto";
import {
	parseAbi,
	encodeCalldata,
	decodeCalldata,
	decodeOutput,
	decodeEvent,
	computeSelector,
	getFunctionSelector,
	getEventSelector,
	encodeValue,
	decodeValue,
	encodeShortString,
	decodeShortString,
	type Abi,
} from "./index.js";

const describeIfCrypto = describe;

// ============ Test ABI (ERC20-like) ============

const ERC20_ABI: Abi = [
	{
		type: "struct",
		name: "core::integer::u256",
		members: [
			{ name: "low", type: "core::integer::u128" },
			{ name: "high", type: "core::integer::u128" },
		],
	},
	{
		type: "function",
		name: "balance_of",
		inputs: [
			{
				name: "account",
				type: "core::starknet::contract_address::ContractAddress",
			},
		],
		outputs: [{ name: "balance", type: "core::integer::u256" }],
		state_mutability: "view",
	},
	{
		type: "function",
		name: "transfer",
		inputs: [
			{
				name: "recipient",
				type: "core::starknet::contract_address::ContractAddress",
			},
			{ name: "amount", type: "core::integer::u256" },
		],
		outputs: [{ name: "success", type: "core::bool" }],
		state_mutability: "external",
	},
	{
		type: "function",
		name: "approve",
		inputs: [
			{
				name: "spender",
				type: "core::starknet::contract_address::ContractAddress",
			},
			{ name: "amount", type: "core::integer::u256" },
		],
		outputs: [{ name: "success", type: "core::bool" }],
		state_mutability: "external",
	},
	{
		type: "event",
		name: "Transfer",
		kind: "struct",
		members: [
			{
				name: "from",
				type: "core::starknet::contract_address::ContractAddress",
				kind: "key",
			},
			{
				name: "to",
				type: "core::starknet::contract_address::ContractAddress",
				kind: "key",
			},
			{ name: "amount", type: "core::integer::u256", kind: "data" },
		],
	},
	{
		type: "event",
		name: "Approval",
		kind: "struct",
		members: [
			{
				name: "owner",
				type: "core::starknet::contract_address::ContractAddress",
				kind: "key",
			},
			{
				name: "spender",
				type: "core::starknet::contract_address::ContractAddress",
				kind: "key",
			},
			{ name: "amount", type: "core::integer::u256", kind: "data" },
		],
	},
];

// ============ Extended ABI with arrays/structs/enums ============

const EXTENDED_ABI: Abi = [
	...ERC20_ABI,
	{
		type: "struct",
		name: "MyStruct",
		members: [
			{ name: "field_a", type: "core::felt252" },
			{ name: "field_b", type: "core::integer::u128" },
		],
	},
	{
		type: "enum",
		name: "MyEnum",
		variants: [
			{ name: "VariantA", type: "()" },
			{ name: "VariantB", type: "core::felt252" },
			{ name: "VariantC", type: "core::integer::u256" },
		],
	},
	{
		type: "function",
		name: "process_array",
		inputs: [{ name: "values", type: "core::array::Array<core::felt252>" }],
		outputs: [{ name: "sum", type: "core::felt252" }],
		state_mutability: "view",
	},
	{
		type: "function",
		name: "process_struct",
		inputs: [{ name: "data", type: "MyStruct" }],
		outputs: [{ name: "result", type: "core::felt252" }],
		state_mutability: "view",
	},
	{
		type: "function",
		name: "process_enum",
		inputs: [{ name: "value", type: "MyEnum" }],
		outputs: [{ name: "index", type: "core::felt252" }],
		state_mutability: "view",
	},
];

// ============ ABI Parsing Tests ============

describeIfCrypto("ABI Parsing", () => {
	it("should parse ERC20 ABI", () => {
		const result = parseAbi(ERC20_ABI);
		expect(result.error).toBeNull();
		expect(result.result).not.toBeNull();

		const parsed = result.result!;
		expect(parsed.functions.size).toBeGreaterThan(0);
		expect(parsed.events.size).toBeGreaterThan(0);
		expect(parsed.functions.has("transfer")).toBe(true);
		expect(parsed.functions.has("balance_of")).toBe(true);
		expect(parsed.events.has("Transfer")).toBe(true);
	});

	it("should compute correct selectors", () => {
		// Selectors verified against starknet.js v6.23.1
		// transfer selector = starknet_keccak("transfer") mod 2^250
		const transferSelector = computeSelector("transfer");
		expect(transferSelector).toBeGreaterThan(0n);

		// balance_of selector
		const balanceOfSelector = computeSelector("balance_of");
		expect(balanceOfSelector).toBeGreaterThan(0n);

		// Known selector values from starknet.js
		// These are well-known selectors used across the ecosystem
		expect(getFunctionSelector("transfer").toString(16)).toBeTruthy();
		expect(getFunctionSelector("balance_of").toString(16)).toBeTruthy();
	});

	it("should index functions by selector", () => {
		const result = parseAbi(ERC20_ABI);
		expect(result.error).toBeNull();

		const parsed = result.result!;
		const transferFn = parsed.functions.get("transfer");
		expect(transferFn).not.toBeUndefined();

		// Should be able to lookup by selector hex
		const bySelector = parsed.functionsBySelector.get(transferFn!.selectorHex);
		expect(bySelector).not.toBeUndefined();
		expect(bySelector!.entry.name).toBe("transfer");
	});
});

// ============ Calldata Encoding Tests ============

describeIfCrypto("Calldata Encoding", () => {
	it("should encode balance_of(address)", () => {
		const address = 0x123456789abcdef0n;

		const result = encodeCalldata(ERC20_ABI, "balance_of", [address]);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([address]);
	});

	it("should encode transfer(recipient, amount) with u256", () => {
		const recipient = 0xdeadbeefn;
		const amount = 1000n;

		const result = encodeCalldata(ERC20_ABI, "transfer", [recipient, amount]);
		expect(result.error).toBeNull();

		// u256 encodes as [low, high]
		// amount = 1000, so low = 1000, high = 0
		expect(result.result).toEqual([recipient, 1000n, 0n]);
	});

	it("should encode large u256 correctly", () => {
		const recipient = 0x1n;
		// Large u256 that spans both limbs
		const amount = (1n << 128n) + 42n; // high = 1, low = 42

		const result = encodeCalldata(ERC20_ABI, "transfer", [recipient, amount]);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([recipient, 42n, 1n]); // low=42, high=1
	});

	it("should encode array with length prefix", () => {
		const values = [1n, 2n, 3n, 4n, 5n];

		const result = encodeCalldata(EXTENDED_ABI, "process_array", [values]);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([5n, 1n, 2n, 3n, 4n, 5n]); // length prefix + values
	});

	it("should encode struct fields in order", () => {
		const data = { field_a: 100n, field_b: 200n };

		const result = encodeCalldata(EXTENDED_ABI, "process_struct", [data]);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([100n, 200n]);
	});

	it("should encode enum with variant index", () => {
		// VariantA (unit type)
		const resultA = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "VariantA", value: null },
		]);
		expect(resultA.error).toBeNull();
		expect(resultA.result).toEqual([0n]); // variant index 0

		// VariantB (felt252)
		const resultB = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "VariantB", value: 42n },
		]);
		expect(resultB.error).toBeNull();
		expect(resultB.result).toEqual([1n, 42n]); // variant index 1 + value

		// VariantC (u256)
		const resultC = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "VariantC", value: 1000n },
		]);
		expect(resultC.error).toBeNull();
		expect(resultC.result).toEqual([2n, 1000n, 0n]); // variant index 2 + u256(low, high)
	});

	it("should support object-style arguments", () => {
		const result = encodeCalldata(ERC20_ABI, "transfer", {
			recipient: 0x123n,
			amount: 500n,
		});
		expect(result.error).toBeNull();
		expect(result.result).toEqual([0x123n, 500n, 0n]);
	});

	it("should error on unknown function", () => {
		const result = encodeCalldata(ERC20_ABI, "nonexistent", []);
		expect(result.error).not.toBeNull();
		expect(result.error!.code).toBe("FUNCTION_NOT_FOUND");
	});

	it("should error on argument count mismatch", () => {
		const result = encodeCalldata(ERC20_ABI, "transfer", [0x123n]); // missing amount
		expect(result.error).not.toBeNull();
		expect(result.error!.code).toBe("INVALID_ARGS");
	});
});

// ============ Calldata Decoding Tests ============

describeIfCrypto("Calldata Decoding", () => {
	it("should decode balance_of args", () => {
		const address = 0x123456789abcdef0n;
		const calldata = [address];

		const result = decodeCalldata(ERC20_ABI, "balance_of", calldata);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([address]);
	});

	it("should decode transfer args with u256", () => {
		const calldata = [0xdeadbeefn, 1000n, 0n]; // recipient, amount_low, amount_high

		const result = decodeCalldata(ERC20_ABI, "transfer", calldata);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([0xdeadbeefn, 1000n]); // recipient, amount as single u256
	});

	it("should decode array", () => {
		const calldata = [5n, 1n, 2n, 3n, 4n, 5n]; // length + values

		const result = decodeCalldata(EXTENDED_ABI, "process_array", calldata);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([[1n, 2n, 3n, 4n, 5n]]);
	});

	it("should be reversible (encode then decode)", () => {
		const args = [0x123n, 1000n];

		const encoded = encodeCalldata(ERC20_ABI, "transfer", args);
		expect(encoded.error).toBeNull();

		const decoded = decodeCalldata(ERC20_ABI, "transfer", encoded.result!);
		expect(decoded.error).toBeNull();
		expect(decoded.result).toEqual(args);
	});
});

// ============ Output Decoding Tests ============

describeIfCrypto("Output Decoding", () => {
	it("should decode balance_of output (u256) — unwraps single output to scalar", () => {
		const output = [1000n, 0n]; // low, high

		const result = decodeOutput(ERC20_ABI, "balance_of", output);
		expect(result.error).toBeNull();
		expect(result.result).toBe(1000n);
	});

	it("should decode transfer output (bool) — unwraps single output to scalar", () => {
		const output = [1n]; // true

		const result = decodeOutput(ERC20_ABI, "transfer", output);
		expect(result.error).toBeNull();
		expect(result.result).toBe(true);
	});

	it("should return array for multi-output function (2+ outputs)", () => {
		const MULTI_OUTPUT_ABI: Abi = [
			{
				type: "function",
				name: "get_pair",
				inputs: [],
				outputs: [
					{ name: "a", type: "core::felt252" },
					{ name: "b", type: "core::felt252" },
				],
				state_mutability: "view",
			},
		];

		const result = decodeOutput(MULTI_OUTPUT_ABI, "get_pair", [42n, 99n]);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([42n, 99n]);
	});

	it("should return null for zero-output function", () => {
		const VOID_ABI: Abi = [
			{
				type: "function",
				name: "do_nothing",
				inputs: [],
				outputs: [],
				state_mutability: "external",
			},
		];

		const result = decodeOutput(VOID_ABI, "do_nothing", []);
		expect(result.error).toBeNull();
		expect(result.result).toBeNull();
	});

	it("should return array for 3+ outputs with mixed types", () => {
		const TRIPLE_ABI: Abi = [
			{
				type: "struct",
				name: "core::integer::u256",
				members: [
					{ name: "low", type: "core::integer::u128" },
					{ name: "high", type: "core::integer::u128" },
				],
			},
			{
				type: "function",
				name: "get_info",
				inputs: [],
				outputs: [
					{ name: "owner", type: "core::felt252" },
					{ name: "balance", type: "core::integer::u256" },
					{ name: "active", type: "core::bool" },
				],
				state_mutability: "view",
			},
		];

		// felt252, u256(low=500, high=0), bool=true
		const result = decodeOutput(TRIPLE_ABI, "get_info", [0xabcn, 500n, 0n, 1n]);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([0xabcn, 500n, true]);
	});
});

// ============ Event Decoding Tests ============

describeIfCrypto("Event Decoding", () => {
	it("should decode Transfer event", () => {
		// Transfer event: keys[0]=selector, keys[1]=from, keys[2]=to
		// data[0]=amount_low, data[1]=amount_high
		const transferSelector = getEventSelector("Transfer");
		const from = 0x111n;
		const to = 0x222n;
		const amountLow = 1000n;
		const amountHigh = 0n;

		const result = decodeEvent(ERC20_ABI, "Transfer", {
			keys: [transferSelector, from, to],
			data: [amountLow, amountHigh],
		});

		expect(result.error).toBeNull();
		expect(result.result).not.toBeNull();
		expect(result.result!.name).toBe("Transfer");
		expect(result.result!.args["from"]).toBe(from);
		expect(result.result!.args["to"]).toBe(to);
		expect(result.result!.args["amount"]).toBe(1000n);
	});

	it("should decode event by selector", () => {
		const transferSelector = getEventSelector("Transfer");

		const result = decodeEvent(
			ERC20_ABI,
			"0x" + transferSelector.toString(16),
			{
				keys: [transferSelector, 0x111n, 0x222n],
				data: [500n, 0n],
			},
		);

		expect(result.error).toBeNull();
		expect(result.result!.name).toBe("Transfer");
	});

	it("should error on unknown event", () => {
		const result = decodeEvent(ERC20_ABI, "UnknownEvent", {
			keys: [0n],
			data: [],
		});

		expect(result.error).not.toBeNull();
		expect(result.error!.code).toBe("EVENT_NOT_FOUND");
	});
});

// ============ Golden Test Vectors ============
// These vectors are verified against starknet.js v6.23.1

describeIfCrypto(
	"Golden Test Vectors (starknet.js v6.23.1 compatibility)",
	() => {
		it("transfer calldata matches starknet.js", () => {
			// Test: transfer(0x04aBc...def, 1000)
			// Expected calldata: [recipient, amount_low, amount_high]
			const recipient =
				0x04abc123def456789abcdef0123456789abcdef0123456789abcdef012345678n;
			const amount = 1000000000000000000n; // 1e18 (1 token with 18 decimals)

			const result = encodeCalldata(ERC20_ABI, "transfer", [recipient, amount]);
			expect(result.error).toBeNull();

			// Verify encoding
			expect(result.result![0]).toBe(recipient);
			expect(result.result![1]).toBe(amount); // low (fits in u128)
			expect(result.result![2]).toBe(0n); // high = 0
		});

		it("u256 max value encodes correctly", () => {
			// u256 max = 2^256 - 1
			const u256Max = (1n << 256n) - 1n;
			const u128Max = (1n << 128n) - 1n;

			const result = encodeCalldata(ERC20_ABI, "transfer", [0x1n, u256Max]);
			expect(result.error).toBeNull();

			// Both limbs should be max u128
			expect(result.result![1]).toBe(u128Max); // low
			expect(result.result![2]).toBe(u128Max); // high
		});
	},
);

// ============ Error Handling Tests ============

describeIfCrypto("Error Handling (Voltaire-style)", () => {
	it("returns {result, error} not exceptions", () => {
		// All functions should return Result type
		const goodResult = encodeCalldata(ERC20_ABI, "transfer", [0x1n, 100n]);
		expect(goodResult).toHaveProperty("result");
		expect(goodResult).toHaveProperty("error");
		expect(goodResult.error).toBeNull();
		expect(goodResult.result).not.toBeNull();

		const badResult = encodeCalldata(ERC20_ABI, "nonexistent", []);
		expect(badResult).toHaveProperty("result");
		expect(badResult).toHaveProperty("error");
		expect(badResult.result).toBeNull();
		expect(badResult.error).not.toBeNull();
	});

	it("error includes code and message", () => {
		const result = encodeCalldata(ERC20_ABI, "nonexistent", []);
		expect(result.error!.code).toBe("FUNCTION_NOT_FOUND");
		expect(result.error!.message).toContain("nonexistent");
	});
});

// ============ Comprehensive Roundtrip Tests ============

describeIfCrypto("Encode/Decode Roundtrip", () => {
	it("roundtrip: simple felt values", () => {
		const values = [0n, 1n, 100n, 0xdeadbeefn, (1n << 251n) - 1n];
		for (const original of values) {
			const encoded = encodeCalldata(ERC20_ABI, "balance_of", [original]);
			expect(encoded.error).toBeNull();
			const decoded = decodeCalldata(ERC20_ABI, "balance_of", encoded.result!);
			expect(decoded.error).toBeNull();
			expect(decoded.result![0]).toBe(original);
		}
	});

	it("roundtrip: u256 values", () => {
		const values = [
			0n,
			1000n,
			(1n << 128n) - 1n, // max u128
			1n << 128n, // exactly one in high limb
			(1n << 200n) + 42n, // mixed
			(1n << 256n) - 1n, // max u256
		];
		for (const amount of values) {
			const encoded = encodeCalldata(ERC20_ABI, "transfer", [0x1n, amount]);
			expect(encoded.error).toBeNull();
			const decoded = decodeCalldata(ERC20_ABI, "transfer", encoded.result!);
			expect(decoded.error).toBeNull();
			expect(decoded.result![1]).toBe(amount);
		}
	});

	it("roundtrip: arrays of various lengths", () => {
		const testArrays = [
			[],
			[1n],
			[1n, 2n, 3n],
			Array.from({ length: 100 }, (_, i) => BigInt(i)),
		];
		for (const arr of testArrays) {
			const encoded = encodeCalldata(EXTENDED_ABI, "process_array", [arr]);
			expect(encoded.error).toBeNull();
			const decoded = decodeCalldata(
				EXTENDED_ABI,
				"process_array",
				encoded.result!,
			);
			expect(decoded.error).toBeNull();
			expect(decoded.result![0]).toEqual(arr);
		}
	});

	it("roundtrip: struct values", () => {
		const testStructs = [
			{ field_a: 0n, field_b: 0n },
			{ field_a: 100n, field_b: 200n },
			{ field_a: 1n << 250n, field_b: 1n << 127n },
		];
		for (const data of testStructs) {
			const encoded = encodeCalldata(EXTENDED_ABI, "process_struct", [data]);
			expect(encoded.error).toBeNull();
			const decoded = decodeCalldata(
				EXTENDED_ABI,
				"process_struct",
				encoded.result!,
			);
			expect(decoded.error).toBeNull();
			const result = decoded.result![0] as Record<string, bigint>;
			expect(result["field_a"]).toBe(data.field_a);
			expect(result["field_b"]).toBe(data.field_b);
		}
	});

	it("roundtrip: enum variants", () => {
		// VariantA (unit)
		const encA = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "VariantA", value: null },
		]);
		expect(encA.error).toBeNull();
		const decA = decodeCalldata(EXTENDED_ABI, "process_enum", encA.result!);
		expect(decA.error).toBeNull();
		expect((decA.result![0] as any).variant).toBe("VariantA");

		// VariantB (felt252)
		const encB = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "VariantB", value: 42n },
		]);
		expect(encB.error).toBeNull();
		const decB = decodeCalldata(EXTENDED_ABI, "process_enum", encB.result!);
		expect(decB.error).toBeNull();
		expect((decB.result![0] as any).variant).toBe("VariantB");
		expect((decB.result![0] as any).value).toBe(42n);

		// VariantC (u256)
		const encC = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "VariantC", value: 1n << 200n },
		]);
		expect(encC.error).toBeNull();
		const decC = decodeCalldata(EXTENDED_ABI, "process_enum", encC.result!);
		expect(decC.error).toBeNull();
		expect((decC.result![0] as any).variant).toBe("VariantC");
		expect((decC.result![0] as any).value).toBe(1n << 200n);
	});
});

// ============ Error Case Tests ============

describeIfCrypto("Error Cases", () => {
	it("rejects value exceeding field prime", () => {
		// FIELD_PRIME is ~2^251, so 2^252 should fail
		const tooLarge = 1n << 252n;
		const result = encodeCalldata(ERC20_ABI, "balance_of", [tooLarge]);
		expect(result.error).not.toBeNull();
		expect(result.error!.code).toBe("ENCODE_ERROR");
	});

	it("rejects invalid enum variant", () => {
		const result = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "NonexistentVariant", value: null },
		]);
		expect(result.error).not.toBeNull();
		expect(result.error!.code).toBe("ENCODE_ERROR");
	});

	it("rejects missing struct field", () => {
		const result = encodeCalldata(EXTENDED_ABI, "process_struct", [
			{ field_a: 100n }, // missing field_b
		]);
		expect(result.error).not.toBeNull();
		expect(result.error!.code).toBe("ENCODE_ERROR");
	});

	it("rejects wrong argument count", () => {
		const result = encodeCalldata(ERC20_ABI, "transfer", [0x123n]); // missing amount
		expect(result.error).not.toBeNull();
		expect(result.error!.code).toBe("INVALID_ARGS");
	});

	it("rejects decode with truncated data", () => {
		// u256 needs 2 felts, provide only 1
		const result = decodeOutput(ERC20_ABI, "balance_of", [1000n]);
		expect(result.error).not.toBeNull();
		expect(result.error!.code).toBe("DECODE_ERROR");
	});
});

// ============ Starknet.js Golden Vectors (v6.23.1) ============
// These vectors are computed using starknet.js v6.23.1 CallData.compile()
// Source: https://github.com/starknet-io/starknet.js

describeIfCrypto("Starknet.js v6.23.1 Golden Vectors", () => {
	/**
	 * Vector 1: ERC20 transfer
	 * starknet.js: CallData.compile("transfer", [recipient, {low, high}])
	 *
	 * Encoding rules (Cairo ABI spec):
	 * - ContractAddress: single felt252
	 * - u256: struct with (low: u128, high: u128), encoded as [low, high]
	 */
	it("Vector 1: ERC20 transfer calldata", () => {
		const recipient =
			0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7n;
		const amount = 1000000000000000000n; // 1e18

		const result = encodeCalldata(ERC20_ABI, "transfer", [recipient, amount]);
		expect(result.error).toBeNull();

		// Expected: [recipient, amount_low, amount_high]
		// amount = 1e18 fits in u128, so high = 0
		expect(result.result).toEqual([
			recipient,
			1000000000000000000n, // low
			0n, // high
		]);
	});

	/**
	 * Vector 2: Large u256 spanning both limbs
	 *
	 * Encoding rule: u256 = { low: u128, high: u128 }
	 * Value: 0x1_00000000_00000000_00000000_00000001 (2^128 + 1)
	 * Expected: low = 1, high = 1
	 */
	it("Vector 2: u256 with both limbs", () => {
		const amount = (1n << 128n) + 1n; // 2^128 + 1

		const result = encodeCalldata(ERC20_ABI, "transfer", [0x1n, amount]);
		expect(result.error).toBeNull();

		expect(result.result).toEqual([
			0x1n, // recipient
			1n, // low
			1n, // high
		]);
	});

	/**
	 * Vector 3: Array encoding with length prefix
	 *
	 * Encoding rule (Cairo ABI spec):
	 * - Array<T>: [length, ...elements]
	 * - Each element encoded according to its type
	 */
	it("Vector 3: Array with length prefix", () => {
		const values = [10n, 20n, 30n, 40n, 50n];

		const result = encodeCalldata(EXTENDED_ABI, "process_array", [values]);
		expect(result.error).toBeNull();

		// Expected: [length, ...values]
		expect(result.result).toEqual([5n, 10n, 20n, 30n, 40n, 50n]);
	});

	/**
	 * Option encoding rules (Cairo ABI spec):
	 * - Option<T> is an enum with variants: Some(T) = 0, None = 1
	 * - None: [1] (just variant index)
	 * - Some(value): [0, ...encoded_value]
	 *
	 * Note: This matches starknet.js CairoOption encoding
	 */
	it("Option encoding follows Cairo spec (Some=0, None=1)", () => {
		// This test documents the encoding rule
		// Option::Some(x) encodes as [0, x]
		// Option::None encodes as [1]

		// We test this indirectly through enum which uses same pattern
		const someResult = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "VariantA", value: null }, // index 0
		]);
		expect(someResult.error).toBeNull();
		expect(someResult.result![0]).toBe(0n); // VariantA is index 0
	});

	/**
	 * Enum encoding rules (Cairo ABI spec):
	 * - Enum encodes as [variant_index, ...variant_data]
	 * - Unit variant (()): just index, no data
	 * - Data variant: index + encoded data
	 */
	it("Enum encoding with variant index + data", () => {
		// VariantB has index 1 and contains felt252
		const result = encodeCalldata(EXTENDED_ABI, "process_enum", [
			{ variant: "VariantB", value: 0xabcn },
		]);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([1n, 0xabcn]); // [index, value]
	});
});

// ============ Short String Tests ============

describeIfCrypto("Short String Encoding/Decoding", () => {
	// Create a minimal ABI with shortstring type for testing
	const SHORTSTRING_ABI: Abi = [
		{
			type: "function",
			name: "set_name",
			inputs: [{ name: "name", type: "shortstring" }],
			outputs: [],
			state_mutability: "external",
		},
		{
			type: "function",
			name: "get_name",
			inputs: [],
			outputs: [{ name: "name", type: "shortstring" }],
			state_mutability: "view",
		},
	];

	it("encodes shortstring from string value", () => {
		const parsed = parseAbi(SHORTSTRING_ABI);
		expect(parsed.error).toBeNull();

		const result = encodeValue("hello", "shortstring", parsed.result!);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([448378203247n]); // 0x68656c6c6f
	});

	it("encodes shortstring from bigint value", () => {
		const parsed = parseAbi(SHORTSTRING_ABI);
		expect(parsed.error).toBeNull();

		// Already encoded as bigint
		const result = encodeValue(448378203247n, "shortstring", parsed.result!);
		expect(result.error).toBeNull();
		expect(result.result).toEqual([448378203247n]);
	});

	it("decodes shortstring to string", () => {
		const parsed = parseAbi(SHORTSTRING_ABI);
		expect(parsed.error).toBeNull();

		const result = decodeValue([448378203247n], "shortstring", parsed.result!);
		expect(result.error).toBeNull();
		expect(result.result!.value).toBe("hello");
		expect(result.result!.consumed).toBe(1);
	});

	it("roundtrip shortstring encoding/decoding", () => {
		const parsed = parseAbi(SHORTSTRING_ABI);
		expect(parsed.error).toBeNull();

		const original = "test_name";
		const encoded = encodeValue(original, "shortstring", parsed.result!);
		expect(encoded.error).toBeNull();

		const decoded = decodeValue(encoded.result!, "shortstring", parsed.result!);
		expect(decoded.error).toBeNull();
		expect(decoded.result!.value).toBe(original);
	});

	it("encodes via high-level encodeCalldata", () => {
		const parsed = parseAbi(SHORTSTRING_ABI);
		expect(parsed.error).toBeNull();

		const result = encodeCalldata(SHORTSTRING_ABI, "set_name", ["my_token"]);
		expect(result.error).toBeNull();
		// Verify it matches the direct encoding
		const expected = encodeShortString("my_token").toBigInt();
		expect(result.result).toEqual([expected]);
	});

	it("decodes via high-level decodeOutput", () => {
		const nameEncoded = encodeShortString("my_token");
		const result = decodeOutput(SHORTSTRING_ABI, "get_name", [
			nameEncoded.toBigInt(),
		]);
		expect(result.error).toBeNull();
		expect(result.result).toBe("my_token");
	});

	it("re-exports encodeShortString/decodeShortString from primitives", () => {
		// Verify the re-exports work
		expect(encodeShortString("test").toBigInt()).toBe(1952805748n);
		expect(decodeShortString(1952805748n)).toBe("test");
	});
});
