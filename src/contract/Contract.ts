/**
 * Contract Wrapper
 *
 * Functional wrapper for interacting with Starknet contracts.
 */

import type { StarknetRpcClient, BlockId } from '../rpc/client.js';
import { toHex } from '../primitives/index.js';
import {
  type Abi,
  type CairoValue,
  type DecodedStruct,
  type Call,
  type FeeEstimate,
  type Result,
  ok,
  err,
  abiError,
} from '../abi/types.js';
import { parseAbi, getFunction, computeSelector } from '../abi/parse.js';
import { encodeArgs, encodeArgsObject } from '../abi/encode.js';
import { decodeOutputs, decodeOutputsObject } from '../abi/decode.js';

// ============ Account Interface ============

/**
 * Minimal account interface for execute
 */
export interface Account {
  address: string;
  execute(calls: Call[]): Promise<{ transaction_hash: string }>;
}

// ============ Contract Options ============

/**
 * Options for creating a contract instance
 */
export interface ContractOptions {
  /** Contract ABI */
  abi: Abi;
  /** Contract address */
  address: string;
  /** RPC client for read operations */
  client: StarknetRpcClient;
  /** Account for write operations (optional) */
  account?: Account;
}

// ============ Contract Instance ============

/**
 * Contract instance with read/write methods
 */
export interface ContractInstance {
  /** Contract address */
  readonly address: string;
  /** Contract ABI */
  readonly abi: Abi;

  /**
   * Call a view function (read-only)
   *
   * @param fnName - Function name
   * @param args - Function arguments (array or object)
   * @param blockId - Block to query (default: 'latest')
   * @returns Decoded return values or error
   */
  read(
    fnName: string,
    args?: CairoValue[] | Record<string, CairoValue>,
    blockId?: BlockId
  ): Promise<Result<CairoValue[]>>;

  /**
   * Call a view function and return as object
   */
  readObject(
    fnName: string,
    args?: CairoValue[] | Record<string, CairoValue>,
    blockId?: BlockId
  ): Promise<Result<DecodedStruct>>;

  /**
   * Execute a state-changing function (requires account)
   *
   * @param fnName - Function name
   * @param args - Function arguments
   * @returns Transaction hash or error
   */
  write(
    fnName: string,
    args?: CairoValue[] | Record<string, CairoValue>
  ): Promise<Result<{ transactionHash: string }>>;

  /**
   * Estimate fee for a function call
   *
   * @param fnName - Function name
   * @param args - Function arguments
   * @param blockId - Block to query (default: 'latest')
   * @returns Fee estimate or error
   */
  estimateFee(
    fnName: string,
    args?: CairoValue[] | Record<string, CairoValue>,
    blockId?: BlockId
  ): Promise<Result<FeeEstimate>>;

  /**
   * Populate a call without executing
   *
   * @param fnName - Function name
   * @param args - Function arguments
   * @returns Call object ready for batching
   */
  populate(
    fnName: string,
    args?: CairoValue[] | Record<string, CairoValue>
  ): Result<Call>;

  /**
   * Get function selector
   */
  getSelector(fnName: string): Result<{ selector: bigint; selectorHex: string }>;
}

// ============ Contract Factory ============

/**
 * Create a contract instance
 *
 * @param options - Contract configuration
 * @returns Contract instance with read/write/estimateFee/populate methods
 *
 * @example
 * ```ts
 * const contract = getContract({
 *   abi: erc20Abi,
 *   address: '0x...',
 *   client: rpcClient,
 *   account: myAccount, // optional, for write()
 * });
 *
 * // Read balance
 * const result = await contract.read('balance_of', [address]);
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   console.log('Balance:', result.result[0]);
 * }
 *
 * // Transfer (requires account)
 * const tx = await contract.write('transfer', [recipient, amount]);
 * ```
 */
