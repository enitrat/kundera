/**
 * Contract Read Skill
 *
 * Read-only contract calls with ABI encoding/decoding.
 */

import { encodeCalldata, decodeOutput, getFunctionSelectorHex, type AbiLike, type CairoValue } from '@kundera-sn/kundera-ts/abi';
import { Felt252 } from '@kundera-sn/kundera-ts';
import { starknet_call } from '@kundera-sn/kundera-ts/jsonrpc';
import type { BlockId, FunctionCall } from '@kundera-sn/kundera-ts/jsonrpc';
import type { Transport } from '@kundera-sn/kundera-ts/transport';

export interface ReadContractParams {
  abi: AbiLike;
  address: string;
  functionName: string;
  args?: CairoValue[];
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
): Promise<ContractResult<CairoValue[]>> {
  const { abi, address, functionName, args = [], blockId } = params;

  const calldataResult = encodeCalldata(abi, functionName, args);
  if (calldataResult.error) {
    return err('ENCODE_ERROR', calldataResult.error.message);
  }

  const selector = getFunctionSelectorHex(functionName);
  const calldata = calldataResult.result.map((value) => Felt252(value).toHex());

  const call: FunctionCall = {
    contract_address: address,
    entry_point_selector: selector,
    calldata: calldata as `0x${string}`[],
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
