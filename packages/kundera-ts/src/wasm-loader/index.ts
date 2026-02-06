/**
 * WASM Loader Module
 *
 * Exports WASM crypto loader and functions.
 */

export {
	// Loading
	loadWasmCrypto,
	isWasmAvailable,
	isWasmLoaded,
	getWasmPath,
	// Felt arithmetic
	wasmFeltAdd,
	wasmFeltSub,
	wasmFeltMul,
	wasmFeltDiv,
	wasmFeltNeg,
	wasmFeltInverse,
	wasmFeltPow,
	wasmFeltSqrt,
	// Hashing
	wasmPedersenHash,
	wasmPoseidonHash,
	wasmPoseidonHashMany,
	wasmKeccak256,
	// ECDSA
	wasmGetPublicKey,
	wasmSign,
	wasmVerify,
	wasmRecover,
	type WasmSignature,
} from "./loader.js";

export { ErrorCode, type WasmExports, type WasmInstance } from "./types.js";
