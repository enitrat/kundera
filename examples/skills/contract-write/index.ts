/**
 * Contract Write Skill
 *
 * State-changing contract calls using an account executor.
 */

import { encodeCalldata, type Abi } from 'kundera/abi';
import type { Call, UniversalDetails } from 'kundera/crypto';

export interface AccountExecutor {
  address: string;
  execute: (calls: Call | Call[], details?: UniversalDetails) => Promise<{ transaction_hash: string }>;
}

export interface WriteContractParams {
  abi: Abi;
  address: string;
  functionName: string;
  args?: unknown[];
  account: AccountExecutor;
  details?: UniversalDetails;
}

export interface ContractError {
  code: ContractErrorCode;
  message: string;
}

export type ContractErrorCode = 'ENCODE_ERROR' | 'ACCOUNT_REQUIRED' | 'RPC_ERROR';

export interface ContractResult<T> {
  result: T | null;
  error: ContractError | null;
}

export interface WriteResult {
  transactionHash: string;
}

function ok<T>(result: T): ContractResult<T> {
  return { result, error: null };
}

function err<T>(code: ContractErrorCode, message: string): ContractResult<T> {
  return { result: null, error: { code, message } };
}

/**
 * Write to a contract (state-changing function).
 */
export async function writeContract(
  params: WriteContractParams,
): Promise<ContractResult<WriteResult>> {
  const { abi, address, functionName, args = [], account, details } = params;

  if (!account?.execute) {
    return err('ACCOUNT_REQUIRED', 'Account executor with execute() is required');
  }

  const calldataResult = encodeCalldata(abi, functionName, args as any);
  if (calldataResult.error) {
    return err('ENCODE_ERROR', calldataResult.error.message);
  }

  const call: Call = {
    contractAddress: address,
    entrypoint: functionName,
    calldata: calldataResult.result,
  };

  try {
    const result = await account.execute(call, details);
    return ok({ transactionHash: result.transaction_hash });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err('RPC_ERROR', message);
  }
}
