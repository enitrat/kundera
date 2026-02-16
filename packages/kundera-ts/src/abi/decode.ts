/**
 * ABI Decoding
 *
 * Decode calldata (felt array) back to Cairo values.
 */

import { decodeShortString } from "../primitives/index.js";
import { getEnum, getStruct, parseType } from "./parse.js";
import {
	type AbiMember,
	type AbiOutput,
	type CairoEnumValue,
	type CairoValue,
	type DecodedStruct,
	type ParsedAbi,
	type ParsedType,
	type Result,
	abiError,
	err,
	ok,
} from "./types.js";

// ============ Decode Context ============

/**
 * Decoding state that tracks position in calldata
 */
interface DecodeContext {
	data: bigint[];
	offset: number;
}

function requirePresent<T>(value: T | undefined, message: string): T {
	if (value === undefined) {
		throw new Error(message);
	}
	return value;
}

/**
 * Read next value from context
 */
function readNext(ctx: DecodeContext): bigint {
	if (ctx.offset >= ctx.data.length) {
		throw new Error(`Unexpected end of calldata at offset ${ctx.offset}`);
	}
	const value = ctx.data[ctx.offset];
	if (value === undefined) {
		throw new Error(`Unexpected end of calldata at offset ${ctx.offset}`);
	}
	ctx.offset++;
	return value;
}

// ============ Type Decoding ============

/**
 * Decode a single value according to its type
 */
