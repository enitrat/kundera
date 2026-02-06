/**
 * Calldata Compilation
 *
 * High-level API for compiling function calldata.
 */

import {
	type AbiLike,
	type CairoValue,
	type DecodedStruct,
	type ParsedAbi,
	type Result,
	ok,
} from "./types.js";
import type {
	Abi as KanabiAbi,
	ExtractAbiFunction,
	ExtractAbiFunctionNames,
	ExtractArgs,
	FunctionRet,
} from "abi-wan-kanabi/kanabi";
import { parseAbi, getFunction, computeSelector } from "./parse.js";
import { encodeArgs, encodeArgsObject } from "./encode.js";
import {
	decodeArgs,
	decodeArgsObject,
	decodeOutputs,
	decodeOutputsObject,
} from "./decode.js";

function encodeCalldataInternal(
	abi: AbiLike,
	fnName: string,
	args: CairoValue[] | Record<string, CairoValue>,
): Result<bigint[]> {
	// Parse ABI
	const parsedResult = getParsedAbi(abi);
	if (parsedResult.error) {
		return parsedResult as Result<bigint[]>;
	}
	const parsed = parsedResult.result;

	// Get function
	const fnResult = getFunction(parsed, fnName);
	if (fnResult.error) {
		return fnResult as Result<bigint[]>;
	}
	const fn = fnResult.result;

	// Encode arguments
	if (Array.isArray(args)) {
		return encodeArgs(fn.entry.inputs, args, parsed);
	} else {
		return encodeArgsObject(fn.entry.inputs, args, parsed);
	}
}

// ============ ABI Caching ============

const abiCache = new WeakMap<AbiLike, ParsedAbi>();

/**
 * Get or create parsed ABI from cache
 */
function getParsedAbi(abi: AbiLike): Result<ParsedAbi> {
	const cached = abiCache.get(abi);
	if (cached) {
		return ok(cached);
	}

	const parsed = parseAbi(abi);
	if (parsed.error) {
		return parsed;
	}

	abiCache.set(abi, parsed.result);
	return parsed;
}

// ============ Public API ============

/**
 * Encode function calldata
 *
 * @param abi - Contract ABI
 * @param fnName - Function name or selector
 * @param args - Function arguments (array or object)
 * @returns Encoded calldata as bigint array, or error
 *
 * @example
 * ```ts
 * const result = encodeCalldata(abi, 'transfer', [recipientAddr, amount]);
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   console.log(result.result); // bigint[]
 * }
 * ```
 */
export function encodeCalldata<
	TAbi extends KanabiAbi,
	TFunctionName extends ExtractAbiFunctionNames<TAbi>,
>(
	abi: TAbi,
	fnName: TFunctionName,
	args: ExtractArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>>,
): Result<bigint[]>;
export function encodeCalldata(
	abi: AbiLike,
	fnName: string,
	args: CairoValue[] | Record<string, CairoValue>,
): Result<bigint[]>;
export function encodeCalldata(
	abi: AbiLike,
	fnName: string,
	args: CairoValue[] | Record<string, CairoValue>,
): Result<bigint[]> {
	return encodeCalldataInternal(abi, fnName, args);
}

/**
 * Decode function calldata back to values
 *
 * @param abi - Contract ABI
 * @param fnName - Function name or selector
 * @param calldata - Calldata to decode
 * @returns Decoded values as array, or error
 */
export function decodeCalldata(
	abi: AbiLike,
	fnName: string,
	calldata: bigint[],
): Result<CairoValue[]> {
	// Parse ABI
	const parsedResult = getParsedAbi(abi);
	if (parsedResult.error) {
		return parsedResult as Result<CairoValue[]>;
	}
	const parsed = parsedResult.result;

	// Get function
	const fnResult = getFunction(parsed, fnName);
	if (fnResult.error) {
		return fnResult as Result<CairoValue[]>;
	}
	const fn = fnResult.result;

	return decodeArgs(calldata, fn.entry.inputs, parsed);
}

/**
 * Decode function calldata to named object
 *
 * @param abi - Contract ABI
 * @param fnName - Function name or selector
 * @param calldata - Calldata to decode
 * @returns Decoded values as object with argument names, or error
 */
export function decodeCalldataObject(
	abi: AbiLike,
	fnName: string,
	calldata: bigint[],
): Result<DecodedStruct> {
	// Parse ABI
	const parsedResult = getParsedAbi(abi);
	if (parsedResult.error) {
		return parsedResult as Result<DecodedStruct>;
	}
	const parsed = parsedResult.result;

	// Get function
	const fnResult = getFunction(parsed, fnName);
	if (fnResult.error) {
		return fnResult as Result<DecodedStruct>;
	}
	const fn = fnResult.result;

	return decodeArgsObject(calldata, fn.entry.inputs, parsed);
}

