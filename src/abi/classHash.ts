/**
 * Contract Class Hash Utilities
 *
 * Compute class hashes from Sierra and CASM artifacts.
 *
 * @module abi/classHash
 */

import { poseidonHashMany, snKeccak } from '../crypto/index.js';
import {
  Felt252,
  type Felt252Type,
  encodeShortString as encodeShortStringPrimitive,
} from '../primitives/index.js';
import { type Result, ok, err, abiError, type Abi } from './types.js';

// ============ Empty Array Hash Constant ============

/**
 * Poseidon hash of empty array (precomputed)
 * safePoseidonHashMany([]) = 0x2272be0f580fd156823304800919530eaa97430e972d7213ee13f4fbf7a5dbc
 * Source: @scure/starknet safePoseidonHashMany([])
 *
 * FFI doesn't support empty arrays, so we use this precomputed value.
 */
const POSEIDON_EMPTY_ARRAY_HASH = Felt252(
  0x2272be0f580fd156823304800919530eaa97430e972d7213ee13f4fbf7a5dbcn
);

/**
 * Safe wrapper for poseidonHashMany that handles empty arrays
 */
function safePoseidonHashMany(values: bigint[]): Felt252Type {
  if (values.length === 0) {
    return POSEIDON_EMPTY_ARRAY_HASH;
  }
  return poseidonHashMany(values.map((v) => Felt252(v)));
}

// ============ Constants ============

/**
 * Contract class version for Sierra contracts
 */
const CONTRACT_CLASS_VERSION = 'CONTRACT_CLASS_V0.1.0';

/**
 * Compiled class version for CASM
 */
const COMPILED_CLASS_VERSION = 'COMPILED_CLASS_V1';

// ============ Types ============

/**
 * Sierra entry point structure
 */
export interface SierraEntryPoint {
  selector: string;
  function_idx: number;
}

/**
 * Sierra entry points by type
 */
export interface SierraEntryPoints {
  CONSTRUCTOR: SierraEntryPoint[];
  EXTERNAL: SierraEntryPoint[];
  L1_HANDLER: SierraEntryPoint[];
}

/**
 * Compiled Sierra (Sierra artifact)
 */
export interface CompiledSierra {
  sierra_program: string[];
  sierra_program_debug_info?: unknown;
  contract_class_version: string;
  entry_points_by_type: SierraEntryPoints;
  abi: Abi | string;
}

/**
 * CASM entry point structure
 */
export interface CasmEntryPoint {
  selector: string;
  offset: number;
  builtins: string[];
}

/**
 * CASM entry points by type
 */
export interface CasmEntryPoints {
  CONSTRUCTOR: CasmEntryPoint[];
  EXTERNAL: CasmEntryPoint[];
  L1_HANDLER: CasmEntryPoint[];
}

/**
 * Compiled Sierra CASM (CASM artifact)
 */
export interface CompiledSierraCasm {
  prime: string;
  compiler_version: string;
  bytecode: string[];
  bytecode_segment_lengths?: number[];
  hints: unknown[];
  pythonic_hints?: unknown[];
  entry_points_by_type: CasmEntryPoints;
}

// ============ Short String Encoding ============

/**
 * Encode a short string to felt (hex string)
 */
function encodeShortStringHex(str: string): string {
  const value = encodeShortStringPrimitive(str);
  return '0x' + value.toString(16);
}

// ============ JSON Formatting ============

/**
 * Format JSON with proper spacing for ABI hashing
 * Adds space after colons and commas (outside of strings)
 */
function formatSpaces(json: string): string {
  let insideQuotes = false;
  const result: string[] = [];

  for (let i = 0; i < json.length; i++) {
    const char = json[i] ?? '';
    const prevChar = i > 0 ? json[i - 1] ?? '' : '';

    // Toggle quote state (but not for escaped quotes)
    if (char === '"' && prevChar !== '\\') {
      insideQuotes = !insideQuotes;
    }

    if (insideQuotes) {
      result.push(char);
    } else {
      // Add space after colon and comma
      if (char === ':') {
        result.push(': ');
      } else if (char === ',') {
        result.push(', ');
      } else {
        result.push(char);
      }
    }
  }

  return result.join('');
}

/**
 * Stringify JSON without whitespace, matching starknet.js format
 */
function stringify(obj: unknown): string {
  return JSON.stringify(obj, null, 0);
}

