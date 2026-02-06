import { describe, it, expect } from "vitest";
import { stateUpdateFromRpc, stateDiffFromRpc } from "./fromRpc.js";
import { stateUpdateToRpc, stateDiffToRpc } from "./toRpc.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import type { StateUpdate, StateDiff } from "../../jsonrpc/types.js";

function canon(hex: string): string {
	return feltFromHex(hex).toHex();
}

const wireStateDiff: StateDiff = {
	storage_diffs: [
		{
			address: "0x01",
			storage_entries: [{ key: "0x10", value: "0x20" }],
		},
	],
	declared_classes: [{ class_hash: "0xc1", compiled_class_hash: "0xc2" }],
	deployed_contracts: [{ address: "0x02", class_hash: "0xd1" }],
	replaced_classes: [{ contract_address: "0x03", class_hash: "0xe1" }],
	nonces: [{ contract_address: "0x04", nonce: "0x05" }],
};

describe("stateDiff", () => {
	it("fromRpc converts all hex fields", () => {
		const result = stateDiffFromRpc(wireStateDiff);
		expect(result.storage_diffs[0]!.address.toBigInt()).toBe(1n);
		expect(result.storage_diffs[0]!.storage_entries[0]!.key.toBigInt()).toBe(
			16n,
		);
		expect(result.declared_classes[0]!.class_hash.toBigInt()).toBe(
			BigInt("0xc1"),
		);
		expect(result.deployed_contracts[0]!.address.toBigInt()).toBe(2n);
		expect(result.replaced_classes[0]!.contract_address.toBigInt()).toBe(3n);
		expect(result.nonces[0]!.nonce.toBigInt()).toBe(5n);
	});

	it("round-trips through toRpc", () => {
		const rich = stateDiffFromRpc(wireStateDiff);
		const back = stateDiffToRpc(rich);
		expect(back.storage_diffs[0]!.address).toBe(canon("0x01"));
		expect(back.storage_diffs[0]!.storage_entries[0]!.key).toBe(canon("0x10"));
		expect(back.declared_classes[0]!.class_hash).toBe(canon("0xc1"));
		expect(back.deployed_contracts[0]!.class_hash).toBe(canon("0xd1"));
		expect(back.replaced_classes[0]!.class_hash).toBe(canon("0xe1"));
		expect(back.nonces[0]!.nonce).toBe(canon("0x05"));
	});
});

describe("stateUpdate", () => {
	const wire: StateUpdate = {
		block_hash: "0xb1",
		old_root: "0xa1",
		new_root: "0xa2",
		state_diff: wireStateDiff,
	};

	it("fromRpc converts top-level fields", () => {
		const result = stateUpdateFromRpc(wire);
		expect(result.block_hash.toBigInt()).toBe(BigInt("0xb1"));
		expect(result.old_root.toBigInt()).toBe(BigInt("0xa1"));
		expect(result.new_root.toBigInt()).toBe(BigInt("0xa2"));
	});

	it("round-trips through toRpc", () => {
		const rich = stateUpdateFromRpc(wire);
		const back = stateUpdateToRpc(rich);
		expect(back.block_hash).toBe(canon("0xb1"));
		expect(back.old_root).toBe(canon("0xa1"));
		expect(back.new_root).toBe(canon("0xa2"));
	});
});
