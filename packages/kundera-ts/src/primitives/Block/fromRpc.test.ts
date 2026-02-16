import { describe, expect, it } from "vitest";
import type {
	BlockWithReceipts,
	BlockWithTxHashes,
	BlockWithTxs,
} from "../../jsonrpc/types.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import {
	blockWithReceiptsFromRpc,
	blockWithTxHashesFromRpc,
	blockWithTxsFromRpc,
} from "./fromRpc.js";
import {
	blockWithReceiptsToRpc,
	blockWithTxHashesToRpc,
	blockWithTxsToRpc,
} from "./toRpc.js";

function canon(hex: string): string {
	return feltFromHex(hex).toHex();
}

const baseHeader = {
	block_hash: "0x03fa",
	parent_hash: "0x03fb",
	block_number: 123,
	new_root: "0x0abc",
	timestamp: 1700000000,
	sequencer_address: "0x01",
	l1_gas_price: { price_in_fri: "0x0a", price_in_wei: "0x0b" },
	l2_gas_price: { price_in_fri: "0x0c", price_in_wei: "0x0d" },
	l1_data_gas_price: { price_in_fri: "0x0e", price_in_wei: "0x0f" },
	l1_da_mode: "BLOB" as const,
	starknet_version: "0.13.0",
	event_commitment: "0x0e1",
	transaction_commitment: "0x0a1",
	receipt_commitment: "0x0b1",
	state_diff_commitment: "0x0c1",
	event_count: 10,
	transaction_count: 5,
	state_diff_length: 20,
};

describe("BlockWithTxHashes", () => {
	const wire: BlockWithTxHashes = {
		...baseHeader,
		status: "ACCEPTED_ON_L2",
		transactions: ["0xaa", "0xbb"],
	};

	it("round-trips", () => {
		const rich = blockWithTxHashesFromRpc(wire);
		expect(rich.status).toBe("ACCEPTED_ON_L2");
		expect(rich.transactions.length).toBe(2);
		expect(rich.transactions[0]?.toBigInt()).toBe(BigInt("0xaa"));
		const back = blockWithTxHashesToRpc(rich);
		expect(back.status).toBe("ACCEPTED_ON_L2");
		expect(back.transactions[0]).toBe(canon("0xaa"));
	});
});

describe("BlockWithTxs", () => {
	const wire: BlockWithTxs = {
		...baseHeader,
		status: "ACCEPTED_ON_L1",
		transactions: [
			{
				type: "INVOKE",
				version: "0x1",
				sender_address: "0x01",
				calldata: ["0x10"],
				max_fee: "0xff",
				signature: ["0xaa"],
				nonce: "0x05",
				transaction_hash: "0xdead",
			},
		],
	} as BlockWithTxs;

	it("round-trips", () => {
		const rich = blockWithTxsFromRpc(wire);
		expect(rich.status).toBe("ACCEPTED_ON_L1");
		expect(rich.transactions.length).toBe(1);
		expect(rich.transactions[0]?.type).toBe("INVOKE");
		const back = blockWithTxsToRpc(rich);
		expect(back.transactions.length).toBe(1);
	});
});

describe("BlockWithReceipts", () => {
	const wire: BlockWithReceipts = {
		...baseHeader,
		status: "ACCEPTED_ON_L2",
		transactions: [
			{
				transaction: {
					type: "INVOKE",
					version: "0x1",
					sender_address: "0x01",
					calldata: ["0x10"],
					max_fee: "0xff",
					signature: ["0xaa"],
					nonce: "0x05",
				},
				receipt: {
					type: "INVOKE",
					transaction_hash: "0xdead",
					actual_fee: { amount: "0x100", unit: "WEI" },
					finality_status: "ACCEPTED_ON_L2",
					messages_sent: [],
					events: [],
					execution_resources: { steps: 100 },
					execution_status: "SUCCEEDED",
				},
			},
		],
	} as BlockWithReceipts;

	it("round-trips", () => {
		const rich = blockWithReceiptsFromRpc(wire);
		expect(rich.status).toBe("ACCEPTED_ON_L2");
		expect(rich.transactions.length).toBe(1);
		expect(rich.transactions[0]?.transaction.type).toBe("INVOKE");
		expect(rich.transactions[0]?.receipt.type).toBe("INVOKE");
		const back = blockWithReceiptsToRpc(rich);
		expect(back.transactions.length).toBe(1);
	});
});
