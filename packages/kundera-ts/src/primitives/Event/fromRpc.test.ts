import { describe, it, expect } from "vitest";
import { eventFromRpc, emittedEventFromRpc } from "./fromRpc.js";
import { eventToRpc, emittedEventToRpc } from "./toRpc.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import type { Event, EmittedEvent } from "../../jsonrpc/types.js";

function canon(hex: string): string {
	return feltFromHex(hex).toHex();
}

describe("Event", () => {
	const wire: Event = {
		from_address: "0x01",
		keys: ["0x02", "0x03"],
		data: ["0x04"],
	};

	it("fromRpc converts hex fields to branded types", () => {
		const result = eventFromRpc(wire);
		expect(result.from_address.toBigInt()).toBe(1n);
		expect(result.keys.length).toBe(2);
		expect(result.keys[0]!.toBigInt()).toBe(2n);
		expect(result.data[0]!.toBigInt()).toBe(4n);
	});

	it("round-trips through toRpc", () => {
		const rich = eventFromRpc(wire);
		const back = eventToRpc(rich);
		expect(back.from_address).toBe(canon("0x01"));
		expect(back.keys.length).toBe(2);
		expect(back.data.length).toBe(1);
	});
});

describe("EmittedEvent", () => {
	const wire: EmittedEvent = {
		from_address: "0x01",
		keys: ["0x02"],
		data: ["0x03"],
		block_hash: "0x0b0",
		block_number: 99,
		transaction_hash: "0x0a0",
	};

	it("fromRpc includes block info", () => {
		const result = emittedEventFromRpc(wire);
		expect(result.block_number).toBe(99);
		expect(result.block_hash.toBigInt()).toBe(BigInt("0x0b0"));
		expect(result.transaction_hash.toBigInt()).toBe(BigInt("0x0a0"));
	});

	it("round-trips through toRpc", () => {
		const rich = emittedEventFromRpc(wire);
		const back = emittedEventToRpc(rich);
		expect(back.block_number).toBe(99);
		expect(back.block_hash).toBe(canon("0x0b0"));
		expect(back.transaction_hash).toBe(canon("0x0a0"));
	});
});