export function decodeValue(
	calldata: bigint[],
	typeStr: string,
	abi: ParsedAbi,
): Result<{ value: CairoValue; consumed: number }> {
	try {
		const ctx: DecodeContext = { data: calldata, offset: 0 };
		const parsed = parseType(typeStr);
		const value = decodeByType(ctx, parsed, abi);
		return ok({ value, consumed: ctx.offset });
	} catch (error) {
		return err(
			abiError(
				"DECODE_ERROR",
				`Failed to decode value: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
	}
}

/**
 * Internal: decode by parsed type
 */
function decodeByType(
	ctx: DecodeContext,
	type: ParsedType,
	abi: ParsedAbi,
): CairoValue {
	switch (type.kind) {
		case "primitive":
			return decodePrimitive(ctx, type.name);

		case "array":
		case "span": {
			const innerType = requirePresent(
				type.inner,
				`Missing inner type for ${type.kind}`,
			);
			return decodeArray(ctx, innerType, abi);
		}

		case "tuple": {
			const memberTypes = requirePresent(type.members, "Missing tuple members");
			return decodeTuple(ctx, memberTypes, abi);
		}

		case "option": {
			const innerType = requirePresent(type.inner, "Missing option inner type");
			return decodeOption(ctx, innerType, abi);
		}

		case "struct": {
			// Check if it's actually an enum (parseType defaults unknown types to struct)
			const enumDef = abi.enums.get(type.path ?? type.name);
			if (enumDef) {
				return decodeEnum(ctx, type, abi);
			}
			return decodeStruct(ctx, type, abi);
		}

		case "enum":
			return decodeEnum(ctx, type, abi);

		default:
			throw new Error(`Unknown type kind: ${type.kind}`);
	}
}

/**
 * Decode a primitive value
 */
function decodePrimitive(ctx: DecodeContext, typeName: string): CairoValue {
	// Handle u256 specially (2 felts: low, high)
	if (
		typeName === "u256" ||
		typeName === "core::integer::u256" ||
		typeName === "integer::u256"
	) {
		const low = readNext(ctx);
		const high = readNext(ctx);
		return (high << 128n) | low;
	}

	// Handle bool
	if (typeName === "bool" || typeName === "core::bool") {
		const value = readNext(ctx);
		return value !== 0n;
	}

	// Handle ByteArray
	if (
		typeName === "ByteArray" ||
		typeName === "core::byte_array::ByteArray" ||
		typeName === "byte_array::ByteArray"
	) {
		return decodeByteArray(ctx);
	}

	// Handle shortstring (felt252 containing ASCII text)
	if (typeName === "shortstring" || typeName === "core::shortstring") {
		const value = readNext(ctx);
		return decodeShortString(value);
	}

	// All other primitives are single felt
	return readNext(ctx);
}

/**
 * Decode a ByteArray
 */
function decodeByteArray(ctx: DecodeContext): string {
	const numFullWords = Number(readNext(ctx));
	const bytes: number[] = [];

	// Decode full 31-byte words
	for (let i = 0; i < numFullWords; i++) {
		const word = readNext(ctx);
		const wordBytes: number[] = [];
		let w = word;
		for (let j = 0; j < 31; j++) {
			wordBytes.unshift(Number(w & 0xffn));
			w >>= 8n;
		}
		bytes.push(...wordBytes);
	}

	// Decode pending word
	const pendingWord = readNext(ctx);
	const pendingLen = Number(readNext(ctx));

	if (pendingLen > 0) {
		const pendingBytes: number[] = [];
		let w = pendingWord;
		for (let j = 0; j < pendingLen; j++) {
			pendingBytes.unshift(Number(w & 0xffn));
			w >>= 8n;
		}
		bytes.push(...pendingBytes);
	}

	// Convert to string
	return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Decode an array
 */
function decodeArray(
	ctx: DecodeContext,
	elementType: ParsedType,
	abi: ParsedAbi,
): CairoValue[] {
	const length = Number(readNext(ctx));
	const result: CairoValue[] = [];

	for (let i = 0; i < length; i++) {
		result.push(decodeByType(ctx, elementType, abi));
	}

	return result;
}

/**
 * Decode a tuple
 */
function decodeTuple(
	ctx: DecodeContext,
	memberTypes: ParsedType[],
	abi: ParsedAbi,
): CairoValue[] {
	const result: CairoValue[] = [];

	for (const memberType of memberTypes) {
		result.push(decodeByType(ctx, memberType, abi));
	}

	return result;
}

/**
 * Decode an Option<T>
 */
function decodeOption(
	ctx: DecodeContext,
	innerType: ParsedType,
	abi: ParsedAbi,
): CairoValue | null {
	const variantIndex = readNext(ctx);

	if (variantIndex === 1n) {
		// None
		return null;
	}

	// Some (variant index 0)
	return decodeByType(ctx, innerType, abi);
}

/**
 * Decode a struct
 */
function decodeStruct(
	ctx: DecodeContext,
	type: ParsedType,
	abi: ParsedAbi,
): DecodedStruct {
	// Look up struct definition
	const structDef = getStruct(abi, type.path ?? type.name);
	if (!structDef) {
		throw new Error(`Struct not found: ${type.path ?? type.name}`);
	}

	const result: DecodedStruct = {};

	for (const member of structDef.entry.members) {
		result[member.name] = decodeByType(ctx, parseType(member.type), abi);
	}

	return result;
}

/**
 * Decode an enum
 */
function decodeEnum(
	ctx: DecodeContext,
	type: ParsedType,
	abi: ParsedAbi,
): CairoEnumValue {
	// Look up enum definition
	const enumDef = getEnum(abi, type.path ?? type.name);
	if (!enumDef) {
		throw new Error(`Enum not found: ${type.path ?? type.name}`);
	}

	const variantIndex = Number(readNext(ctx));
	const variant = enumDef.entry.variants[variantIndex];

	if (!variant) {
		throw new Error(`Invalid variant index: ${variantIndex}`);
	}

	// Decode variant data if not unit type
	let value: CairoValue = null;
	if (variant.type !== "()" && variant.type !== "unit") {
		value = decodeByType(ctx, parseType(variant.type), abi);
	}

	return {
		variant: variant.name,
		value,
	};
}

// ============ Function Output Decoding ============

/**
 * Decode function outputs
 */
export function decodeOutputs(
	calldata: bigint[],
	outputs: readonly AbiOutput[],
	abi: ParsedAbi,
): Result<CairoValue[]> {
	if (outputs.length === 0) {
		return ok([]);
	}

	try {
		const ctx: DecodeContext = { data: calldata, offset: 0 };
		const result: CairoValue[] = [];

		for (const output of outputs) {
			result.push(decodeByType(ctx, parseType(output.type), abi));
		}

		return ok(result);
	} catch (error) {
		return err(
			abiError(
				"DECODE_ERROR",
				`Failed to decode outputs: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
	}
}

/**
 * Decode function outputs to object (by name)
 */
export function decodeOutputsObject(
	calldata: bigint[],
	outputs: readonly AbiOutput[],
	abi: ParsedAbi,
): Result<DecodedStruct> {
	const decoded = decodeOutputs(calldata, outputs, abi);
	if (decoded.error) {
		return decoded as Result<DecodedStruct>;
	}

	const result: DecodedStruct = {};
	for (let i = 0; i < outputs.length; i++) {
		const output = requirePresent(outputs[i], `Missing output at index ${i}`);
		const value = requirePresent(
			decoded.result[i],
			`Missing decoded output at index ${i}`,
		);
		result[output.name ?? `output_${i}`] = value;
	}

	return ok(result);
}

/**
 * Decode calldata back to arguments
 */
export function decodeArgs(
	calldata: bigint[],
	inputs: readonly AbiMember[],
	abi: ParsedAbi,
): Result<CairoValue[]> {
	if (inputs.length === 0) {
		return ok([]);
	}

	try {
		const ctx: DecodeContext = { data: calldata, offset: 0 };
		const result: CairoValue[] = [];

		for (const input of inputs) {
			result.push(decodeByType(ctx, parseType(input.type), abi));
		}

		return ok(result);
	} catch (error) {
		return err(
			abiError(
				"DECODE_ERROR",
				`Failed to decode arguments: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
	}
}

/**
 * Decode calldata to argument object (by name)
 */
export function decodeArgsObject(
	calldata: bigint[],
	inputs: readonly AbiMember[],
	abi: ParsedAbi,
): Result<DecodedStruct> {
	const decoded = decodeArgs(calldata, inputs, abi);
	if (decoded.error) {
		return decoded as Result<DecodedStruct>;
	}

	const result: DecodedStruct = {};
	for (let i = 0; i < inputs.length; i++) {
		const input = requirePresent(inputs[i], `Missing input at index ${i}`);
		const value = requirePresent(
			decoded.result[i],
			`Missing decoded input at index ${i}`,
		);
		result[input.name] = value;
	}

	return ok(result);
}
