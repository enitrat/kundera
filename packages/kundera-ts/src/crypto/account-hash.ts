/**
 * Transaction Hash Computation
 *
 * Poseidon-based hash computation for V3 transactions.
 * Based on starkware-libs/starknet-specs@v0.10.0
 *
 * @module crypto/account-hash
 */

import {
	Felt252,
	type Felt252Input,
	type Felt252Type,
} from "../primitives/index.js";
import {
	type DataAvailabilityMode,
	type DeclareTransactionV3,
	type DeployAccountTransactionV3,
	type InvokeTransactionV3,
	type ResourceBoundsMapping,
	TRANSACTION_HASH_PREFIX,
} from "./account-types.js";
import { pedersenHash, poseidonHashMany, snKeccak } from "./index.js";

// ============ Resource Bounds Encoding ============

/**
 * Resource type identifiers as felt (short string encoding)
 */
const RESOURCE_TYPE = {
	L1_GAS: 0x4c315f474153n, // "L1_GAS"
	L2_GAS: 0x4c325f474153n, // "L2_GAS"
	L1_DATA: 0x4c315f44415441n, // "L1_DATA"
} as const;

/**
 * Encode a single resource bound into a felt
 *
 * Layout per Starknet spec:
 *   60 bits (resource_type) | 64 bits (max_amount) | 128 bits (max_price_per_unit)
 * Total: 252 bits
 *
 * @param resourceType - Resource type identifier
 * @param maxAmount - Maximum amount (64 bits)
 * @param maxPricePerUnit - Maximum price per unit in fri (128 bits)
 */
function encodeResourceBound(
	resourceType: bigint,
	maxAmount: bigint,
	maxPricePerUnit: bigint,
): bigint {
	const RESOURCE_TYPE_BITS = 60n;
	const MAX_AMOUNT_BITS = 64n;
	const MAX_PRICE_BITS = 128n;

	if (resourceType >= 1n << RESOURCE_TYPE_BITS) {
		throw new Error("resource_type exceeds 60 bits");
	}
	if (maxAmount >= 1n << MAX_AMOUNT_BITS) {
		throw new Error("max_amount exceeds 64 bits");
	}
	if (maxPricePerUnit >= 1n << MAX_PRICE_BITS) {
		throw new Error("max_price_per_unit exceeds 128 bits");
	}

	// Layout: resource_type (60) | max_amount (64) | max_price_per_unit (128)
	return (
		(resourceType << (MAX_AMOUNT_BITS + MAX_PRICE_BITS)) |
		(maxAmount << MAX_PRICE_BITS) |
		maxPricePerUnit
	);
}

/**
 * Encode resource bounds for V3 transactions
 * Returns array of encoded resource bounds [L1_GAS, L2_GAS, L1_DATA]
 *
 * Order: L1_GAS, L2_GAS, L1_DATA (per spec)
 */

/**
 * Hash tip and resource bounds together for V3 transactions
 * Per starknet.js v6: h(tip, l1_gas_bounds, l2_gas_bounds)
 * Note: L1_DATA is NOT included in the fee field hash per current implementations
 *
 * @param tip - Transaction tip
 * @param resourceBounds - Resource bounds mapping
 */
export function hashTipAndResourceBounds(
	tip: bigint,
	resourceBounds: ResourceBoundsMapping,
): Felt252Type {
	const l1Gas = encodeResourceBound(
		RESOURCE_TYPE.L1_GAS,
		resourceBounds.l1_gas.max_amount,
		resourceBounds.l1_gas.max_price_per_unit,
	);
	const l2Gas = encodeResourceBound(
		RESOURCE_TYPE.L2_GAS,
		resourceBounds.l2_gas.max_amount,
		resourceBounds.l2_gas.max_price_per_unit,
	);
	// Note: L1_DATA is NOT included per starknet.js/starknet-jvm implementations
	return poseidonHashMany([Felt252(tip), Felt252(l1Gas), Felt252(l2Gas)]);
}

// ============ DA Modes Encoding ============

/**
 * Encode data availability modes into a single felt
 * Layout per spec:
 *   - bits 0-31: fee_data_availability_mode
 *   - bits 32-63: nonce_data_availability_mode
 * (both currently 0 for L1 mode)
 */
export function encodeDAModes(
	nonceDAMode: DataAvailabilityMode,
	feeDAMode: DataAvailabilityMode,
): bigint {
	return (BigInt(nonceDAMode) << 32n) | BigInt(feeDAMode);
}

// ============ Calldata Hash ============

/**
 * Poseidon hash of empty array (precomputed)
 * poseidonHashMany([]) = 0x2272be0f580fd156823304800919530eaa97430e972d7213ee13f4fbf7a5dbc
 * Source: @scure/starknet poseidonHashMany([])
 */
const POSEIDON_EMPTY_ARRAY_HASH =
	Felt252(0x2272be0f580fd156823304800919530eaa97430e972d7213ee13f4fbf7a5dbcn);

