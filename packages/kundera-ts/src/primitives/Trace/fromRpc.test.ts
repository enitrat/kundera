import { describe, it, expect } from "vitest";
import {
	orderedEventFromRpc,
	orderedMessageFromRpc,
	functionInvocationFromRpc,
	revertibleFunctionInvocationFromRpc,
	transactionTraceFromRpc,
} from "./fromRpc.js";
import {
	orderedEventToRpc,
	orderedMessageToRpc,
	functionInvocationToRpc,
	revertibleFunctionInvocationToRpc,
	transactionTraceToRpc,
} from "./toRpc.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import type {
	FunctionInvocation,
	InvokeTxnTrace,
	L1HandlerTxnTrace,
} from "../../jsonrpc/types.js";

function canon(hex: string): string {
	return feltFromHex(hex).toHex();
}

describe("orderedEvent", () => {
	it("round-trips", () => {
		const wire = { order: 0, keys: ["0x01", "0x02"], data: ["0x03"] };
		const rich = orderedEventFromRpc(wire);
		expect(rich.order).toBe(0);
		expect(rich.keys[0]!.toBigInt()).toBe(1n);
		const back = orderedEventToRpc(rich);
		expect(back.order).toBe(0);
		expect(back.keys[0]!).toBe(canon("0x01"));
	});
});

describe("orderedMessage", () => {
	it("round-trips", () => {
		const wire = { order: 1, to_address: "0x0a", payload: ["0x0b"] };
		const rich = orderedMessageFromRpc(wire);
		expect(rich.order).toBe(1);
		expect(rich.to_address.toBigInt()).toBe(10n);
		const back = orderedMessageToRpc(rich);
		expect(back.to_address).toBe(canon("0x0a"));
	});
});

const wireFnInvocation: FunctionInvocation = {
	contract_address: "0x01",
	entry_point_selector: "0x02",
	calldata: ["0x03"],
	caller_address: "0x04",
	class_hash: "0x05",
	entry_point_type: "EXTERNAL",
	call_type: "CALL",
	result: ["0x06"],
	calls: [],
	events: [{ order: 0, keys: ["0x07"], data: ["0x08"] }],
	messages: [],
	execution_resources: { l1_gas: 10, l2_gas: 20 },
};

describe("functionInvocation", () => {
	it("round-trips", () => {
		const rich = functionInvocationFromRpc(wireFnInvocation);
		expect(rich.contract_address.toBigInt()).toBe(1n);
		expect(rich.entry_point_selector.toBigInt()).toBe(2n);
		expect(rich.events.length).toBe(1);
		const back = functionInvocationToRpc(rich);
		expect(back.contract_address).toBe(canon("0x01"));
		expect(back.events[0]!.keys[0]!).toBe(canon("0x07"));
	});
});

describe("revertibleFunctionInvocation", () => {
	it("handles revert", () => {
		const wire = { revert_reason: "out of gas" };
		const rich = revertibleFunctionInvocationFromRpc(wire);
		expect("revert_reason" in rich).toBe(true);
		const back = revertibleFunctionInvocationToRpc(rich);
		expect("revert_reason" in back).toBe(true);
	});

	it("handles success", () => {
		const rich = revertibleFunctionInvocationFromRpc(wireFnInvocation);
		expect("revert_reason" in rich).toBe(false);
	});
});

describe("transactionTrace", () => {
	it("INVOKE round-trips", () => {
		const wire: InvokeTxnTrace = {
			type: "INVOKE",
			execute_invocation: wireFnInvocation,
			execution_resources: { steps: 100 },
		} as InvokeTxnTrace;
		const rich = transactionTraceFromRpc(wire);
		expect(rich.type).toBe("INVOKE");
		const back = transactionTraceToRpc(rich);
		expect(back.type).toBe("INVOKE");
	});

	it("L1_HANDLER round-trips", () => {
		const wire: L1HandlerTxnTrace = {
			type: "L1_HANDLER",
			function_invocation: wireFnInvocation,
			execution_resources: { steps: 50 },
		} as L1HandlerTxnTrace;
		const rich = transactionTraceFromRpc(wire);
		expect(rich.type).toBe("L1_HANDLER");
		const back = transactionTraceToRpc(rich);
		expect(back.type).toBe("L1_HANDLER");
	});

	it("INVOKE with revert", () => {
		const wire: InvokeTxnTrace = {
			type: "INVOKE",
			execute_invocation: { revert_reason: "failed" },
			execution_resources: { steps: 10 },
		} as InvokeTxnTrace;
		const rich = transactionTraceFromRpc(wire);
		if (rich.type === "INVOKE") {
			expect("revert_reason" in rich.execute_invocation).toBe(true);
		}
	});
});
