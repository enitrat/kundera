/**
 * SNIP-12 Tests
 *
 * Comprehensive tests for typed structured data hashing on Starknet.
 */

import { describe, expect, it, beforeAll } from "vitest";
import { isNativeAvailable, loadWasmCrypto } from "../index.js";
import {
	SNIP12,
	encodeType,
	hashType,
	hashStruct,
	hashDomain,
	hashTypedData,
	Snip12TypeNotFoundError,
	Snip12InvalidMessageError,
	Snip12InvalidDomainError,
	Snip12EncodingError,
} from "./index.js";
import type { Domain, TypeDefinitions, TypedData } from "./types.js";
import { Felt252 } from "../../primitives/index.js";

// Crypto readiness is ensured by beforeAll below

describe("SNIP-12 - Typed Structured Data Hashing", () => {
	beforeAll(async () => {
		if (!isNativeAvailable()) {
			await loadWasmCrypto();
		}
	});

	describe("Type Encoding", () => {
		it("should encode simple type", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "shortstring" },
					{ name: "wallet", type: "ContractAddress" },
				],
			};

			const encoded = encodeType("Person", types);

			expect(encoded).toBe("Person(shortstring name,ContractAddress wallet)");
		});

		it("should encode nested custom types", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "shortstring" },
					{ name: "wallet", type: "ContractAddress" },
				],
				Mail: [
					{ name: "from", type: "Person" },
					{ name: "to", type: "Person" },
					{ name: "contents", type: "shortstring" },
				],
			};

			const encoded = encodeType("Mail", types);

			// Should include both Mail and Person type definitions
			expect(encoded).toContain("Mail(");
			expect(encoded).toContain("Person from");
			expect(encoded).toContain("Person to");
			expect(encoded).toContain("shortstring contents");
			expect(encoded).toContain("Person(");
		});

		it("should handle multiple nested types in alphabetical order", () => {
			const types: TypeDefinitions = {
				Address: [
					{ name: "street", type: "shortstring" },
					{ name: "city", type: "shortstring" },
				],
				Person: [
					{ name: "name", type: "shortstring" },
					{ name: "home", type: "Address" },
				],
			};

			const encoded = encodeType("Person", types);

			expect(encoded).toContain("Person(");
			expect(encoded).toContain("Address(");
			// Address should come after Person (referenced types are appended)
			expect(encoded.indexOf("Person(")).toBeLessThan(
				encoded.indexOf("Address("),
			);
		});

		it("should throw for non-existent type", () => {
			const types: TypeDefinitions = {};

			expect(() => encodeType("NonExistent", types)).toThrow(
				Snip12TypeNotFoundError,
			);
		});

		it("should handle type with array field", () => {
			const types: TypeDefinitions = {
				Group: [
					{ name: "name", type: "shortstring" },
					{ name: "members", type: "ContractAddress*" },
				],
			};

			const encoded = encodeType("Group", types);

			expect(encoded).toContain("ContractAddress* members");
		});
	});

	describe("Type Hash", () => {
		it("should compute type hash", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "shortstring" },
					{ name: "wallet", type: "ContractAddress" },
				],
			};

			const typeHash = hashType("Person", types);

			expect(typeHash).toBeDefined();
			expect(typeHash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should be deterministic", () => {
			const types: TypeDefinitions = {
				Message: [{ name: "content", type: "shortstring" }],
			};

			const hash1 = hashType("Message", types);
			const hash2 = hashType("Message", types);

			expect(hash1.toBigInt()).toBe(hash2.toBigInt());
		});

		it("should produce different hashes for different types", () => {
			const types: TypeDefinitions = {
				TypeA: [{ name: "x", type: "felt" }],
				TypeB: [{ name: "y", type: "felt" }],
			};

			const hashA = hashType("TypeA", types);
			const hashB = hashType("TypeB", types);

			expect(hashA.toBigInt()).not.toBe(hashB.toBigInt());
		});
	});

	describe("Domain Hashing", () => {
		it("should hash domain with all fields", () => {
			const domain: Domain = {
				name: "TestDomain",
				version: "1",
				chainId: "SN_MAIN",
				revision: "1",
			};

			const hash = hashDomain(domain);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should hash domain with minimal fields", () => {
			const domain: Domain = {
				name: "Minimal",
			};

			const hash = hashDomain(domain);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should produce different hashes for different domains", () => {
			const domain1: Domain = { name: "App1", chainId: "SN_MAIN" };
			const domain2: Domain = { name: "App2", chainId: "SN_MAIN" };

			const hash1 = hashDomain(domain1);
			const hash2 = hashDomain(domain2);

			expect(hash1.toBigInt()).not.toBe(hash2.toBigInt());
		});

		it("should be deterministic", () => {
			const domain: Domain = {
				name: "TestApp",
				version: "1.0",
				chainId: "SN_SEPOLIA",
			};

			const hash1 = hashDomain(domain);
			const hash2 = hashDomain(domain);

			expect(hash1.toBigInt()).toBe(hash2.toBigInt());
		});

		it("should handle different chainId values", () => {
			const domain1: Domain = { name: "App", chainId: "SN_MAIN" };
			const domain2: Domain = { name: "App", chainId: "SN_SEPOLIA" };

			const hash1 = hashDomain(domain1);
			const hash2 = hashDomain(domain2);

			expect(hash1.toBigInt()).not.toBe(hash2.toBigInt());
		});
	});

	describe("Domain Validation", () => {
		it("should reject non-string name", () => {
			const domain = { name: 123 } as unknown as Domain;

			expect(() => hashDomain(domain)).toThrow(Snip12InvalidDomainError);
			expect(() => hashDomain(domain)).toThrow("'name' must be a string");
		});

		it("should reject non-string version", () => {
			const domain = { name: "App", version: 1 } as unknown as Domain;

			expect(() => hashDomain(domain)).toThrow(Snip12InvalidDomainError);
			expect(() => hashDomain(domain)).toThrow("'version' must be a string");
		});

		it("should reject non-string chainId", () => {
			const domain = { name: "App", chainId: 1 } as unknown as Domain;

			expect(() => hashDomain(domain)).toThrow(Snip12InvalidDomainError);
			expect(() => hashDomain(domain)).toThrow("'chainId' must be a string");
		});

		it("should reject unknown domain fields", () => {
			const domain = { name: "App", invalidField: "bad" } as unknown as Domain;

			expect(() => hashDomain(domain)).toThrow(Snip12InvalidDomainError);
			expect(() => hashDomain(domain)).toThrow("Unknown domain field");
		});

		it("should reject name longer than 31 characters", () => {
			const domain = { name: "a".repeat(32) };

			expect(() => hashDomain(domain)).toThrow(Snip12InvalidDomainError);
			expect(() => hashDomain(domain)).toThrow("<= 31 characters");
		});
	});

	describe("Struct Hashing", () => {
		it("should hash simple struct", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "shortstring" },
					{ name: "age", type: "u64" },
				],
			};

			const data = {
				name: "Alice",
				age: 30n,
			};

			const hash = hashStruct("Person", data, types);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should hash nested struct", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "shortstring" },
					{ name: "wallet", type: "ContractAddress" },
				],
				Mail: [
					{ name: "from", type: "Person" },
					{ name: "to", type: "Person" },
					{ name: "contents", type: "shortstring" },
				],
			};

			const data = {
				from: {
					name: "Alice",
					wallet:
						"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
				},
				to: {
					name: "Bob",
					wallet:
						"0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
				},
				contents: "Hello!",
			};

			const hash = hashStruct("Mail", data, types);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should be deterministic", () => {
			const types: TypeDefinitions = {
				Message: [{ name: "text", type: "shortstring" }],
			};

			const data = { text: "Hello" };

			const hash1 = hashStruct("Message", data, types);
			const hash2 = hashStruct("Message", data, types);

			expect(hash1.toBigInt()).toBe(hash2.toBigInt());
		});

		it("should throw for missing field", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "shortstring" },
					{ name: "age", type: "u64" },
				],
			};

			const incompleteData = {
				name: "Alice",
				// missing age
			};

			expect(() => hashStruct("Person", incompleteData, types)).toThrow(
				Snip12InvalidMessageError,
			);
		});

		it("should handle u256 (two felts)", () => {
			const types: TypeDefinitions = {
				Transfer: [
					{ name: "recipient", type: "ContractAddress" },
					{ name: "amount", type: "u256" },
				],
			};

			const data = {
				recipient: "0x123",
				amount: 2n ** 200n, // Large u256 value
			};

			const hash = hashStruct("Transfer", data, types);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should handle arrays", () => {
			const types: TypeDefinitions = {
				Group: [
					{ name: "name", type: "shortstring" },
					{ name: "members", type: "ContractAddress*" },
				],
			};

			const data = {
				name: "Team",
				members: ["0x111", "0x222", "0x333"],
			};

			const hash = hashStruct("Group", data, types);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});
	});

	describe("Typed Data Hashing", () => {
		it("should hash complete typed data - simple example", () => {
			const typedData: TypedData = {
				domain: {
					name: "TestApp",
					version: "1",
					chainId: "SN_MAIN",
				},
				types: {
					Message: [{ name: "content", type: "shortstring" }],
				},
				primaryType: "Message",
				message: {
					content: "Hello, SNIP-12!",
				},
			};

			const accountAddress = "0x1234567890abcdef";
			const hash = hashTypedData(typedData, accountAddress);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should hash typed data - Transfer example", () => {
			const typedData: TypedData = {
				domain: {
					name: "MyToken",
					version: "1",
					chainId: "SN_MAIN",
				},
				types: {
					Transfer: [
						{ name: "recipient", type: "ContractAddress" },
						{ name: "amount", type: "u256" },
						{ name: "nonce", type: "u64" },
					],
				},
				primaryType: "Transfer",
				message: {
					recipient: "0xaabbccdd",
					amount: 1000000000000000000n, // 1 token (18 decimals)
					nonce: 0n,
				},
			};

			const accountAddress = "0x1234";
			const hash = hashTypedData(typedData, accountAddress);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should hash typed data - nested Mail example", () => {
			const typedData: TypedData = {
				domain: {
					name: "Starknet Mail",
					version: "1",
					chainId: "SN_SEPOLIA",
				},
				types: {
					Person: [
						{ name: "name", type: "shortstring" },
						{ name: "wallet", type: "ContractAddress" },
					],
					Mail: [
						{ name: "from", type: "Person" },
						{ name: "to", type: "Person" },
						{ name: "contents", type: "shortstring" },
					],
				},
				primaryType: "Mail",
				message: {
					from: {
						name: "Alice",
						wallet: "0xaaaa",
					},
					to: {
						name: "Bob",
						wallet: "0xbbbb",
					},
					contents: "Hello, Bob!",
				},
			};

			const accountAddress = "0x1234";
			const hash = hashTypedData(typedData, accountAddress);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should be deterministic", () => {
			const typedData: TypedData = {
				domain: { name: "App", chainId: "SN_MAIN" },
				types: {
					Message: [{ name: "text", type: "shortstring" }],
				},
				primaryType: "Message",
				message: { text: "test" },
			};

			const account = "0x1234";
			const hash1 = hashTypedData(typedData, account);
			const hash2 = hashTypedData(typedData, account);

			expect(hash1.toBigInt()).toBe(hash2.toBigInt());
		});

		it("should produce different hashes for different messages", () => {
			const typedData1: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "shortstring" }] },
				primaryType: "Message",
				message: { text: "message1" },
			};

			const typedData2: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "shortstring" }] },
				primaryType: "Message",
				message: { text: "message2" },
			};

			const account = "0x1234";
			const hash1 = hashTypedData(typedData1, account);
			const hash2 = hashTypedData(typedData2, account);

			expect(hash1.toBigInt()).not.toBe(hash2.toBigInt());
		});

		it("should produce different hashes for different domains", () => {
			const typedData1: TypedData = {
				domain: { name: "App1" },
				types: { Message: [{ name: "text", type: "shortstring" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const typedData2: TypedData = {
				domain: { name: "App2" },
				types: { Message: [{ name: "text", type: "shortstring" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const account = "0x1234";
			const hash1 = hashTypedData(typedData1, account);
			const hash2 = hashTypedData(typedData2, account);

			expect(hash1.toBigInt()).not.toBe(hash2.toBigInt());
		});

		it("should produce different hashes for different accounts", () => {
			const typedData: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "shortstring" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const hash1 = hashTypedData(typedData, "0x1111");
			const hash2 = hashTypedData(typedData, "0x2222");

			expect(hash1.toBigInt()).not.toBe(hash2.toBigInt());
		});

		it("should accept Felt252 as account address", () => {
			const typedData: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "shortstring" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const account = Felt252("0x1234");
			const hash = hashTypedData(typedData, account);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should accept bigint as account address", () => {
			const typedData: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "shortstring" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const hash = hashTypedData(typedData, 0x1234n);

			expect(hash).toBeDefined();
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});
	});

	describe("Value Encoding - Integers", () => {
		it("should encode u8", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "value", type: "u8" }],
			};

			const hash = hashStruct("Test", { value: 255 }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode u16", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "value", type: "u16" }],
			};

			const hash = hashStruct("Test", { value: 65535n }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode u32", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "value", type: "u32" }],
			};

			const hash = hashStruct("Test", { value: 4294967295n }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode u64", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "value", type: "u64" }],
			};

			const hash = hashStruct("Test", { value: 2n ** 64n - 1n }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode u128", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "value", type: "u128" }],
			};

			const hash = hashStruct("Test", { value: 2n ** 128n - 1n }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode u256", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "value", type: "u256" }],
			};

			const hash = hashStruct("Test", { value: 2n ** 256n - 1n }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode i8", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "value", type: "i8" }],
			};

			const hash = hashStruct("Test", { value: -128n }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode i128", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "value", type: "i128" }],
			};

			const hash = hashStruct("Test", { value: -(2n ** 127n) }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});
	});

	describe("Value Encoding - Addresses", () => {
		it("should encode ContractAddress", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "addr", type: "ContractAddress" }],
			};

			const hash = hashStruct("Test", { addr: "0x1234abcd" }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode ClassHash", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "hash", type: "ClassHash" }],
			};

			const hash = hashStruct("Test", { hash: "0xabcdef123456" }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});
	});

	describe("Value Encoding - Strings", () => {
		it("should encode shortstring", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "text", type: "shortstring" }],
			};

			const hash = hashStruct("Test", { text: "hello" }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should reject shortstring > 31 chars", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "text", type: "shortstring" }],
			};

			expect(() => hashStruct("Test", { text: "a".repeat(32) }, types)).toThrow(
				Snip12EncodingError,
			);
		});

		it("should encode string (ByteArray)", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "text", type: "string" }],
			};

			const hash = hashStruct(
				"Test",
				{ text: "Hello, this is a longer string!" },
				types,
			);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});
	});

	describe("Value Encoding - Other Types", () => {
		it("should encode felt", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "f", type: "felt" }],
			};

			const hash = hashStruct("Test", { f: 12345n }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode felt252", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "f", type: "felt252" }],
			};

			const hash = hashStruct("Test", { f: "0x1234" }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode bool true", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "flag", type: "bool" }],
			};

			const hash = hashStruct("Test", { flag: true }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode bool false", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "flag", type: "bool" }],
			};

			const hash = hashStruct("Test", { flag: false }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should produce different hashes for true vs false", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "flag", type: "bool" }],
			};

			const hashTrue = hashStruct("Test", { flag: true }, types);
			const hashFalse = hashStruct("Test", { flag: false }, types);

			expect(hashTrue.toBigInt()).not.toBe(hashFalse.toBigInt());
		});

		it("should encode selector", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "sel", type: "selector" }],
			};

			const hash = hashStruct("Test", { sel: "transfer" }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode timestamp", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "ts", type: "timestamp" }],
			};

			const hash = hashStruct("Test", { ts: 1700000000n }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});
	});

	describe("Value Encoding - Arrays", () => {
		it("should encode empty array", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "arr", type: "u64*" }],
			};

			const hash = hashStruct("Test", { arr: [] }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode felt array", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "arr", type: "felt*" }],
			};

			const hash = hashStruct("Test", { arr: [1n, 2n, 3n] }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode u256 array", () => {
			const types: TypeDefinitions = {
				Test: [{ name: "arr", type: "u256*" }],
			};

			const hash = hashStruct("Test", { arr: [100n, 200n, 2n ** 200n] }, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should encode struct array", () => {
			const types: TypeDefinitions = {
				Item: [{ name: "id", type: "u64" }],
				Test: [{ name: "items", type: "Item*" }],
			};

			const hash = hashStruct(
				"Test",
				{
					items: [{ id: 1n }, { id: 2n }, { id: 3n }],
				},
				types,
			);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});
	});

	describe("SNIP12 Namespace", () => {
		it("should export all functions on namespace", () => {
			expect(SNIP12.encodeType).toBe(encodeType);
			expect(SNIP12.hashType).toBe(hashType);
			expect(SNIP12.hashStruct).toBe(hashStruct);
			expect(SNIP12.hashDomain).toBe(hashDomain);
			expect(SNIP12.hashTypedData).toBe(hashTypedData);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty domain", () => {
			const domain: Domain = {};
			// Empty domain should still work (all fields optional)
			expect(() => hashDomain(domain)).not.toThrow();
		});

		it("should handle deeply nested structures", () => {
			const types: TypeDefinitions = {
				Level3: [{ name: "value", type: "u64" }],
				Level2: [{ name: "nested", type: "Level3" }],
				Level1: [{ name: "nested", type: "Level2" }],
			};

			const data = {
				nested: {
					nested: {
						value: 42n,
					},
				},
			};

			const hash = hashStruct("Level1", data, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});

		it("should handle type with many fields", () => {
			const types: TypeDefinitions = {
				ManyFields: Array.from({ length: 20 }, (_, i) => ({
					name: `field${i}`,
					type: "u64",
				})),
			};

			const data = Object.fromEntries(
				Array.from({ length: 20 }, (_, i) => [`field${i}`, BigInt(i)]),
			);

			const hash = hashStruct("ManyFields", data, types);
			expect(hash.toBigInt()).toBeGreaterThan(0n);
		});
	});
});