// ============ Entry Point Hashing ============

/**
 * Hash Sierra entry points
 * Flattens [selector, function_idx] pairs and hashes with Poseidon
 */
function hashEntryPointsSierra(entryPoints: SierraEntryPoint[]): bigint {
  if (entryPoints.length === 0) {
    return safePoseidonHashMany([]).toBigInt();
  }

  const flat: bigint[] = entryPoints.flatMap((ep) => [
    BigInt(ep.selector),
    BigInt(ep.function_idx),
  ]);

  return safePoseidonHashMany(flat).toBigInt();
}

/**
 * Hash CASM entry points
 * Flattens [selector, offset, builtinsHash] triples and hashes with Poseidon
 */
function hashEntryPointsCasm(entryPoints: CasmEntryPoint[]): bigint {
  if (entryPoints.length === 0) {
    return safePoseidonHashMany([]).toBigInt();
  }

  const flat: bigint[] = entryPoints.flatMap((ep) => [
    BigInt(ep.selector),
    BigInt(ep.offset),
    hashBuiltins(ep.builtins),
  ]);

  return safePoseidonHashMany(flat).toBigInt();
}

/**
 * Hash builtins array
 * Each builtin name is encoded as short string and hashed together
 */
function hashBuiltins(builtins: string[]): bigint {
  if (builtins.length === 0) {
    return safePoseidonHashMany([]).toBigInt();
  }

  const encoded: bigint[] = builtins.map((b) =>
    BigInt(encodeShortStringHex(b))
  );

  return safePoseidonHashMany(encoded).toBigInt();
}

/**
 * Hash ABI for Sierra class hash
 * ABI is formatted with proper spacing and hashed with keccak
 */
function hashAbi(abi: Abi | string): bigint {
  const abiString = typeof abi === 'string' ? abi : stringify(abi);
  const formatted = formatSpaces(abiString);
  const hash = snKeccak(formatted);
  return hash.toBigInt();
}

/**
 * Hash Sierra program
 */
function hashSierraProgram(program: string[]): bigint {
  const felts = program.map((p) => BigInt(p));
  return safePoseidonHashMany(felts).toBigInt();
}

/**
 * Hash bytecode segments for CASM with segment lengths
 *
 * When bytecode_segment_lengths is present, the bytecode is divided
 * into segments and hashed as: 1 + poseidon([len1, hash1, len2, hash2, ...])
 */
function hashByteCodeSegments(bytecode: string[], segmentLengths: number[]): bigint {
  const bytecodeBigints = bytecode.map((b) => BigInt(b));

  let segmentStart = 0;
  const hashLeaves: bigint[] = segmentLengths.flatMap((len) => {
    const segment = bytecodeBigints.slice(segmentStart, segmentStart + len);
    segmentStart += len;
    return [BigInt(len), safePoseidonHashMany(segment).toBigInt()];
  });

  return 1n + safePoseidonHashMany(hashLeaves).toBigInt();
}

/**
 * Hash bytecode (flat or segmented)
 */
function hashBytecode(casm: CompiledSierraCasm): bigint {
  if (casm.bytecode_segment_lengths && casm.bytecode_segment_lengths.length > 0) {
    return hashByteCodeSegments(casm.bytecode, casm.bytecode_segment_lengths);
  }
  return safePoseidonHashMany(casm.bytecode.map((b) => BigInt(b))).toBigInt();
}

// ============ Public API ============

/**
 * Compute class hash from Sierra artifact
 *
 * The class hash is computed as:
 * poseidon(
 *   CONTRACT_CLASS_V0.1.0,
 *   hash(external_entry_points),
 *   hash(l1_handler_entry_points),
 *   hash(constructor_entry_points),
 *   keccak(abi),
 *   poseidon(sierra_program)
 * )
 *
 * @param sierra - Compiled Sierra contract artifact
 * @returns Class hash as hex string, or error
 *
 * @example
 * ```ts
 * const result = classHashFromSierra(sierraJson);
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   console.log('Class hash:', result.result);
 * }
 * ```
 */
