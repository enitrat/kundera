import { describe, expect, it } from "vitest";
import type { FeeEstimate } from "../../jsonrpc/types.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import { feeEstimateFromRpc } from "./fromRpc.js";
import { feeEstimateToRpc } from "./toRpc.js";

function canon(hex: string): string {
	return feltFromHex(hex).toHex();
}

describe("FeeEstimate", () => {
	const wire: FeeEstimate = {
		l1_gas_consumed: "0x100",
		l1_gas_price: "0x200",
		l2_gas_consumed: "0x300",
		l2_gas_price: "0x400",
		l1_data_gas_consumed: "0x500",
		l1_data_gas_price: "0x600",
		overall_fee: "0x700",
		unit: "FRI",
	};

	it("fromRpc converts hex to branded Felt252", () => {
		const result = feeEstimateFromRpc(wire);
		expect(result.unit).toBe("FRI");
		expect(result.l1_gas_consumed.toBigInt()).toBe(BigInt("0x100"));
		expect(result.l1_gas_price.toBigInt()).toBe(BigInt("0x200"));
		expect(result.l2_gas_consumed.toBigInt()).toBe(BigInt("0x300"));
		expect(result.l2_gas_price.toBigInt()).toBe(BigInt("0x400"));
		expect(result.l1_data_gas_consumed.toBigInt()).toBe(BigInt("0x500"));
		expect(result.l1_data_gas_price.toBigInt()).toBe(BigInt("0x600"));
		expect(result.overall_fee.toBigInt()).toBe(BigInt("0x700"));
	});

	it("round-trips through toRpc", () => {
		const rich = feeEstimateFromRpc(wire);
		const back = feeEstimateToRpc(rich);
		expect(back.l1_gas_consumed).toBe(canon("0x100"));
		expect(back.l1_gas_price).toBe(canon("0x200"));
		expect(back.l2_gas_consumed).toBe(canon("0x300"));
		expect(back.l2_gas_price).toBe(canon("0x400"));
		expect(back.l1_data_gas_consumed).toBe(canon("0x500"));
		expect(back.l1_data_gas_price).toBe(canon("0x600"));
		expect(back.overall_fee).toBe(canon("0x700"));
		expect(back.unit).toBe("FRI");
	});
});
