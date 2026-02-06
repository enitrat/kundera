import { describe, it, expect } from "vitest";
import {
	receiptFromRpc,
	receiptWithBlockInfoFromRpc,
	feePaymentFromRpc,
	msgToL1FromRpc,
} from "./fromRpc.js";
import {
	receiptToRpc,
	receiptWithBlockInfoToRpc,
	feePaymentToRpc,
	msgToL1ToRpc,
} from "./toRpc.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import type {
	TxnReceipt,
	TxnReceiptWithBlockInfo,
	FeePayment,
	MsgToL1,
} from "../../jsonrpc/types.js";

function canon(hex: string): string {
	return feltFromHex(hex).toHex();
}

describe("feePayment", () => {
	const wire: FeePayment = { amount: "0x100", unit: "WEI" };

	it("round-trips", () => {
		const rich = feePaymentFromRpc(wire);
		expect(rich.amount.toBigInt()).toBe(256n);
		expect(rich.unit).toBe("WEI");
		const back = feePaymentToRpc(rich);
		expect(back.amount).toBe(canon("0x100"));
		expect(back.unit).toBe("WEI");
	});
});

describe("msgToL1", () => {
	const wire: MsgToL1 = {
		from_address: "0x01",
		to_address: "0x02",
		payload: ["0x03", "0x04"],
	};

	it("round-trips", () => {
		const rich = msgToL1FromRpc(wire);
		expect(rich.from_address.toBigInt()).toBe(1n);
		expect(rich.to_address.toBigInt()).toBe(2n);
		expect(rich.payload.length).toBe(2);
		const back = msgToL1ToRpc(rich);
		expect(back.from_address).toBe(canon("0x01"));
		expect(back.to_address).toBe(canon("0x02"));
	});
});

describe("receipt", () => {
	const invokeReceipt: TxnReceipt = {
		type: "INVOKE",
		transaction_hash: "0xdead",
		actual_fee: { amount: "0x100", unit: "WEI" },
		finality_status: "ACCEPTED_ON_L2",
		messages_sent: [],
		events: [{ from_address: "0x01", keys: ["0x02"], data: ["0x03"] }],
		execution_resources: { steps: 100 },
		execution_status: "SUCCEEDED",
	} as TxnReceipt;

	it("INVOKE round-trips", () => {
		const rich = receiptFromRpc(invokeReceipt);
		expect(rich.type).toBe("INVOKE");
		expect(rich.transaction_hash.toBigInt()).toBe(BigInt("0xdead"));
		expect(rich.events.length).toBe(1);
		const back = receiptToRpc(rich);
		expect(back.type).toBe("INVOKE");
		expect(back.transaction_hash).toBe(canon("0xdead"));
	});

	const deployReceipt: TxnReceipt = {
		type: "DEPLOY_ACCOUNT",
		transaction_hash: "0xbeef",
		actual_fee: { amount: "0x200", unit: "FRI" },
		finality_status: "ACCEPTED_ON_L1",
		messages_sent: [],
		events: [],
		execution_resources: { steps: 50 },
		execution_status: "SUCCEEDED",
		contract_address: "0xca",
	} as TxnReceipt;

	it("DEPLOY_ACCOUNT includes contract_address", () => {
		const rich = receiptFromRpc(deployReceipt);
		expect(rich.type).toBe("DEPLOY_ACCOUNT");
		if (rich.type === "DEPLOY_ACCOUNT") {
			expect(rich.contract_address.toBigInt()).toBe(BigInt("0xca"));
		}
		const back = receiptToRpc(rich);
		if (back.type === "DEPLOY_ACCOUNT") {
			expect((back as any).contract_address).toBe(canon("0xca"));
		}
	});
});

describe("receiptWithBlockInfo", () => {
	const wire: TxnReceiptWithBlockInfo = {
		type: "INVOKE",
		transaction_hash: "0xdead",
		actual_fee: { amount: "0x100", unit: "WEI" },
		finality_status: "ACCEPTED_ON_L2",
		messages_sent: [],
		events: [],
		execution_resources: { steps: 100 },
		execution_status: "SUCCEEDED",
		block_hash: "0xb1",
		block_number: 42,
	} as TxnReceiptWithBlockInfo;

	it("round-trips block info", () => {
		const rich = receiptWithBlockInfoFromRpc(wire);
		expect(rich.block_hash?.toBigInt()).toBe(BigInt("0xb1"));
		expect(rich.block_number).toBe(42);
		const back = receiptWithBlockInfoToRpc(rich);
		expect(back.block_hash).toBe(canon("0xb1"));
		expect(back.block_number).toBe(42);
	});
});
