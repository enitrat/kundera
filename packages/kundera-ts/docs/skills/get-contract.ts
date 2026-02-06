/**
 * Get Contract Skill
 *
 * Type-safe contract factory with full type inference.
 * Demonstrates FunctionRet/FunctionArgs for typed read/write.
 */

import {
  encodeCalldata,
  decodeOutput,
  getFunctionSelectorHex,
  type KanabiAbi,
  type AbiLike,
  type CairoValue,
  type Result,
  type ExtractAbiFunctionNames,
  type ExtractAbiFunction,
  type ExtractArgs,
  type FunctionRet,
} from '@kundera-sn/kundera-ts/abi';
import { Felt252 } from '@kundera-sn/kundera-ts';
import { Rpc } from '@kundera-sn/kundera-ts/jsonrpc';
import type { BlockId, FunctionCall } from '@kundera-sn/kundera-ts/jsonrpc';
import type { Transport } from '@kundera-sn/kundera-ts/transport';

/** Send a request-builder result through a transport and unwrap the response. */
async function send<T>(transport: Transport, req: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T> {
  const response = await transport.request({ jsonrpc: '2.0', id: 1, method: req.method, params: req.params ?? [] });
  if ('error' in response) throw new Error(response.error.message);
  return response.result as T;
}

// ============ Types ============

export interface ContractConfig<TAbi extends KanabiAbi> {
  abi: TAbi;
  address: string;
  transport: Transport;
}

export interface ReadOptions {
  blockId?: BlockId;
}

export interface ContractError {
  code: 'ENCODE_ERROR' | 'DECODE_ERROR' | 'RPC_ERROR';
  message: string;
}

export type ContractResult<T> = Result<T, ContractError>;

// ============ Contract Instance ============

export interface Contract<TAbi extends KanabiAbi> {
  address: string;
  abi: TAbi;

  /**
   * Read from contract with full type inference.
   *
   * @example
   * ```ts
   * const balance = await contract.read('balance_of', [accountAddress]);
   * // balance is typed as FunctionRet<TAbi, 'balance_of'>
   * ```
   */
  read<TFunctionName extends ExtractAbiFunctionNames<TAbi>>(
    functionName: TFunctionName,
    args: ExtractArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>>,
    options?: ReadOptions
  ): Promise<ContractResult<FunctionRet<TAbi, TFunctionName>>>;
}

// ============ Implementation ============

function ok<T>(result: T): ContractResult<T> {
  return { result, error: null };
}

function err<T>(code: ContractError['code'], message: string): ContractResult<T> {
  return { result: null, error: { code, message } };
}

/**
 * Create a type-safe contract instance.
 *
 * @example
 * ```ts
 * const ERC20_ABI = [...] as const;
 *
 * const contract = getContract({
 *   abi: ERC20_ABI,
 *   address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
 *   transport: httpTransport('https://api.zan.top/public/starknet-mainnet'),
 * });
 *
 * // Fully typed - args and return type inferred from ABI
 * const balance = await contract.read('balance_of', ['0x123...']);
 * ```
 */
export function getContract<TAbi extends KanabiAbi>(
  config: ContractConfig<TAbi>
): Contract<TAbi> {
  const { abi, address, transport } = config;

  return {
    address,
    abi,

    async read<TFunctionName extends ExtractAbiFunctionNames<TAbi>>(
      functionName: TFunctionName,
      args: ExtractArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>>,
      options?: ReadOptions
    ): Promise<ContractResult<FunctionRet<TAbi, TFunctionName>>> {
      // Use untyped overload at runtime — type safety is at the read() signature.
      const calldataResult = encodeCalldata(
        abi as AbiLike,
        functionName as string,
        args as CairoValue[]
      );
      if (calldataResult.error) {
        return err('ENCODE_ERROR', calldataResult.error.message);
      }

      // Build RPC call
      const selector = getFunctionSelectorHex(functionName);
      const calldata = calldataResult.result.map((v) => Felt252(v).toHex());

      const call: FunctionCall = {
        contract_address: address,
        entry_point_selector: selector,
        calldata: calldata as `0x${string}`[],
      };

      // Execute call
      try {
        const output = await send<string[]>(transport, Rpc.CallRequest(call, options?.blockId));
        const outputFelts = output.map((v) => BigInt(v));

        const decoded = decodeOutput(
          abi as AbiLike,
          functionName as string,
          outputFelts
        );
        if (decoded.error) {
          return err('DECODE_ERROR', decoded.error.message);
        }

        return ok(decoded.result as FunctionRet<TAbi, TFunctionName>);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return err('RPC_ERROR', message);
      }
    },
  };
}
