/**
 * Kundera ABI Type Inference
 *
 * Compile-time Starknet ABI inference using Kundera-native ABI types.
 */

import type { ByteArrayType } from "../primitives/ByteArray/types.js";
import type { ClassHashType } from "../primitives/ClassHash/types.js";
import type { ContractAddressType } from "../primitives/ContractAddress/types.js";
import type { EthAddressType } from "../primitives/EthAddress/types.js";
import type { Felt252Type } from "../primitives/Felt252/types.js";
import type { Int8Type } from "../primitives/Int8/types.js";
import type { Int16Type } from "../primitives/Int16/types.js";
import type { Int32Type } from "../primitives/Int32/types.js";
import type { Int64Type } from "../primitives/Int64/types.js";
import type { Int128Type } from "../primitives/Int128/types.js";
import type { Uint8Type } from "../primitives/Uint8/types.js";
import type { Uint16Type } from "../primitives/Uint16/types.js";
import type { Uint32Type } from "../primitives/Uint32/types.js";
import type { Uint64Type } from "../primitives/Uint64/types.js";
import type { Uint128Type } from "../primitives/Uint128/types.js";
import type { Uint256Type } from "../primitives/Uint256/types.js";
import type {
	AbiEventEntry,
	AbiFunctionEntry,
	AbiL1HandlerEntry,
	AbiLike,
	CairoValue,
} from "./types.js";

export type StarknetAbi = AbiLike;

type Ws = " " | "\n" | "\t";
type TrimLeft<S extends string> = S extends `${Ws}${infer R}` ? TrimLeft<R> : S;
type TrimRight<S extends string> = S extends `${infer R}${Ws}`
	? TrimRight<R>
	: S;
type Trim<S extends string> = TrimLeft<TrimRight<S>>;

type PrimitiveType<TType extends string> =
	// felt / shortstring
	TType extends "felt" | "felt252" | "core::felt" | "core::felt252"
		? Felt252Type
		: TType extends "shortstring" | "core::shortstring"
			? string
			: // addresses and hashes
				TType extends
						| "ContractAddress"
						| "core::starknet::contract_address::ContractAddress"
				? ContractAddressType
				: TType extends "EthAddress" | "core::starknet::eth_address::EthAddress"
					? EthAddressType
					: TType extends "ClassHash" | "core::starknet::class_hash::ClassHash"
						? ClassHashType
						: // unsigned ints
							TType extends "u8" | "core::integer::u8"
							? Uint8Type
							: TType extends "u16" | "core::integer::u16"
								? Uint16Type
								: TType extends "u32" | "core::integer::u32"
									? Uint32Type
									: TType extends "u64" | "core::integer::u64"
										? Uint64Type
										: TType extends "u128" | "core::integer::u128"
											? Uint128Type
											: TType extends
														| "u256"
														| "integer::u256"
														| "core::integer::u256"
												? Uint256Type
												: // signed ints
													TType extends "i8" | "core::integer::i8"
													? Int8Type
													: TType extends "i16" | "core::integer::i16"
														? Int16Type
														: TType extends "i32" | "core::integer::i32"
															? Int32Type
															: TType extends "i64" | "core::integer::i64"
																? Int64Type
																: TType extends "i128" | "core::integer::i128"
																	? Int128Type
																	: // misc
																		TType extends "bool" | "core::bool"
																		? boolean
																		: TType extends
																					| "ByteArray"
																					| "byte_array::ByteArray"
																					| "core::byte_array::ByteArray"
																			? ByteArrayType
																			: never;

type Pop<T extends unknown[]> = T extends [...infer R, unknown] ? R : [];

type SplitTopLevel<
	S extends string,
	Current extends string = "",
	Out extends string[] = [],
	Angles extends unknown[] = [],
	Parens extends unknown[] = [],
> = S extends `${infer C}${infer Rest}`
	? C extends "<"
		? SplitTopLevel<Rest, `${Current}${C}`, Out, [...Angles, 1], Parens>
		: C extends ">"
			? SplitTopLevel<Rest, `${Current}${C}`, Out, Pop<Angles>, Parens>
			: C extends "("
				? SplitTopLevel<Rest, `${Current}${C}`, Out, Angles, [...Parens, 1]>
				: C extends ")"
					? SplitTopLevel<Rest, `${Current}${C}`, Out, Angles, Pop<Parens>>
					: C extends ","
						? Angles["length"] extends 0
							? Parens["length"] extends 0
								? SplitTopLevel<
										Rest,
										"",
										[...Out, Trim<Current>],
										Angles,
										Parens
									>
								: SplitTopLevel<Rest, `${Current}${C}`, Out, Angles, Parens>
							: SplitTopLevel<Rest, `${Current}${C}`, Out, Angles, Parens>
						: SplitTopLevel<Rest, `${Current}${C}`, Out, Angles, Parens>
	: [...Out, Trim<Current>];

