import type { Felt252Type } from "../Felt252/types.js";

export interface FeeEstimateType {
	gas_consumed: Felt252Type;
	gas_price: Felt252Type;
	data_gas_consumed: Felt252Type;
	data_gas_price: Felt252Type;
	overall_fee: Felt252Type;
	unit: "WEI" | "FRI";
}
