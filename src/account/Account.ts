/**
 * Account Class
 *
 * Main account abstraction for interacting with Starknet.
 * Handles transaction building, signing, and submission.
 *
 * @module account/Account
 */

import { Felt252, toBigInt, toHex, type Felt252Input } from '../primitives/index.js';
import type { Provider } from '../provider/Provider.js';
import type { SignerInterface } from './Signer.js';
import {
  computeInvokeV3Hash,
  computeDeclareV3Hash,
  computeDeployAccountV3Hash,
  computeContractAddress,
  computeSelector,
  hashCalldata,
} from './hash.js';
import {
  type Call,
  type UniversalDetails,
  type DeclarePayload,
  type DeployAccountPayload,
  type ExecuteResult,
  type DeclareResult,
  type DeployAccountResult,
  type FeeEstimate,
  type TypedData,
  type SignatureArray,
  type InvokeTransactionV3,
  type DeclareTransactionV3,
  type DeployAccountTransactionV3,
  type ResourceBoundsMapping,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_VERSION,
} from './types.js';

// ============ Account Class ============

/**
 * Account class for interacting with Starknet
 */
export class Account {
  /** Provider for RPC calls */
  readonly provider: Provider;
  /** Account address */
  readonly address: string;
  /** Signer for transaction signing */
  readonly signer: SignerInterface;

  /** Cached chain ID */
  private chainId: string | null = null;

  /**
   * Create a new Account instance
   * @param provider - JSON-RPC provider
   * @param address - Account contract address
   * @param signer - Signer for transaction signing
   */
  constructor(provider: Provider, address: string, signer: SignerInterface) {
    this.provider = provider;
    this.address = address;
    this.signer = signer;
  }

  // ============ Chain ID ============

  /**
   * Get chain ID (cached)
   */
  async getChainId(): Promise<string> {
    if (!this.chainId) {
      this.chainId = await this.provider.request({
        method: 'starknet_chainId',
        params: [],
      });
    }
    return this.chainId;
  }

  // ============ Nonce ============

  /**
   * Get current account nonce
   */
  async getNonce(): Promise<bigint> {
    const result = await this.provider.request({
      method: 'starknet_getNonce',
      params: ['pending', this.address],
    });
    return BigInt(result);
  }

  // ============ Execute (INVOKE) ============

