/**
 * Contract Read Skill
 *
 * Read-only contract calls with ABI encoding/decoding.
 */

import { encodeCalldata, decodeOutput, getFunctionSelectorHex, type Abi } from 'kundera/abi';
import { Felt252 } from 'kundera/primitives';
import { starknet_call } from 'kundera/rpc';
import type { BlockId, FunctionCall } from 'kundera/rpc';
import type { Transport } from 'kundera/transport';

export interface ReadContractParams {
  abi: Abi;
  address: string;
  functionName: string;
  args?: unknown[];
  blockId?: BlockId;
}

export interface ContractError {
  code: ContractErrorCode;
  message: string;
}

export type ContractErrorCode = 'ENCODE_ERROR' | 'DECODE_ERROR' | 'RPC_ERROR';

export interface ContractResult<T> {
  result: T | null;
  error: ContractError | null;
}

function ok<T>(result: T): ContractResult<T> {
  return { result, error: null };
}

function err<T>(code: ContractErrorCode, message: string): ContractResult<T> {
  return { result: null, error: { code, message } };
}

/**
 * Read from a contract (view function).
 */
export async function readContract(
  transport: Transport,
  params: ReadContractParams,
): Promise<ContractResult<unknown[]>> {
  const { abi, address, functionName, args = [], blockId } = params;

  const calldataResult = encodeCalldata(abi, functionName, args as any);
  if (calldataResult.error) {
    return err('ENCODE_ERROR', calldataResult.error.message);
  }

  const selector = getFunctionSelectorHex(functionName);
  const calldata = calldataResult.result.map((value) => Felt252(value).toHex());

  const call: FunctionCall = {
    contract_address: address,
    entry_point_selector: selector,
    calldata: calldata as any,
  };

  try {
    const output = await starknet_call(transport, call, blockId) as string[];
    const outputFelts = output.map((value) => BigInt(value));
    const decoded = decodeOutput(abi, functionName, outputFelts);
    if (decoded.error) {
      return err('DECODE_ERROR', decoded.error.message);
    }
    return ok(decoded.result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err('RPC_ERROR', message);
  }
}