export function classHashFromSierra(sierra: CompiledSierra): Result<string> {
  try {
    // Validate required fields
    if (!sierra.entry_points_by_type) {
      return err(abiError('INVALID_ABI', 'Missing entry_points_by_type'));
    }
    if (!sierra.sierra_program) {
      return err(abiError('INVALID_ABI', 'Missing sierra_program'));
    }
    if (sierra.abi === undefined) {
      return err(abiError('INVALID_ABI', 'Missing abi'));
    }

    // Compute components
    const compiledClassVersion = BigInt(encodeShortStringHex(CONTRACT_CLASS_VERSION));
    const externalHash = hashEntryPointsSierra(sierra.entry_points_by_type.EXTERNAL || []);
    const l1HandlerHash = hashEntryPointsSierra(sierra.entry_points_by_type.L1_HANDLER || []);
    const constructorHash = hashEntryPointsSierra(sierra.entry_points_by_type.CONSTRUCTOR || []);
    const abiHash = hashAbi(sierra.abi);
    const programHash = hashSierraProgram(sierra.sierra_program);

    // Combine with Poseidon
    const classHash = safePoseidonHashMany([
      compiledClassVersion,
      externalHash,
      l1HandlerHash,
      constructorHash,
      abiHash,
      programHash,
    ]);

    return ok(classHash.toHex());
  } catch (error) {
    return err(
      abiError(
        'ENCODE_ERROR',
        `Failed to compute class hash: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Compute compiled class hash from CASM artifact
 *
 * The compiled class hash is computed as:
 * poseidon(
 *   COMPILED_CLASS_V1,
 *   hash(external_entry_points),
 *   hash(l1_handler_entry_points),
 *   hash(constructor_entry_points),
 *   hash(bytecode)
 * )
 *
 * @param casm - Compiled CASM artifact
 * @returns Compiled class hash as hex string, or error
 *
 * @example
 * ```ts
 * const result = compiledClassHashFromCasm(casmJson);
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   console.log('Compiled class hash:', result.result);
 * }
 * ```
 */
export function compiledClassHashFromCasm(casm: CompiledSierraCasm): Result<string> {
  try {
    // Validate required fields
    if (!casm.entry_points_by_type) {
      return err(abiError('INVALID_ABI', 'Missing entry_points_by_type'));
    }
    if (!casm.bytecode) {
      return err(abiError('INVALID_ABI', 'Missing bytecode'));
    }

    // Compute components
    const compiledClassVersion = BigInt(encodeShortStringHex(COMPILED_CLASS_VERSION));
    const externalHash = hashEntryPointsCasm(casm.entry_points_by_type.EXTERNAL || []);
    const l1HandlerHash = hashEntryPointsCasm(casm.entry_points_by_type.L1_HANDLER || []);
    const constructorHash = hashEntryPointsCasm(casm.entry_points_by_type.CONSTRUCTOR || []);
    const bytecodeHash = hashBytecode(casm);

    // Combine with Poseidon
    const compiledClassHash = safePoseidonHashMany([
      compiledClassVersion,
      externalHash,
      l1HandlerHash,
      constructorHash,
      bytecodeHash,
    ]);

    return ok(compiledClassHash.toHex());
  } catch (error) {
    return err(
      abiError(
        'ENCODE_ERROR',
        `Failed to compute compiled class hash: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Extract ABI from a contract artifact (Sierra or legacy)
 *
 * @param artifact - Contract artifact (Sierra JSON or legacy contract)
 * @returns Extracted ABI array, or error
 *
 * @example
 * ```ts
 * const result = extractAbi(contractJson);
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   console.log('ABI entries:', result.result.length);
 * }
 * ```
 */
export function extractAbi(
  artifact: CompiledSierra | { abi: Abi | string } | unknown
): Result<Abi> {
  try {
    // Check for Sierra artifact
    if (artifact && typeof artifact === 'object' && 'abi' in artifact) {
      const abi = (artifact as { abi: Abi | string }).abi;

      // ABI might be a string (JSON) or already parsed
      if (typeof abi === 'string') {
        try {
          return ok(JSON.parse(abi) as Abi);
        } catch {
          return err(abiError('INVALID_ABI', 'ABI string is not valid JSON'));
        }
      }

      if (Array.isArray(abi)) {
        return ok(abi);
      }

      return err(abiError('INVALID_ABI', 'ABI is not an array'));
    }

    return err(abiError('INVALID_ABI', 'Artifact does not contain ABI'));
  } catch (error) {
    return err(
      abiError(
        'INVALID_ABI',
        `Failed to extract ABI: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}
