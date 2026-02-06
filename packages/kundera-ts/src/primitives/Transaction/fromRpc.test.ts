import { describe, it, expect } from "vitest";
import {
	transactionFromRpc,
	txnFromRpc,
	resourceBoundsFromRpc,
	resourceBoundsMappingFromRpc,
} from "./fromRpc.js";
import {
	transactionToRpc,
	txnToRpc,
	resourceBoundsToRpc,
	resourceBoundsMappingToRpc,
} from "./toRpc.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import type {
	TxnWithHash,
	L1HandlerTxn,
	DeclareTxnV2,
	DeployAccountTxnV1,
	ResourceBounds,
	ResourceBoundsMapping,
} from "../../jsonrpc/types.js";

function canon(hex: string): string {
	return feltFromHex(hex).toHex();
}

describe("resourceBounds", () => {
	const wire: ResourceBounds = {
		max_amount: "0x10",
		max_price_per_unit: "0x20",
	};

	it("round-trips", () => {
		const rich = resourceBoundsFromRpc(wire);
		expect(rich.max_amount.toBigInt()).toBe(16n);
		const back = resourceBoundsToRpc(rich);
		expect(back.max_amount).toBe(canon("0x10"));
	});
});

describe("resourceBoundsMapping", () => {
	const wire: ResourceBoundsMapping = {
		l1_gas: { max_amount: "0x10", max_price_per_unit: "0x20" },
		l2_gas: { max_amount: "0x30", max_price_per_unit: "0x40" },
	};

	it("round-trips", () => {
		const rich = resourceBoundsMappingFromRpc(wire);
		expect(rich.l1_gas.max_amount.toBigInt()).toBe(16n);
		expect(rich.l2_gas.max_amount.toBigInt()).toBe(48n);
		const back = resourceBoundsMappingToRpc(rich);
		expect(back.l1_gas.max_amount).toBe(canon("0x10"));
		expect(back.l2_gas.max_amount).toBe(canon("0x30"));
	});
});

describe("Invoke V1 transaction", () => {
	const wire: TxnWithHash = {
		type: "INVOKE",
		version: "0x1",
		sender_address: "0x01",
		calldata: ["0x10", "0x20"],
		max_fee: "0xff",
		signature: ["0xaa", "0xbb"],
		nonce: "0x05",
		transaction_hash: "0xdead",
	} as TxnWithHash;

	it("round-trips with hash", () => {
		const rich = transactionFromRpc(wire);
		expect(rich.transaction_hash.toBigInt()).toBe(BigInt("0xdead"));
		expect(rich.type).toBe("INVOKE");
		const back = transactionToRpc(rich);
		expect(back.transaction_hash).toBe(canon("0xdead"));
		expect(back.type).toBe("INVOKE");
	});
});

describe("L1Handler transaction", () => {
	const wire: L1HandlerTxn = {
		type: "L1_HANDLER",
		version: "0x0",
		nonce: "0x01",
		contract_address: "0x02",
		entry_point_selector: "0x03",
		calldata: ["0x04"],
	};

	it("round-trips", () => {
		const rich = txnFromRpc(wire);
		expect(rich.type).toBe("L1_HANDLER");
		const back = txnToRpc(rich);
		expect(back.type).toBe("L1_HANDLER");
		expect((back as L1HandlerTxn).nonce).toBe(canon("0x01"));
	});
});

describe("Declare V2 transaction", () => {
	const wire: DeclareTxnV2 = {
		type: "DECLARE",
		version: "0x2",
		sender_address: "0x01",
		compiled_class_hash: "0xcc",
		max_fee: "0xff",
		signature: ["0xaa"],
		nonce: "0x05",
		class_hash: "0xbb",
	};

	it("round-trips", () => {
		const rich = txnFromRpc(wire);
		expect(rich.type).toBe("DECLARE");
		const back = txnToRpc(rich);
		expect(back.type).toBe("DECLARE");
	});
});

describe("DeployAccount V1 transaction", () => {
	const wire: DeployAccountTxnV1 = {
		type: "DEPLOY_ACCOUNT",
		version: "0x1",
		max_fee: "0xff",
		signature: ["0xaa"],
		nonce: "0x01",
		contract_address_salt: "0x10",
		constructor_calldata: ["0x20"],
		class_hash: "0xcc",
	};

	it("round-trips", () => {
		const rich = txnFromRpc(wire);
		expect(rich.type).toBe("DEPLOY_ACCOUNT");
		const back = txnToRpc(rich);
		expect(back.type).toBe("DEPLOY_ACCOUNT");
		expect((back as DeployAccountTxnV1).contract_address_salt).toBe(
			canon("0x10"),
		);
	});
});
