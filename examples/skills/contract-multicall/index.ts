/**
 * Contract Multicall Skill
 *
 * Batch multiple read-only calls using transport.requestBatch.
 */

import { encodeCalldata, decodeOutput, getFunctionSelectorHex, type Abi } from 'kundera-sn/abi';
import { Felt252 } from 'kundera-sn';
import {
  createRequest,
  matchBatchResponses,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type Transport,
} from 'kundera-sn/transport';
import type { BlockId, FunctionCall } from 'kundera-sn/jsonrpc';

export interface ReadContractParams {
  abi: Abi;
  address: string;
  functionName: string;
  args?: unknown[];
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
 * Batch multiple read calls in a single JSON-RPC request.
 */
export async function multicallRead(
  transport: Transport,
  calls: ReadContractParams[],
  blockId: BlockId = 'latest',
): Promise<ContractResult<unknown[]>[]> {
  const results: ContractResult<unknown[]>[] = new Array(calls.length);
  const requests: JsonRpcRequest[] = [];
  const requestMeta: Array<{ index: number; abi: Abi; functionName: string }> = [];

  let requestId = 0;

  for (let i = 0; i < calls.length; i++) {
    const params = calls[i]!;
    const calldataResult = encodeCalldata(
      params.abi,
      params.functionName,
      (params.args ?? []) as any,
    );

    if (calldataResult.error) {
      results[i] = err('ENCODE_ERROR', calldataResult.error.message);
      continue;
    }

    const selector = getFunctionSelectorHex(params.functionName);
    const calldata = calldataResult.result.map((value) => Felt252(value).toHex());

    const call: FunctionCall = {
      contract_address: params.address,
      entry_point_selector: selector,
      calldata: calldata as any,
    };

    requestId += 1;
    requests.push(createRequest('starknet_call', [call, blockId], requestId));
    requestMeta.push({ index: i, abi: params.abi, functionName: params.functionName });
  }

  if (requests.length === 0) {
    return results.map((r) => r ?? err('ENCODE_ERROR', 'No valid calls'));
  }

  const responses = await transport.requestBatch(requests);
  const matched = matchBatchResponses(requests, responses as JsonRpcResponse[]);

  matched.forEach((response, idx) => {
    const meta = requestMeta[idx];
    if (!meta) return;

    if ('error' in response) {
      results[meta.index] = err('RPC_ERROR', response.error.message);
      return;
    }

    const outputFelts = (response.result as any as string[]).map((value) => BigInt(value));
    const decoded = decodeOutput(meta.abi, meta.functionName, outputFelts);
    if (decoded.error) {
      results[meta.index] = err('DECODE_ERROR', decoded.error.message);
      return;
    }

    results[meta.index] = ok(decoded.result);
  });

  return results.map((r) => r ?? err('RPC_ERROR', 'Missing response'));
}
