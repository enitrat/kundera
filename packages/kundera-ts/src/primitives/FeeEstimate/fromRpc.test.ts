import { describe, it, expect } from "vitest";
import { feeEstimateFromRpc } from "./fromRpc.js";
import { feeEstimateToRpc } from "./toRpc.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import type { FeeEstimate } from "../../jsonrpc/types.js";

function canon(hex: string): string {
	return feltFromHex(hex).toHex();
}

describe("FeeEstimate", () => {
	const wire: FeeEstimate = {
		gas_consumed: "0x100",
		gas_price: "0x200",
		data_gas_consumed: "0x300",
		data_gas_price: "0x400",
		overall_fee: "0x500",
		unit: "FRI",
	};

	it("fromRpc converts hex to branded Felt252", () => {
		const result = feeEstimateFromRpc(wire);
		expect(result.unit).toBe("FRI");
		expect(result.gas_consumed.toBigInt()).toBe(BigInt("0x100"));
		expect(result.gas_price.toBigInt()).toBe(BigInt("0x200"));
		expect(result.data_gas_consumed.toBigInt()).toBe(BigInt("0x300"));
		expect(result.data_gas_price.toBigInt()).toBe(BigInt("0x400"));
		expect(result.overall_fee.toBigInt()).toBe(BigInt("0x500"));
	});

	it("round-trips through toRpc", () => {
		const rich = feeEstimateFromRpc(wire);
		const back = feeEstimateToRpc(rich);
		expect(back.gas_consumed).toBe(canon("0x100"));
		expect(back.gas_price).toBe(canon("0x200"));
		expect(back.data_gas_consumed).toBe(canon("0x300"));
		expect(back.data_gas_price).toBe(canon("0x400"));
		expect(back.overall_fee).toBe(canon("0x500"));
		expect(back.unit).toBe("FRI");
	});
});
