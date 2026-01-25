/**
 * Contract Module
 *
 * Functional contract wrapper for Starknet.
 */

export type { Account, ContractOptions, ContractInstance } from './Contract.js';
export { getContract } from './Contract.js';

// Class hash utilities
export type {
  CompiledSierra,
  CompiledSierraCasm,
  SierraEntryPoint,
  SierraEntryPoints,
  CasmEntryPoint,
  CasmEntryPoints,
} from './classHash.js';
export {
  classHashFromSierra,
  compiledClassHashFromCasm,
  extractAbi,
  encodeShortString,
  decodeShortString,
} from './classHash.js';

// Re-export relevant ABI types
export type {
  Abi,
  Call,
  FeeEstimate,
  CairoValue,
  DecodedStruct,
  Result,
  AbiError,
} from '../abi/index.js';
