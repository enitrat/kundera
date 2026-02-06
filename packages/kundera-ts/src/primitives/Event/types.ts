import type { Felt252Type } from "../Felt252/types.js";
import type { ContractAddressType } from "../ContractAddress/types.js";

export interface EventType {
	from_address: ContractAddressType;
	keys: Felt252Type[];
	data: Felt252Type[];
}

export interface EmittedEventType extends EventType {
	block_hash: Felt252Type;
	block_number: number;
	transaction_hash: Felt252Type;
}

export interface EventsResponseType {
	events: EmittedEventType[];
	continuation_token?: string;
}
