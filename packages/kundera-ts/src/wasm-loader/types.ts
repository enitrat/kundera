/**
 * WASM Loader Types
 *
 * Type definitions for the WASM crypto module.
 */

/**
 * Error codes from the WASM FFI (matches Rust StarkResult enum)
 */
export enum ErrorCode {
  Success = 0,
  InvalidInput = 1,
  InvalidSignature = 2,
  RecoveryFailed = 3,
  DivisionByZero = 4,
  NoInverse = 5,
  NoSquareRoot = 6,
}

/**
 * WASM module exports interface
 */
export interface WasmExports {
  // Memory
  memory: WebAssembly.Memory;
  __heap_base?: WebAssembly.Global;

  // Felt arithmetic
  felt_add: (a: number, b: number, out: number) => number;
  felt_sub: (a: number, b: number, out: number) => number;
  felt_mul: (a: number, b: number, out: number) => number;
  felt_div: (a: number, b: number, out: number) => number;
  felt_neg: (a: number, out: number) => number;
  felt_inverse: (a: number, out: number) => number;
  felt_pow: (base: number, exp: number, out: number) => number;
  felt_sqrt: (a: number, out: number) => number;

  // Hashing
  starknet_pedersen_hash: (a: number, b: number, out: number) => number;
  starknet_poseidon_hash: (a: number, b: number, out: number) => number;
  starknet_poseidon_hash_many: (inputs: number, len: number, out: number) => number;
  starknet_keccak256: (data: number, len: number, out: number) => number;

  // ECDSA
  starknet_get_public_key: (privKey: number, out: number) => number;
  starknet_sign: (privKey: number, msgHash: number, outR: number, outS: number) => number;
  starknet_verify: (pubKey: number, msgHash: number, r: number, s: number) => number;
  starknet_recover: (msgHash: number, r: number, s: number, v: number, out: number) => number;
}

/**
 * Loaded WASM instance with typed exports
 */
export interface WasmInstance {
  exports: WasmExports;
  memory: WebAssembly.Memory;
}