/**
 * Decode function return values
 *
 * @param abi - Contract ABI
 * @param fnName - Function name or selector
 * @param output - Return data to decode
 * @returns Decoded return values, or error
 */
export function decodeOutput<
	TAbi extends KanabiAbi,
	TFunctionName extends ExtractAbiFunctionNames<TAbi>,
>(
	abi: TAbi,
	fnName: TFunctionName,
	output: bigint[],
): Result<FunctionRet<TAbi, TFunctionName>>;
export function decodeOutput(
	abi: AbiLike,
	fnName: string,
	output: bigint[],
): Result<CairoValue>;
export function decodeOutput(
	abi: AbiLike,
	fnName: string,
	output: bigint[],
): Result<CairoValue> {
	// Parse ABI
	const parsedResult = getParsedAbi(abi);
	if (parsedResult.error) {
		return parsedResult as Result<CairoValue>;
	}
	const parsed = parsedResult.result;

	// Get function
	const fnResult = getFunction(parsed, fnName);
	if (fnResult.error) {
		return fnResult as Result<CairoValue>;
	}
	const fn = fnResult.result;

	const arrayResult = decodeOutputs(output, fn.entry.outputs, parsed);
	if (arrayResult.error) {
		return arrayResult as Result<CairoValue>;
	}

	// Unwrap: 0 outputs → null, 1 output → scalar, 2+ → array
	const arr = arrayResult.result;
	if (arr.length === 0) return ok(null);
	if (arr.length === 1) return ok(arr[0]!);
	return ok(arr);
}

/**
 * Decode function return values to named object
 *
 * @param abi - Contract ABI
 * @param fnName - Function name or selector
 * @param output - Return data to decode
 * @returns Decoded return values as object with output names, or error
 */
export function decodeOutputObject<
	TAbi extends KanabiAbi,
	TFunctionName extends ExtractAbiFunctionNames<TAbi>,
>(
	abi: TAbi,
	fnName: TFunctionName,
	output: bigint[],
): Result<{ [key: string]: FunctionRet<TAbi, TFunctionName> }>;
export function decodeOutputObject(
	abi: AbiLike,
	fnName: string,
	output: bigint[],
): Result<DecodedStruct>;
export function decodeOutputObject(
	abi: AbiLike,
	fnName: string,
	output: bigint[],
): Result<DecodedStruct> {
	// Parse ABI
	const parsedResult = getParsedAbi(abi);
	if (parsedResult.error) {
		return parsedResult as Result<DecodedStruct>;
	}
	const parsed = parsedResult.result;

	// Get function
	const fnResult = getFunction(parsed, fnName);
	if (fnResult.error) {
		return fnResult as Result<DecodedStruct>;
	}
	const fn = fnResult.result;

	return decodeOutputsObject(output, fn.entry.outputs, parsed);
}

/**
 * Get function selector
 *
 * @param fnName - Function name
 * @returns Selector as bigint
 */
export function getFunctionSelector(fnName: string): bigint {
	return computeSelector(fnName);
}

/**
 * Get function selector as hex string
 *
 * @param fnName - Function name
 * @returns Selector as hex string (0x...)
 */
export function getFunctionSelectorHex(fnName: string): string {
	return "0x" + computeSelector(fnName).toString(16);
}

/**
 * Compile a complete function call
 *
 * Returns selector and calldata ready for starknet_call or execute.
 *
 * @param abi - Contract ABI
 * @param fnName - Function name
 * @param args - Function arguments
 * @returns { selector, calldata } or error
 */
export function compileCalldata<
	TAbi extends KanabiAbi,
	TFunctionName extends ExtractAbiFunctionNames<TAbi>,
>(
	abi: TAbi,
	fnName: TFunctionName,
	args: ExtractArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>>,
): Result<{ selector: bigint; selectorHex: string; calldata: bigint[] }>;
export function compileCalldata(
	abi: AbiLike,
	fnName: string,
	args: CairoValue[] | Record<string, CairoValue>,
): Result<{ selector: bigint; selectorHex: string; calldata: bigint[] }>;
export function compileCalldata(
	abi: AbiLike,
	fnName: string,
	args: CairoValue[] | Record<string, CairoValue>,
): Result<{ selector: bigint; selectorHex: string; calldata: bigint[] }> {
	const encoded = encodeCalldataInternal(abi, fnName, args);
	if (encoded.error) {
		return encoded as Result<{
			selector: bigint;
			selectorHex: string;
			calldata: bigint[];
		}>;
	}

	const selector = computeSelector(fnName);

	return ok({
		selector,
		selectorHex: "0x" + selector.toString(16),
		calldata: encoded.result,
	});
}