export function getContract(options: ContractOptions): ContractInstance {
  const { abi, address, client, account } = options;

  // Parse ABI once
  const parsedResult = parseAbi(abi);
  if (parsedResult.error) {
    throw new Error(`Invalid ABI: ${parsedResult.error.message}`);
  }
  const parsed = parsedResult.result;

  // Helper: encode args for a function
  function encodeCallArgs(
    fnName: string,
    args: CairoValue[] | Record<string, CairoValue> | undefined
  ): Result<{ selector: bigint; selectorHex: string; calldata: bigint[] }> {
    const fnResult = getFunction(parsed, fnName);
    if (fnResult.error) {
      return fnResult as Result<{ selector: bigint; selectorHex: string; calldata: bigint[] }>;
    }
    const fn = fnResult.result;

    const argsArray = args ?? [];
    const encoded = Array.isArray(argsArray)
      ? encodeArgs(fn.entry.inputs, argsArray, parsed)
      : encodeArgsObject(fn.entry.inputs, argsArray, parsed);

    if (encoded.error) {
      return encoded as Result<{ selector: bigint; selectorHex: string; calldata: bigint[] }>;
    }

    return ok({
      selector: fn.selector,
      selectorHex: fn.selectorHex,
      calldata: encoded.result,
    });
  }

  const instance: ContractInstance = {
    address,
    abi,

    async read(
      fnName: string,
      args?: CairoValue[] | Record<string, CairoValue>,
      blockId: BlockId = 'latest'
    ): Promise<Result<CairoValue[]>> {
      // Encode calldata
      const callResult = encodeCallArgs(fnName, args);
      if (callResult.error) {
        return callResult as Result<CairoValue[]>;
      }

      // Get function outputs
      const fnResult = getFunction(parsed, fnName);
      if (fnResult.error) {
        return fnResult as Result<CairoValue[]>;
      }
      const fn = fnResult.result;

      try {
        // Make RPC call
        const response = await client.callContract(
          {
            contract_address: address,
            entry_point_selector: callResult.result.selectorHex,
            calldata: callResult.result.calldata.map((v) => '0x' + v.toString(16)),
          },
          blockId
        );

        // Decode response
        const outputBigints = response.map((v) => BigInt(v));
        return decodeOutputs(outputBigints, fn.entry.outputs, parsed);
      } catch (error) {
        return err(
          abiError(
            'RPC_ERROR',
            `RPC call failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    },

    async readObject(
      fnName: string,
      args?: CairoValue[] | Record<string, CairoValue>,
      blockId: BlockId = 'latest'
    ): Promise<Result<DecodedStruct>> {
      // Encode calldata
      const callResult = encodeCallArgs(fnName, args);
      if (callResult.error) {
        return callResult as Result<DecodedStruct>;
      }

      // Get function outputs
      const fnResult = getFunction(parsed, fnName);
      if (fnResult.error) {
        return fnResult as Result<DecodedStruct>;
      }
      const fn = fnResult.result;

      try {
        // Make RPC call
        const response = await client.callContract(
          {
            contract_address: address,
            entry_point_selector: callResult.result.selectorHex,
            calldata: callResult.result.calldata.map((v) => '0x' + v.toString(16)),
          },
          blockId
        );

        // Decode response to object
        const outputBigints = response.map((v) => BigInt(v));
        return decodeOutputsObject(outputBigints, fn.entry.outputs, parsed);
      } catch (error) {
        return err(
          abiError(
            'RPC_ERROR',
            `RPC call failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    },

    async write(
      fnName: string,
      args?: CairoValue[] | Record<string, CairoValue>
    ): Promise<Result<{ transactionHash: string }>> {
      if (!account) {
        return err(
          abiError(
            'ACCOUNT_REQUIRED',
            'Account required for write operations. Pass account in getContract options.'
          )
        );
      }

      // Populate call
      const callResult = instance.populate(fnName, args);
      if (callResult.error) {
        return callResult as Result<{ transactionHash: string }>;
      }

      try {
        // Execute via account
        const result = await account.execute([callResult.result]);
        return ok({ transactionHash: result.transaction_hash });
      } catch (error) {
        return err(
          abiError(
            'RPC_ERROR',
            `Execute failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    },

    async estimateFee(
      fnName: string,
      args?: CairoValue[] | Record<string, CairoValue>,
      blockId: BlockId = 'latest'
    ): Promise<Result<FeeEstimate>> {
      // Populate call
      const callResult = instance.populate(fnName, args);
      if (callResult.error) {
        return callResult as Result<FeeEstimate>;
      }

      // Build invoke transaction for estimation
      const tx = {
        type: 'INVOKE' as const,
        version: '0x1' as const,
        sender_address: account?.address ?? address,
        calldata: [
          '0x1', // call array length
          callResult.result.contractAddress,
          callResult.result.entrypoint,
          '0x0', // data offset
          '0x' + callResult.result.calldata.length.toString(16), // data length
          '0x' + callResult.result.calldata.length.toString(16), // calldata length
          ...callResult.result.calldata.map((v) => '0x' + v.toString(16)),
        ],
        max_fee: '0x0',
        signature: [] as string[],
        nonce: '0x0',
      };

      try {
        const result = await client.estimateFee(tx, blockId);
        return ok({
          gasConsumed: BigInt(result.gas_consumed),
          gasPrice: BigInt(result.gas_price),
          overallFee: BigInt(result.overall_fee),
        });
      } catch (error) {
        return err(
          abiError(
            'RPC_ERROR',
            `Estimate fee failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    },

    populate(
      fnName: string,
      args?: CairoValue[] | Record<string, CairoValue>
    ): Result<Call> {
      const callResult = encodeCallArgs(fnName, args);
      if (callResult.error) {
        return callResult as Result<Call>;
      }

      return ok({
        contractAddress: address,
        entrypoint: callResult.result.selectorHex,
        calldata: callResult.result.calldata,
      });
    },

    getSelector(fnName: string): Result<{ selector: bigint; selectorHex: string }> {
      const fnResult = getFunction(parsed, fnName);
      if (fnResult.error) {
        return fnResult as Result<{ selector: bigint; selectorHex: string }>;
      }

      return ok({
        selector: fnResult.result.selector,
        selectorHex: fnResult.result.selectorHex,
      });
    },
  };

  return instance;
}
