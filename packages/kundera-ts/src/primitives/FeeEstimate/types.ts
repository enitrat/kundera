import type { Felt252Type } from "../Felt252/types.js";

export interface FeeEstimateType {
	l1_gas_consumed: Felt252Type;
	l1_gas_price: Felt252Type;
	l2_gas_consumed: Felt252Type;
	l2_gas_price: Felt252Type;
	l1_data_gas_consumed: Felt252Type;
	l1_data_gas_price: Felt252Type;
	overall_fee: Felt252Type;
	unit: "WEI" | "FRI";
}