/**
 * Hash calldata array using Poseidon
 * Note: Empty arrays still go through poseidon (matching starknet.js behavior)
 */
export function hashCalldata(calldata: bigint[]): Felt252Type {
	if (calldata.length === 0) {
		// Return precomputed hash for empty array (FFI doesn't support empty arrays)
		return POSEIDON_EMPTY_ARRAY_HASH;
	}
	return poseidonHashMany(calldata.map((c) => Felt252(c)));
}

// ============ INVOKE_V3 Hash ============

/**
 * Compute transaction hash for INVOKE_V3
 *
 * Hash structure (Poseidon) per starknet-specs v0.10.0:
 * [
 *   "invoke" prefix,
 *   version,
 *   sender_address,
 *   h(tip, l1_gas_bounds, l2_gas_bounds),  // Note: L1_DATA omitted per starknet.js v6
 *   h(paymaster_data),
 *   chain_id,
 *   nonce,
 *   da_modes,
 *   h(account_deployment_data),
 *   h(calldata)
 * ]
 */
export function computeInvokeV3Hash(
	tx: InvokeTransactionV3,
	chainId: Felt252Input,
): Felt252Type {
	const tipAndResourceBoundsHash = hashTipAndResourceBounds(
		tx.tip,
		tx.resource_bounds,
	);
	const paymasterDataHash = hashCalldata(tx.paymaster_data);
	const accountDeploymentDataHash = hashCalldata(tx.account_deployment_data);
	const calldataHash = hashCalldata(tx.calldata);
	const daModes = encodeDAModes(
		tx.nonce_data_availability_mode,
		tx.fee_data_availability_mode,
	);

	const elements: Felt252Input[] = [
		TRANSACTION_HASH_PREFIX.INVOKE,
		BigInt(tx.version),
		tx.sender_address,
		tipAndResourceBoundsHash,
		paymasterDataHash,
		chainId,
		tx.nonce,
		daModes,
		accountDeploymentDataHash,
		calldataHash,
	];

	return poseidonHashMany(elements.map((e) => Felt252(e)));
}

// ============ DECLARE_V3 Hash ============

/**
 * Compute transaction hash for DECLARE_V3
 *
 * Hash structure (Poseidon) per starknet-specs v0.10.0:
 * [
 *   "declare" prefix,
 *   version,
 *   sender_address,
 *   h(tip, l1_gas_bounds, l2_gas_bounds),  // Note: L1_DATA omitted per starknet.js v6
 *   h(paymaster_data),
 *   chain_id,
 *   nonce,
 *   da_modes,
 *   h(account_deployment_data),
 *   class_hash,
 *   compiled_class_hash
 * ]
 */
export function computeDeclareV3Hash(
	tx: DeclareTransactionV3,
	chainId: Felt252Input,
): Felt252Type {
	const tipAndResourceBoundsHash = hashTipAndResourceBounds(
		tx.tip,
		tx.resource_bounds,
	);
	const paymasterDataHash = hashCalldata(tx.paymaster_data);
	const accountDeploymentDataHash = hashCalldata(tx.account_deployment_data);
	const daModes = encodeDAModes(
		tx.nonce_data_availability_mode,
		tx.fee_data_availability_mode,
	);

	const elements: Felt252Input[] = [
		TRANSACTION_HASH_PREFIX.DECLARE,
		BigInt(tx.version),
		tx.sender_address,
		tipAndResourceBoundsHash,
		paymasterDataHash,
		chainId,
		tx.nonce,
		daModes,
		accountDeploymentDataHash,
		tx.class_hash,
		tx.compiled_class_hash,
	];

	return poseidonHashMany(elements.map((e) => Felt252(e)));
}

// ============ DEPLOY_ACCOUNT_V3 Hash ============

/**
 * Compute transaction hash for DEPLOY_ACCOUNT_V3
 *
 * Hash structure (Poseidon) per starknet-specs v0.10.0:
 * [
 *   "deploy_account" prefix,
 *   version,
 *   contract_address (computed from class_hash, salt, constructor_calldata),
 *   h(tip, l1_gas_bounds, l2_gas_bounds),  // Note: L1_DATA omitted per starknet.js v6
 *   h(paymaster_data),
 *   chain_id,
 *   nonce,
 *   da_modes,
 *   h(constructor_calldata),
 *   class_hash,
 *   contract_address_salt
 * ]
 */
