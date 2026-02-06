/**
 * Starknet Wallet RPC Schema
 *
 * Type-safe schema for the 12 standardized wallet_* JSON-RPC methods.
 * Based on starkware-libs/starknet-specs/wallet-api/wallet_rpc.json (v0.8.0).
 *
 * @module provider/schemas/WalletRpcSchema
 */

// ============================================================================
// Wallet API Parameter Types
// ============================================================================

/**
 * A single call within an invoke transaction.
 * Uses snake_case per the wallet API spec.
 */
export interface WalletCall {
	contract_address: string;
	entry_point: string;
	calldata?: string[];
}

/**
 * Parameters for wallet_addInvokeTransaction
 */
export interface WalletInvokeParams {
	calls: WalletCall[];
}

/**
 * Parameters for wallet_addDeclareTransaction
 */
export interface WalletDeclareParams {
	compiled_class_hash: string;
	contract_class: {
		sierra_program: string[];
		contract_class_version: string;
		entry_points_by_type: {
			CONSTRUCTOR: { selector: string; function_idx: number }[];
			EXTERNAL: { selector: string; function_idx: number }[];
			L1_HANDLER: { selector: string; function_idx: number }[];
		};
		abi: string;
	};
	class_hash?: string;
}

/**
 * SNIP-12 typed data for off-chain signatures.
 */
export interface WalletTypedData {
	types: Record<string, { name: string; type: string }[]>;
	primaryType: string;
	domain: {
		name?: string;
		version?: string;
		chainId?: string;
		revision?: string;
	};
	message: Record<string, unknown>;
}

/**
 * Account deployment data returned by wallet_deploymentData
 */
export interface WalletDeploymentData {
	address: string;
	class_hash: string;
	salt: string;
	calldata: string[];
	version: number;
}

/**
 * Parameters for wallet_watchAsset
 */
export interface WalletWatchAssetParams {
	type: "ERC20";
	options: {
		address: string;
		symbol?: string;
		decimals?: number;
		image?: string;
		name?: string;
	};
}

/**
 * Parameters for wallet_addStarknetChain
 */
export interface WalletAddChainParams {
	id: string;
	chain_id: string;
	chain_name: string;
	rpc_urls?: string[];
	block_explorer_urls?: string[];
	native_currency?: {
		name: string;
		symbol: string;
		decimals: number;
	};
}

/**
 * Parameters for wallet_switchStarknetChain
 */
export interface WalletSwitchChainParams {
	chainId: string;
	silent_mode?: boolean;
}

// ============================================================================
// Wallet RPC Schema
// ============================================================================

/**
 * Type-safe schema for the 12 wallet_* RPC methods.
 *
 * Can be used with `TypedProvider<WalletRpcSchema>` for compile-time
 * validation of wallet method calls.
 */
export type WalletRpcSchema = readonly [
	{
		Method: "wallet_supportedWalletApi";
		Parameters: [];
		ReturnType: string[];
	},
	{
		Method: "wallet_supportedSpecs";
		Parameters: [];
		ReturnType: string[];
	},
	{
		Method: "wallet_getPermissions";
		Parameters: [];
		ReturnType: string[];
	},
	{
		Method: "wallet_requestAccounts";
		Parameters: [{ silent_mode?: boolean }?];
		ReturnType: string[];
	},
	{
		Method: "wallet_requestChainId";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "wallet_deploymentData";
		Parameters: [];
		ReturnType: WalletDeploymentData;
	},
	{
		Method: "wallet_watchAsset";
		Parameters: [WalletWatchAssetParams];
		ReturnType: boolean;
	},
	{
		Method: "wallet_addStarknetChain";
		Parameters: [WalletAddChainParams];
		ReturnType: boolean;
	},
	{
		Method: "wallet_switchStarknetChain";
		Parameters: [WalletSwitchChainParams];
		ReturnType: boolean;
	},
	{
		Method: "wallet_addInvokeTransaction";
		Parameters: [WalletInvokeParams];
		ReturnType: { transaction_hash: string };
	},
	{
		Method: "wallet_addDeclareTransaction";
		Parameters: [WalletDeclareParams];
		ReturnType: { transaction_hash: string; class_hash: string };
	},
	{
		Method: "wallet_signTypedData";
		Parameters: [WalletTypedData];
		ReturnType: string[];
	},
];