type FilterEmpty<T extends readonly string[]> = T extends readonly [
	infer H extends string,
	...infer R extends string[],
]
	? Trim<H> extends ""
		? FilterEmpty<R>
		: [Trim<H>, ...FilterEmpty<R>]
	: [];

type SplitTupleMembers<S extends string> = FilterEmpty<SplitTopLevel<Trim<S>>>;

type MapTypeList<TAbi extends StarknetAbi, TList extends readonly string[]> = {
	[K in keyof TList]: TList[K] extends string
		? AbiTypeToTs<TAbi, TList[K]>
		: never;
};

type StructEntries<TAbi extends StarknetAbi> = Extract<
	TAbi[number],
	{ type: "struct" }
>;
type EnumEntries<TAbi extends StarknetAbi> = Extract<
	TAbi[number],
	{ type: "enum" }
>;

type LookupStructEntry<
	TAbi extends StarknetAbi,
	TType extends string,
> = Extract<StructEntries<TAbi>, { name: TType }>;

type LookupEnumEntry<TAbi extends StarknetAbi, TType extends string> = Extract<
	EnumEntries<TAbi>,
	{ name: TType }
>;

type StructToType<
	TAbi extends StarknetAbi,
	TStruct extends { members: readonly { name: string; type: string }[] },
> = {
	[M in TStruct["members"][number] as M["name"]]: AbiTypeToTs<TAbi, M["type"]>;
};

type EnumVariantType<
	TAbi extends StarknetAbi,
	TVariant extends { name: string; type: string },
> = TVariant["type"] extends "()" | "unit"
	? { variant: TVariant["name"]; value: null }
	: { variant: TVariant["name"]; value: AbiTypeToTs<TAbi, TVariant["type"]> };

type EnumToType<
	TAbi extends StarknetAbi,
	TEnum extends { variants: readonly { name: string; type: string }[] },
> = EnumVariantType<TAbi, TEnum["variants"][number]>;

type ExtractArrayInner<TType extends string> =
	TType extends `core::array::Array<${infer Inner}>`
		? Inner
		: TType extends `array::Array<${infer Inner}>`
			? Inner
			: TType extends `Array<${infer Inner}>`
				? Inner
				: never;

type ExtractSpanInner<TType extends string> =
	TType extends `core::array::Span<${infer Inner}>`
		? Inner
		: TType extends `array::Span<${infer Inner}>`
			? Inner
			: TType extends `Span<${infer Inner}>`
				? Inner
				: never;

type ExtractOptionInner<TType extends string> =
	TType extends `core::option::Option<${infer Inner}>`
		? Inner
		: TType extends `option::Option<${infer Inner}>`
			? Inner
			: TType extends `Option<${infer Inner}>`
				? Inner
				: never;

export type AbiTypeToTs<
	TAbi extends StarknetAbi,
	TType extends string,
> = PrimitiveType<Trim<TType>> extends never
	? ExtractArrayInner<Trim<TType>> extends infer TArrayInner extends string
		? [TArrayInner] extends [never]
			? ExtractSpanInner<Trim<TType>> extends infer TSpanInner extends string
				? [TSpanInner] extends [never]
					? ExtractOptionInner<Trim<TType>> extends infer TOptionInner extends
							string
						? [TOptionInner] extends [never]
							? Trim<TType> extends `(${infer InnerTuple})`
								? MapTypeList<TAbi, SplitTupleMembers<InnerTuple>>
								: LookupStructEntry<TAbi, Trim<TType>> extends infer TStruct
									? [TStruct] extends [never]
										? LookupEnumEntry<TAbi, Trim<TType>> extends infer TEnum
											? [TEnum] extends [never]
												? never
												: TEnum extends {
															variants: readonly {
																name: string;
																type: string;
															}[];
														}
													? EnumToType<TAbi, TEnum>
													: never
											: never
										: TStruct extends {
													members: readonly { name: string; type: string }[];
												}
											? StructToType<TAbi, TStruct>
											: never
									: never
							: AbiTypeToTs<TAbi, TOptionInner> | null
						: never
					: readonly AbiTypeToTs<TAbi, TSpanInner>[]
				: never
			: AbiTypeToTs<TAbi, TArrayInner>[]
		: never
	: PrimitiveType<Trim<TType>>;

export type StringToPrimitiveType<
	TAbi extends StarknetAbi,
	T extends string,
> = AbiTypeToTs<TAbi, T>;

export type MapAbiPrimitive<
	TAbi extends StarknetAbi,
	TType extends string,
> = AbiTypeToTs<TAbi, TType>;

type FunctionEntries<TAbi extends StarknetAbi> = Extract<
	TAbi[number],
	AbiFunctionEntry | AbiL1HandlerEntry
>;

export type ExtractAbiFunctions<TAbi extends StarknetAbi> =
	FunctionEntries<TAbi>;

export type ExtractAbiFunctionNames<TAbi extends StarknetAbi> =
	FunctionEntries<TAbi>["name"] & string;