  /**
   * Execute calls on the account
   * @param calls - Single call or array of calls
   * @param details - Optional transaction details
   */
  async execute(
    calls: Call | Call[],
    details?: UniversalDetails
  ): Promise<ExecuteResult> {
    const callsArray = Array.isArray(calls) ? calls : [calls];
    const chainId = await this.getChainId();
    const nonce = details?.nonce ?? (await this.getNonce());

    // Encode calldata using __execute__ format
    const calldata = encodeExecuteCalldata(callsArray);

    // Build transaction
    const tx: InvokeTransactionV3 = {
      version: 3,
      sender_address: this.address,
      calldata,
      nonce,
      resource_bounds: mergeResourceBounds(details?.resourceBounds),
      tip: details?.tip ?? 0n,
      paymaster_data: details?.paymasterData ?? [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    // Compute hash and sign
    const txHash = computeInvokeV3Hash(tx, chainId);
    const signature = await this.signer.signTransaction(txHash);

    // Submit transaction
    const result = await this.provider.request({
      method: 'starknet_addInvokeTransaction',
      params: [
        {
          type: 'INVOKE',
          ...formatInvokeForRpc(tx),
          signature: signature.map((s) => toHex(Felt252(s))),
        },
      ],
    });

    return result as ExecuteResult;
  }

  // ============ Declare ============

  /**
   * Declare a contract class
   *
   * @param payload - Declare payload with contract, classHash, and compiledClassHash
   * @param details - Optional transaction details
   *
   * @remarks
   * Both classHash and compiledClassHash are required. Sierra class hash
   * computation is complex and out of scope for P0. Use external tools:
   * - starkli class-hash <sierra.json>
   * - starknet.js: computeSierraContractClassHash()
   */
  async declare(
    payload: DeclarePayload,
    details?: UniversalDetails
  ): Promise<DeclareResult> {
    const chainId = await this.getChainId();
    const nonce = details?.nonce ?? (await this.getNonce());
    const { classHash } = payload;

    // Build transaction
    const tx: DeclareTransactionV3 = {
      version: 3,
      sender_address: this.address,
      class_hash: classHash,
      compiled_class_hash: payload.compiledClassHash,
      nonce,
      resource_bounds: mergeResourceBounds(details?.resourceBounds),
      tip: details?.tip ?? 0n,
      paymaster_data: details?.paymasterData ?? [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    // Compute hash and sign
    const txHash = computeDeclareV3Hash(tx, chainId);
    const signature = await this.signer.signTransaction(txHash);

    // Submit transaction
    const result = await this.provider.request({
      method: 'starknet_addDeclareTransaction',
      params: [
        {
          type: 'DECLARE',
          ...formatDeclareForRpc(tx, payload.contract),
          signature: signature.map((s) => toHex(Felt252(s))),
        },
      ],
    });

    return result as DeclareResult;
  }

  // ============ Deploy Account ============

  /**
   * Deploy an account contract
   * @param payload - Deploy account payload
   * @param details - Optional transaction details
   */
  async deployAccount(
    payload: DeployAccountPayload,
    details?: UniversalDetails
  ): Promise<DeployAccountResult> {
    const chainId = await this.getChainId();
    const nonce = details?.nonce ?? 0n; // Deploy account always uses nonce 0

    // Encode constructor calldata
    const constructorCalldata = (payload.constructorCalldata ?? []).map((c) =>
      toBigInt(Felt252(c))
    );

    // Generate salt if not provided
    const salt = payload.addressSalt ?? generateSalt();

    // Build transaction
    const tx: DeployAccountTransactionV3 = {
      version: 3,
      class_hash: payload.classHash,
      constructor_calldata: constructorCalldata,
      contract_address_salt: salt,
      nonce,
      resource_bounds: mergeResourceBounds(details?.resourceBounds),
      tip: details?.tip ?? 0n,
      paymaster_data: details?.paymasterData ?? [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
    };

    // Compute contract address
    const contractAddress = computeContractAddress(
      tx.class_hash,
      tx.contract_address_salt,
      tx.constructor_calldata
    );

    // Compute hash and sign
    const txHash = computeDeployAccountV3Hash(tx, contractAddress, chainId);
    const signature = await this.signer.signTransaction(txHash);

    // Submit transaction
    const result = await this.provider.request({
      method: 'starknet_addDeployAccountTransaction',
      params: [
        {
          type: 'DEPLOY_ACCOUNT',
          ...formatDeployAccountForRpc(tx),
          signature: signature.map((s) => toHex(Felt252(s))),
        },
      ],
    });

    return result as DeployAccountResult;
  }

  // ============ Fee Estimation ============

  /**
   * Estimate fee for execute transaction
   */
  async estimateInvokeFee(
    calls: Call | Call[],
    details?: UniversalDetails
  ): Promise<FeeEstimate> {
    const callsArray = Array.isArray(calls) ? calls : [calls];
    const nonce = details?.nonce ?? (await this.getNonce());
    const calldata = encodeExecuteCalldata(callsArray);

    const tx: InvokeTransactionV3 = {
      version: 3,
      sender_address: this.address,
      calldata,
      nonce,
      resource_bounds: mergeResourceBounds(details?.resourceBounds),
      tip: details?.tip ?? 0n,
      paymaster_data: details?.paymasterData ?? [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    const simulationFlags = details?.skipValidate ? ['SKIP_VALIDATE'] : [];

    const result = await this.provider.request({
      method: 'starknet_estimateFee',
      params: [
        [{ type: 'INVOKE', ...formatInvokeForRpc(tx), signature: [] }],
        simulationFlags,
        'pending',
      ],
    });

    return (result as FeeEstimate[])[0];
  }

  /**
   * Estimate fee for declare transaction
   */
  async estimateDeclareFee(
    payload: DeclarePayload,
    details?: UniversalDetails
  ): Promise<FeeEstimate> {
    const nonce = details?.nonce ?? (await this.getNonce());
    const { classHash } = payload;

    const tx: DeclareTransactionV3 = {
      version: 3,
      sender_address: this.address,
      class_hash: classHash,
      compiled_class_hash: payload.compiledClassHash,
      nonce,
      resource_bounds: mergeResourceBounds(details?.resourceBounds),
      tip: details?.tip ?? 0n,
      paymaster_data: details?.paymasterData ?? [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    const simulationFlags = details?.skipValidate ? ['SKIP_VALIDATE'] : [];

    const result = await this.provider.request({
      method: 'starknet_estimateFee',
      params: [
        [
          {
            type: 'DECLARE',
            ...formatDeclareForRpc(tx, payload.contract),
            signature: [],
          },
        ],
        simulationFlags,
        'pending',
      ],
    });

    return (result as FeeEstimate[])[0];
  }

  /**
   * Estimate fee for deploy account transaction
   */
  async estimateDeployAccountFee(
    payload: DeployAccountPayload,
    details?: UniversalDetails
  ): Promise<FeeEstimate> {
    const nonce = 0n; // Deploy account always uses nonce 0
    const constructorCalldata = (payload.constructorCalldata ?? []).map((c) =>
      toBigInt(Felt252(c))
    );
    const salt = payload.addressSalt ?? generateSalt();

    const tx: DeployAccountTransactionV3 = {
      version: 3,
      class_hash: payload.classHash,
      constructor_calldata: constructorCalldata,
      contract_address_salt: salt,
      nonce,
      resource_bounds: mergeResourceBounds(details?.resourceBounds),
      tip: details?.tip ?? 0n,
      paymaster_data: details?.paymasterData ?? [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
    };

    const simulationFlags = details?.skipValidate ? ['SKIP_VALIDATE'] : [];

    const result = await this.provider.request({
      method: 'starknet_estimateFee',
      params: [
        [{ type: 'DEPLOY_ACCOUNT', ...formatDeployAccountForRpc(tx), signature: [] }],
        simulationFlags,
        'pending',
      ],
    });

    return (result as FeeEstimate[])[0];
  }

  // ============ Message Signing ============

  /**
   * Sign typed data (off-chain message)
   */
  async signMessage(typedData: TypedData): Promise<SignatureArray> {
    return this.signer.signMessage(typedData, this.address);
  }
}

// ============ Helpers ============

/**
 * Merge user-provided resource bounds with defaults
 */
function mergeResourceBounds(
  partial?: Partial<ResourceBoundsMapping>
): ResourceBoundsMapping {
  if (!partial) return DEFAULT_RESOURCE_BOUNDS;

  return {
    l1_gas: { ...DEFAULT_RESOURCE_BOUNDS.l1_gas, ...partial.l1_gas },
    l2_gas: { ...DEFAULT_RESOURCE_BOUNDS.l2_gas, ...partial.l2_gas },
    l1_data_gas: { ...DEFAULT_RESOURCE_BOUNDS.l1_data_gas, ...partial.l1_data_gas },
  };
}

/**
 * Encode calls for __execute__ entry point
 *
 * Format: [call_array_len, ...call_array, calldata_len, ...calldata]
 * Each call: [to, selector, data_offset, data_len]
 */
function encodeExecuteCalldata(calls: Call[]): bigint[] {
  const callArray: bigint[] = [];
  const calldataFlat: bigint[] = [];

  let offset = 0;
  for (const call of calls) {
    const selector = computeSelector(call.entrypoint);
    const calldata = call.calldata.map((c) => toBigInt(Felt252(c)));

    callArray.push(
      toBigInt(Felt252(call.contractAddress)),
      toBigInt(selector),
      BigInt(offset),
      BigInt(calldata.length)
    );

    calldataFlat.push(...calldata);
    offset += calldata.length;
  }

  return [
    BigInt(calls.length),
    ...callArray,
    BigInt(calldataFlat.length),
    ...calldataFlat,
  ];
}

/**
 * Format INVOKE transaction for RPC submission
 */
function formatInvokeForRpc(tx: InvokeTransactionV3): Record<string, unknown> {
  return {
    version: toHex(Felt252(TRANSACTION_VERSION.V3)),
    sender_address: tx.sender_address,
    calldata: tx.calldata.map((c) => toHex(Felt252(c))),
    nonce: toHex(Felt252(tx.nonce)),
    resource_bounds: formatResourceBoundsForRpc(tx.resource_bounds),
    tip: toHex(Felt252(tx.tip)),
    paymaster_data: tx.paymaster_data.map((p) => toHex(Felt252(p))),
    nonce_data_availability_mode: 'L1',
    fee_data_availability_mode: 'L1',
    account_deployment_data: tx.account_deployment_data.map((a) =>
      toHex(Felt252(a))
    ),
  };
}

/**
 * Format DECLARE transaction for RPC submission
 */
function formatDeclareForRpc(
  tx: DeclareTransactionV3,
  contract: unknown
): Record<string, unknown> {
  return {
    version: toHex(Felt252(TRANSACTION_VERSION.V3)),
    sender_address: tx.sender_address,
    compiled_class_hash: tx.compiled_class_hash,
    contract_class: contract,
    nonce: toHex(Felt252(tx.nonce)),
    resource_bounds: formatResourceBoundsForRpc(tx.resource_bounds),
    tip: toHex(Felt252(tx.tip)),
    paymaster_data: tx.paymaster_data.map((p) => toHex(Felt252(p))),
    nonce_data_availability_mode: 'L1',
    fee_data_availability_mode: 'L1',
    account_deployment_data: tx.account_deployment_data.map((a) =>
      toHex(Felt252(a))
    ),
  };
}

/**
 * Format DEPLOY_ACCOUNT transaction for RPC submission
 */
function formatDeployAccountForRpc(
  tx: DeployAccountTransactionV3
): Record<string, unknown> {
  return {
    version: toHex(Felt252(TRANSACTION_VERSION.V3)),
    class_hash: tx.class_hash,
    constructor_calldata: tx.constructor_calldata.map((c) => toHex(Felt252(c))),
    contract_address_salt: tx.contract_address_salt,
    nonce: toHex(Felt252(tx.nonce)),
    resource_bounds: formatResourceBoundsForRpc(tx.resource_bounds),
    tip: toHex(Felt252(tx.tip)),
    paymaster_data: tx.paymaster_data.map((p) => toHex(Felt252(p))),
    nonce_data_availability_mode: 'L1',
    fee_data_availability_mode: 'L1',
  };
}

/**
 * Format resource bounds for RPC (object format)
 */
function formatResourceBoundsForRpc(
  rb: ResourceBoundsMapping
): Record<string, Record<string, string>> {
  return {
    l1_gas: {
      max_amount: toHex(Felt252(rb.l1_gas.max_amount)),
      max_price_per_unit: toHex(Felt252(rb.l1_gas.max_price_per_unit)),
    },
    l2_gas: {
      max_amount: toHex(Felt252(rb.l2_gas.max_amount)),
      max_price_per_unit: toHex(Felt252(rb.l2_gas.max_price_per_unit)),
    },
    l1_data: {
      max_amount: toHex(Felt252(rb.l1_data_gas.max_amount)),
      max_price_per_unit: toHex(Felt252(rb.l1_data_gas.max_price_per_unit)),
    },
  };
}

/**
 * Generate random salt for deployment
 */
function generateSalt(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(Felt252(bytes));
}

// ============ Factory Function ============

/**
 * Create an Account instance
 */
export function createAccount(
  provider: Provider,
  address: string,
  signer: SignerInterface
): Account {
  return new Account(provider, address, signer);
}
