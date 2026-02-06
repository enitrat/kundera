/**
 * Account Hash + Types Tests
 */

import { describe, it, expect } from "vitest";
import "../test-utils/setupCrypto";
import {
	type ResourceBoundsMapping,
	type InvokeTransactionV3,
	type DeclareTransactionV3,
	type DeployAccountTransactionV3,
	TRANSACTION_VERSION,
	DEFAULT_RESOURCE_BOUNDS,
	TRANSACTION_HASH_PREFIX,
	hashTipAndResourceBounds,
	encodeDAModes,
	hashCalldata,
	computeInvokeV3Hash,
	computeDeclareV3Hash,
	computeDeployAccountV3Hash,
	computeContractAddress,
	computeSelector,
} from "./index.js";
const describeIfCrypto = describe;

describe("account types + constants", () => {
	it("has correct transaction version constants", () => {
		expect(TRANSACTION_VERSION.V3).toBe(3n);
		expect(TRANSACTION_VERSION.V3_QUERY).toBe(
			0x100000000000000000000000000000003n,
		);
	});

	it("has correct default resource bounds", () => {
		expect(DEFAULT_RESOURCE_BOUNDS.l1_gas.max_amount).toBe(0n);
		expect(DEFAULT_RESOURCE_BOUNDS.l2_gas.max_amount).toBe(0n);
		expect(DEFAULT_RESOURCE_BOUNDS.l1_data_gas.max_amount).toBe(0n);
	});

	it("has correct transaction hash prefixes", () => {
		expect(TRANSACTION_HASH_PREFIX.INVOKE).toBe(0x696e766f6b65n);
		expect(TRANSACTION_HASH_PREFIX.DECLARE).toBe(0x6465636c617265n);
		expect(TRANSACTION_HASH_PREFIX.DEPLOY_ACCOUNT).toBe(
			0x6465706c6f795f6163636f756e74n,
		);
	});
});

describeIfCrypto("resource bounds hashing", () => {
	it("hashes tip + resource bounds deterministically", () => {
		const resourceBounds: ResourceBoundsMapping = {
			l1_gas: { max_amount: 10000n, max_price_per_unit: 1000000000n },
			l2_gas: { max_amount: 50000n, max_price_per_unit: 500000000n },
			l1_data_gas: { max_amount: 1000n, max_price_per_unit: 100000000n },
		};

		const hash1 = hashTipAndResourceBounds(0n, resourceBounds);
		const hash2 = hashTipAndResourceBounds(0n, resourceBounds);
		expect(hash1.toHex()).toBe(hash2.toHex());
	});

	it("encodes DA modes correctly", () => {
		expect(encodeDAModes(0, 0)).toBe(0n);
	});
});

describeIfCrypto("calldata hash", () => {
	it("hashes empty calldata", () => {
		const hash = hashCalldata([]);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
		expect(hash.toHex()).toBe(
			"0x02272be0f580fd156823304800919530eaa97430e972d7213ee13f4fbf7a5dbc",
		);
	});

	it("hashes non-empty calldata", () => {
		const hash = hashCalldata([1n, 2n, 3n]);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});
});

describeIfCrypto("transaction hashes", () => {
	const chainId = "0x534e5f5345504f4c4941"; // SN_SEPOLIA
	const senderAddress = "0x123456789abcdef123456789abcdef12345678";

	it("computes invoke hash", () => {
		const tx: InvokeTransactionV3 = {
			version: 3,
			sender_address: senderAddress,
			calldata: [1n, 2n, 3n],
			nonce: 0n,
			resource_bounds: DEFAULT_RESOURCE_BOUNDS,
			tip: 0n,
			paymaster_data: [],
			nonce_data_availability_mode: 0,
			fee_data_availability_mode: 0,
			account_deployment_data: [],
		};

		const hash = computeInvokeV3Hash(tx, chainId);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("computes declare hash", () => {
		const tx: DeclareTransactionV3 = {
			version: 3,
			sender_address: senderAddress,
			class_hash: "0x1234",
			compiled_class_hash: "0x5678",
			nonce: 1n,
			resource_bounds: DEFAULT_RESOURCE_BOUNDS,
			tip: 0n,
			paymaster_data: [],
			nonce_data_availability_mode: 0,
			fee_data_availability_mode: 0,
			account_deployment_data: [],
		};

		const hash = computeDeclareV3Hash(tx, chainId);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("computes deploy account hash", () => {
		const tx: DeployAccountTransactionV3 = {
			version: 3,
			class_hash: "0x1234",
			constructor_calldata: [1n, 2n],
			contract_address_salt: "0x1",
			nonce: 0n,
			resource_bounds: DEFAULT_RESOURCE_BOUNDS,
			tip: 0n,
			paymaster_data: [],
			nonce_data_availability_mode: 0,
			fee_data_availability_mode: 0,
		};

		const address = computeContractAddress(
			tx.class_hash,
			tx.contract_address_salt,
			tx.constructor_calldata,
		);
		const hash = computeDeployAccountV3Hash(tx, address, chainId);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});
});

describeIfCrypto("selector + address helpers", () => {
	it("computes selectors", () => {
		const selector = computeSelector("__execute__");
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});

	it("computes contract address deterministically", () => {
		const classHash = "0x1234";
		const salt = "0x1";
		const calldata = [1n, 2n, 3n];

		const addr1 = computeContractAddress(classHash, salt, calldata);
		const addr2 = computeContractAddress(classHash, salt, calldata);
		expect(addr1.toHex()).toBe(addr2.toHex());
	});

	it("changes contract address when salt changes", () => {
		const classHash = "0x1234";
		const calldata = [1n, 2n, 3n];

		const addr1 = computeContractAddress(classHash, "0x1", calldata);
		const addr2 = computeContractAddress(classHash, "0x2", calldata);
		expect(addr1.toHex()).not.toBe(addr2.toHex());
	});
});
