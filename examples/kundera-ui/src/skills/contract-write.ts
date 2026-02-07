/**
 * Contract Write Skill
 *
 * State-changing contract calls using an account executor.
 * Generic over ABI for full type inference of args.
 */

import {
  encodeCalldata,
  type StarknetAbi,
  type InferFunctionName,
  type InferArgs,
} from '@kundera-sn/kundera-ts/abi';
import type { Call, UniversalDetails } from '@kundera-sn/kundera-ts/crypto';

export interface AccountExecutor {
  address: string;
  execute: (calls: Call | Call[], details?: UniversalDetails) => Promise<{ transaction_hash: string }>;
}

export interface WriteContractParams<
  TAbi extends StarknetAbi,
  TFunctionName extends InferFunctionName<TAbi> & string,
> {
  abi: TAbi;
  address: string;
  functionName: TFunctionName;
  args?: InferArgs<TAbi, TFunctionName>;
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
 *
 * When the ABI is passed `as const`, args are fully inferred:
 *
 * @example
 * ```ts
 * const ERC20_ABI = [...] as const;
 *
 * // args: [ContractAddress, u256] — type-checked against ABI
 * const { result } = await writeContract({
 *   abi: ERC20_ABI,
 *   address: '0x049d...',
 *   functionName: 'transfer',
 *   args: [recipient, amount],
 *   account,
 * });
 * ```
 */
export async function writeContract<
  TAbi extends StarknetAbi,
  TFunctionName extends InferFunctionName<TAbi> & string,
>(
  params: WriteContractParams<TAbi, TFunctionName>,
): Promise<ContractResult<WriteResult>> {
  const { abi, address, functionName, args = [] as never, account, details } = params;

  if (!account?.execute) {
    return err('ACCOUNT_REQUIRED', 'Account executor with execute() is required');
  }

  const calldataResult = encodeCalldata(abi, functionName, args);
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
