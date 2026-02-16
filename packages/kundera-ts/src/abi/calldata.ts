/**
 * Calldata Compilation
 *
 * High-level API for compiling function calldata.
 */

import type {
	InferArgs,
	InferFunctionName,
	InferReturn,
} from "./abi-type-inference.js";
import {
	decodeArgs,
	decodeArgsObject,
	decodeOutputs,
	decodeOutputsObject,
} from "./decode.js";
import { encodeArgs, encodeArgsObject } from "./encode.js";
import { computeSelector, getFunction, parseAbi } from "./parse.js";
import {
	type AbiLike,
	type CairoValue,
	type DecodedStruct,
	type ParsedAbi,
	type Result,
	ok,
} from "./types.js";

function isArgsArray(
	args: readonly CairoValue[] | Record<string, CairoValue>,
): args is readonly CairoValue[] {
	return Array.isArray(args);
}

function encodeCalldataInternal(
	abi: AbiLike,
	fnName: string,
	args: readonly CairoValue[] | Record<string, CairoValue>,
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
	if (isArgsArray(args)) {
		return encodeArgs(fn.entry.inputs, args, parsed);
	}
	return encodeArgsObject(fn.entry.inputs, args, parsed);
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
	TAbi extends AbiLike,
	TFunctionName extends InferFunctionName<TAbi> & string,
>(
	abi: TAbi,
	fnName: TFunctionName,
	args: InferArgs<TAbi, TFunctionName>,
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
	TAbi extends AbiLike,
	TFunctionName extends InferFunctionName<TAbi> & string,
>(
	abi: TAbi,
	fnName: TFunctionName,
	output: bigint[],
): Result<InferReturn<TAbi, TFunctionName>> {
	type Ret = Result<InferReturn<TAbi, TFunctionName>>;

	// Parse ABI
	const parsedResult = getParsedAbi(abi);
	if (parsedResult.error) {
		return parsedResult as Ret;
	}
	const parsed = parsedResult.result;

	// Get function
	const fnResult = getFunction(parsed, fnName);
	if (fnResult.error) {
		return fnResult as Ret;
	}
	const fn = fnResult.result;

	const arrayResult = decodeOutputs(output, fn.entry.outputs, parsed);
	if (arrayResult.error) {
		return arrayResult as Ret;
	}

	// Unwrap: 0 outputs → null, 1 output → scalar, 2+ → array
	const arr = arrayResult.result;
	if (arr.length === 0) return ok(null) as Ret;
	if (arr.length === 1) {
		const first = arr[0];
		if (first === undefined) {
			return err(
				abiError("DECODE_ERROR", "Expected one output value but found none"),
			) as Ret;
		}
		return ok(first) as Ret;
	}
	return ok(arr) as Ret;
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
	TAbi extends AbiLike,
	TFunctionName extends InferFunctionName<TAbi> & string,
>(abi: TAbi, fnName: TFunctionName, output: bigint[]): Result<DecodedStruct> {
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
	return `0x${computeSelector(fnName).toString(16)}`;
}

/**
 * Compile a complete function call
 *
 * Returns selector hex and calldata as hex strings, ready for JSON-RPC wire format.
 *
 * @param abi - Contract ABI
 * @param fnName - Function name
 * @param args - Function arguments
 * @returns { selectorHex, calldata } or error
 */
export function compileCalldata<
	TAbi extends AbiLike,
	TFunctionName extends InferFunctionName<TAbi> & string,
>(
	abi: TAbi,
	fnName: TFunctionName,
	args: InferArgs<TAbi, TFunctionName>,
): Result<{ selectorHex: string; calldata: string[] }> {
	const encoded = encodeCalldataInternal(abi, fnName, args);
	if (encoded.error) {
		return encoded as Result<{
			selectorHex: string;
			calldata: string[];
		}>;
	}

	const selector = computeSelector(fnName);

	return ok({
		selectorHex: `0x${selector.toString(16)}`,
		calldata: encoded.result.map((v) => `0x${v.toString(16)}`),
	});
}