export function computeDeployAccountV3Hash(
	tx: DeployAccountTransactionV3,
	contractAddress: Felt252Input,
	chainId: Felt252Input,
): Felt252Type {
	const tipAndResourceBoundsHash = hashTipAndResourceBounds(
		tx.tip,
		tx.resource_bounds,
	);
	const paymasterDataHash = hashCalldata(tx.paymaster_data);
	const constructorCalldataHash = hashCalldata(tx.constructor_calldata);
	const daModes = encodeDAModes(
		tx.nonce_data_availability_mode,
		tx.fee_data_availability_mode,
	);

	const elements: Felt252Input[] = [
		TRANSACTION_HASH_PREFIX.DEPLOY_ACCOUNT,
		BigInt(tx.version),
		contractAddress,
		tipAndResourceBoundsHash,
		paymasterDataHash,
		chainId,
		tx.nonce,
		daModes,
		constructorCalldataHash,
		tx.class_hash,
		tx.contract_address_salt,
	];

	return poseidonHashMany(elements.map((e) => Felt252(e)));
}

// ============ Contract Address Computation ============

/**
 * Compute contract address for DEPLOY_ACCOUNT
 *
 * address = pedersen(
 *   "STARKNET_CONTRACT_ADDRESS",
 *   0, // deployer_address (0 for deploy_account)
 *   salt,
 *   class_hash,
 *   pedersen(constructor_calldata)
 * ) mod 2^251
 *
 * Note: Uses Pedersen, not Poseidon (per spec)
 */
export function computeContractAddress(
	classHash: Felt252Input,
	salt: Felt252Input,
	constructorCalldata: bigint[],
	deployerAddress: Felt252Input = 0n,
): Felt252Type {
	// CONTRACT_ADDRESS_PREFIX = keccak256("STARKNET_CONTRACT_ADDRESS")
	const CONTRACT_ADDRESS_PREFIX =
		Felt252(0x535441524b4e45545f434f4e54524143545f41444452455353n);

	// Hash constructor calldata with Pedersen
	let calldataHash = Felt252(0n);
	for (const item of constructorCalldata) {
		calldataHash = pedersenHash(calldataHash, Felt252(item));
	}

	// Compute address
	let hash = pedersenHash(CONTRACT_ADDRESS_PREFIX, Felt252(deployerAddress));
	hash = pedersenHash(hash, Felt252(salt));
	hash = pedersenHash(hash, Felt252(classHash));
	hash = pedersenHash(hash, calldataHash);

	// Mod 2^251
	const hashBigInt = hash.toBigInt();
	const addressBigInt = hashBigInt & ((1n << 251n) - 1n);

	return Felt252(addressBigInt);
}

// ============ Entry Point Selector ============

/**
 * Well-known selectors (precomputed)
 * These are starknet_keccak(name) values for common entry points
 */
const KNOWN_SELECTORS: Record<string, string> = {
	// Account methods
	__execute__:
		"0x15d40a3d6ca2ac30f4031e42be28da9b056fef9bb7357ac5e85627ee876e5ad",
	__validate__:
		"0x162da33a4585851fe8d3af3c2a9c60b557814e221e0d4f30ff0b2189d9c7775",
	__validate_declare__:
		"0x289da278a8dc833409cabfdad1581e8e7d40e42dcaed693fa4008dcdb4963b3",
	__validate_deploy__:
		"0x36fcbf06cd96843058359e1a75928beacfac10727dab22a3972f0af8aa92895",
	// ERC20 methods
	transfer: "0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e",
	transferFrom:
		"0x41b033f4a31df8067c24d1e9b550a2ce75fd4a29e1147571f8f3b1b79e9a0fd",
	approve: "0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c",
	balanceOf:
		"0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e",
	// ERC721 methods
	mint: "0x2f0b3c5710379609eb5495f1ecd348cb28167711b73609fe565a72734550354",
	// UDC methods
	deployContract:
		"0x5df99ae77df976b4f0e5cf28c7dcfe09bd6e81aab787b19ac0c08e03d928cf",
};

/**
 * Compute entry point selector from function name
 * selector = starknet_keccak(name) mod 2^250
 *
 * For P0, uses precomputed values for known selectors.
 * Custom selectors require snKeccak implementation (P1).
 *
 * @param name - Function name (e.g., "transfer", "__execute__")
 * @returns Selector as Felt252
 * @throws Error if selector not in KNOWN_SELECTORS and snKeccak not implemented
 */
export function computeSelector(name: string): Felt252Type {
	const known = KNOWN_SELECTORS[name];
	if (known) {
		return Felt252(known);
	}

	// Try snKeccak - will throw if not implemented
	try {
		const encoder = new TextEncoder();
		const nameBytes = encoder.encode(name);
		return snKeccak(nameBytes);
	} catch (e) {
		throw new Error(
			`Unknown selector for "${name}". Either add to KNOWN_SELECTORS or implement snKeccak. Original error: ${e instanceof Error ? e.message : String(e)}`,
		);
	}
}

/**
 * Standard selectors (precomputed)
 */
const executeSelector = KNOWN_SELECTORS.__execute__;
if (!executeSelector) {
	throw new Error("Missing __execute__ selector in KNOWN_SELECTORS");
}
export const EXECUTE_SELECTOR = Felt252(executeSelector);
