/**
 * Account Types
 *
 * V3 transaction types for Starknet account abstraction.
 * Based on starkware-libs/starknet-specs@v0.10.0
 *
 * @module crypto/account-types
 */

import { type Felt252Input } from "../primitives/index.js";
import type { Signature } from "./index.js";

// ============ Resource Bounds ============

/**
 * Resource bounds for a single resource type
 */
export interface ResourceBounds {
	/** Maximum amount of this resource that can be used */
	max_amount: bigint;
	/** Maximum price per unit willing to pay */
	max_price_per_unit: bigint;
}

/**
 * Resource bounds mapping for all resource types
 * V3 transactions require bounds for L1_GAS, L2_GAS, and L1_DATA
 */
export interface ResourceBoundsMapping {
	l1_gas: ResourceBounds;
	l2_gas: ResourceBounds;
	l1_data_gas: ResourceBounds;
}

/**
 * Data availability mode (currently always 0 - L1)
 */
export type DataAvailabilityMode = 0;

// ============ V3 Transaction Common ============

/**
 * Common fields for all V3 transactions
 */
export interface V3TransactionCommon {
	/** Transaction version (always 3 for V3) */
	version: 3;
	/** Account nonce */
	nonce: bigint;
	/** Resource bounds for fee calculation */
	resource_bounds: ResourceBoundsMapping;
	/** Optional tip for sequencer (usually 0) */
	tip: bigint;
	/** Paymaster data (reserved, currently empty) */
	paymaster_data: bigint[];
	/** Nonce data availability mode (0 = L1) */
	nonce_data_availability_mode: DataAvailabilityMode;
	/** Fee data availability mode (0 = L1) */
	fee_data_availability_mode: DataAvailabilityMode;
}

// ============ INVOKE_V3 ============

/**
 * INVOKE_V3 transaction (unsigned)
 */
export interface InvokeTransactionV3 extends V3TransactionCommon {
	/** Sender contract address */
	sender_address: string;
	/** Encoded calldata */
	calldata: bigint[];
	/** Account deployment data (reserved, currently empty) */
	account_deployment_data: bigint[];
}

/**
 * Signed INVOKE_V3 transaction
 */
export interface SignedInvokeTransactionV3 extends InvokeTransactionV3 {
	/** Transaction signature */
	signature: bigint[];
}

// ============ DECLARE_V3 ============

/**
 * DECLARE_V3 transaction (unsigned)
 */
export interface DeclareTransactionV3 extends V3TransactionCommon {
	/** Sender contract address */
	sender_address: string;
	/** Class hash of the contract being declared */
	class_hash: string;
	/** Compiled class hash (Sierra -> CASM) */
	compiled_class_hash: string;
	/** Account deployment data (reserved, currently empty) */
	account_deployment_data: bigint[];
}

/**
 * Signed DECLARE_V3 transaction
 */
export interface SignedDeclareTransactionV3 extends DeclareTransactionV3 {
	/** Transaction signature */
	signature: bigint[];
}

// ============ DEPLOY_ACCOUNT_V3 ============

/**
 * DEPLOY_ACCOUNT_V3 transaction (unsigned)
 */
export interface DeployAccountTransactionV3 extends V3TransactionCommon {
	/** Class hash of the account contract */
	class_hash: string;
	/** Constructor calldata */
	constructor_calldata: bigint[];
	/** Contract address salt for deterministic deployment */
	contract_address_salt: string;
}

/**
 * Signed DEPLOY_ACCOUNT_V3 transaction
 */
export interface SignedDeployAccountTransactionV3
	extends DeployAccountTransactionV3 {
	/** Transaction signature */
	signature: bigint[];
}

// ============ Call ============

/**
 * A single contract call
 */
export interface Call {
	/** Target contract address */
	contractAddress: string;
	/** Entry point selector (function name hash) */
	entrypoint: string;
	/** Call arguments */
	calldata: Felt252Input[];
}

// ============ Universal Details ============

/**
 * Optional transaction details provided by the user
 */