export type ExtractAbiFunction<
	TAbi extends StarknetAbi,
	TFunctionName extends ExtractAbiFunctionNames<TAbi>,
> = Extract<FunctionEntries<TAbi>, { name: TFunctionName }>;

type MapInputs<
	TAbi extends StarknetAbi,
	TInputs extends readonly { type: string }[],
> = number extends TInputs["length"]
	? never
	: {
			[K in keyof TInputs]: TInputs[K] extends { type: infer T extends string }
				? AbiTypeToTs<TAbi, T>
				: never;
		};

type MapOutputs<
	TAbi extends StarknetAbi,
	TOutputs extends readonly { type: string }[],
> = {
	[K in keyof TOutputs]: TOutputs[K] extends { type: infer T extends string }
		? AbiTypeToTs<TAbi, T>
		: never;
};

export type ExtractArgs<
	TAbi extends StarknetAbi,
	TAbiFunction extends { inputs: readonly { type: string }[] },
> = MapInputs<TAbi, TAbiFunction["inputs"]>;

export type FunctionRet<
	TAbi extends StarknetAbi,
	TFunctionName extends ExtractAbiFunctionNames<TAbi>,
> = ExtractAbiFunction<TAbi, TFunctionName>["outputs"] extends readonly []
	? null
	: ExtractAbiFunction<TAbi, TFunctionName>["outputs"] extends readonly [
				{ type: infer TType extends string },
			]
		? AbiTypeToTs<TAbi, TType>
		: MapOutputs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>["outputs"]>;

export type FunctionArgs<
	TAbi extends StarknetAbi,
	TFunctionName extends ExtractAbiFunctionNames<TAbi>,
> = ExtractAbiFunction<TAbi, TFunctionName>["inputs"] extends readonly []
	? []
	: MapInputs<
				TAbi,
				ExtractAbiFunction<TAbi, TFunctionName>["inputs"]
			> extends readonly [infer TSingle]
		? TSingle
		: MapInputs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>["inputs"]>;

export type ContractFunctions<TAbi extends StarknetAbi> = {
	[K in ExtractAbiFunctionNames<TAbi>]: ExtractAbiFunction<TAbi, K>;
};

type EventEntries<TAbi extends StarknetAbi> = Extract<
	TAbi[number],
	AbiEventEntry
>;

export type ExtractAbiEventNames<TAbi extends StarknetAbi> =
	EventEntries<TAbi>["name"] & string;

export type ExtractAbiEvent<
	TAbi extends StarknetAbi,
	TEventName extends ExtractAbiEventNames<TAbi>,
> = Extract<EventEntries<TAbi>, { name: TEventName }>;

type EventMemberMap<
	TAbi extends StarknetAbi,
	TMembers extends readonly { name: string; type: string }[],
> = {
	[M in TMembers[number] as M["name"]]: AbiTypeToTs<TAbi, M["type"]>;
};

type EventEnumVariantMap<
	TAbi extends StarknetAbi,
	TVariants extends readonly { name: string; type: string }[],
> = {
	[V in TVariants[number] as V["name"]]: V["type"] extends "()" | "unit"
		? null
		: AbiTypeToTs<TAbi, V["type"]>;
};

export type AbiEventArgs<
	TAbi extends StarknetAbi,
	TEventName extends ExtractAbiEventNames<TAbi>,
> = ExtractAbiEvent<TAbi, TEventName> extends {
	kind: "struct";
	members: readonly { name: string; type: string }[];
}
	? EventMemberMap<TAbi, ExtractAbiEvent<TAbi, TEventName>["members"]>
	: ExtractAbiEvent<TAbi, TEventName> extends {
				kind: "enum";
				variants: readonly { name: string; type: string }[];
			}
		? EventEnumVariantMap<TAbi, ExtractAbiEvent<TAbi, TEventName>["variants"]>
		: never;

// ============ Conditional types for single-signature pattern ============

type IsConstAbi<TAbi> = TAbi extends StarknetAbi
	? number extends TAbi["length"]
		? false
		: true
	: false;

export type InferFunctionName<TAbi> = IsConstAbi<TAbi> extends true
	? TAbi extends StarknetAbi
		? ExtractAbiFunctionNames<TAbi>
		: string
	: string;

export type InferArgs<
	TAbi,
	TFunctionName extends string,
> = IsConstAbi<TAbi> extends true
	? TAbi extends StarknetAbi
		? TFunctionName extends ExtractAbiFunctionNames<TAbi>
			? ExtractArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>>
			: CairoValue[] | Record<string, CairoValue>
		: CairoValue[] | Record<string, CairoValue>
	: CairoValue[] | Record<string, CairoValue>;

export type InferReturn<
	TAbi,
	TFunctionName extends string,
> = IsConstAbi<TAbi> extends true
	? TAbi extends StarknetAbi
		? TFunctionName extends ExtractAbiFunctionNames<TAbi>
			? FunctionRet<TAbi, TFunctionName>
			: CairoValue
		: CairoValue
	: CairoValue;