export interface UniversalDetails {
	/** Override nonce (auto-fetched if not provided) */
	nonce?: bigint;
	/** Override resource bounds */
	resourceBounds?: Partial<ResourceBoundsMapping>;
	/** Tip for sequencer */
	tip?: bigint;
	/** Paymaster data */
	paymasterData?: bigint[];
	/** Skip signature validation (for simulation) */
	skipValidate?: boolean;
}

// ============ Payloads ============

/**
 * Declare transaction payload
 *
 * @remarks
 * Both classHash and compiledClassHash must be provided.
 * Sierra class hash computation is complex (involves Cairo compiler)
 * and is out of scope for P0. Use external tools like:
 * - starkli class-hash <sierra.json>
 * - starknet.js: computeSierraContractClassHash()
 */
export interface DeclarePayload {
	/** Contract class (Sierra JSON) */
	contract: unknown;
	/**
	 * Compiled class hash (Sierra -> CASM).
	 * Compute using: starkli class-hash --casm <casm.json>
	 */
	compiledClassHash: string;
	/**
	 * Sierra class hash (required).
	 * Compute using: starkli class-hash <sierra.json>
	 */
	classHash: string;
}

/**
 * Deploy account transaction payload
 */
export interface DeployAccountPayload {
	/** Account class hash */
	classHash: string;
	/** Constructor calldata */
	constructorCalldata?: Felt252Input[];
	/** Contract address salt */
	addressSalt?: string;
}

// ============ Results ============

/**
 * Result of execute transaction
 */
export interface ExecuteResult {
	transaction_hash: string;
}

/**
 * Result of declare transaction
 */
export interface DeclareResult {
	transaction_hash: string;
	class_hash: string;
}

/**
 * Result of deploy account transaction
 */
export interface DeployAccountResult {
	transaction_hash: string;
	contract_address: string;
}

// ============ Fee Estimation ============

/**
 * Fee estimate result (matches provider FeeEstimate)
 */
export interface FeeEstimate {
	gas_consumed: string;
	gas_price: string;
	data_gas_consumed: string;
	data_gas_price: string;
	overall_fee: string;
	unit: "WEI" | "FRI";
}

// ============ TypedData (EIP-712 style) ============

/**
 * Typed data domain for off-chain signing
 */
export interface TypedDataDomain {
	name?: string;
	version?: string;
	chainId?: string;
	revision?: string;
}

/**
 * Typed data type definition
 */
export interface TypedDataType {
	name: string;
	type: string;
}

/**
 * Typed data for off-chain message signing (SNIP-12)
 */
export interface TypedData {
	types: Record<string, TypedDataType[]>;
	primaryType: string;
	domain: TypedDataDomain;
	message: Record<string, unknown>;
}

// ============ Signer Types ============

/**
 * Signature as array of bigints (for RPC submission)
 */
export type SignatureArray = bigint[];

/**
 * Convert Signature to array format
 */
export function signatureToArray(sig: Signature): SignatureArray {
	return [sig.r.toBigInt(), sig.s.toBigInt()];
}

// ============ Constants ============

/**
 * Transaction version constants
 */
export const TRANSACTION_VERSION = {
	V3: 3n,
	// Query versions have high bit set
	V3_QUERY: 0x100000000000000000000000000000003n,
} as const;

/**
 * Default resource bounds for estimation
 */
export const DEFAULT_RESOURCE_BOUNDS: ResourceBoundsMapping = {
	l1_gas: { max_amount: 0n, max_price_per_unit: 0n },
	l2_gas: { max_amount: 0n, max_price_per_unit: 0n },
	l1_data_gas: { max_amount: 0n, max_price_per_unit: 0n },
};

/**
 * Transaction hash prefix for different transaction types
 * Used in Poseidon hash computation
 */
export const TRANSACTION_HASH_PREFIX = {
	INVOKE: 0x696e766f6b65n, // "invoke" as felt
	DECLARE: 0x6465636c617265n, // "declare" as felt
	DEPLOY_ACCOUNT: 0x6465706c6f795f6163636f756e74n, // "deploy_account" as felt
} as const;
