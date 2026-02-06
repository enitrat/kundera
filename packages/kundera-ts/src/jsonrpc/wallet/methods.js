/**
 * Starknet Wallet JSON-RPC Request Builders
 *
 * Barrel export of all wallet_* request builder functions.
 */

import * as _supportedWalletApi from "./supportedWalletApi.js";
import * as _supportedSpecs from "./supportedSpecs.js";
import * as _getPermissions from "./getPermissions.js";
import * as _requestAccounts from "./requestAccounts.js";
import * as _requestChainId from "./requestChainId.js";
import * as _deploymentData from "./deploymentData.js";
import * as _watchAsset from "./watchAsset.js";
import * as _addStarknetChain from "./addStarknetChain.js";
import * as _switchStarknetChain from "./switchStarknetChain.js";
import * as _addInvokeTransaction from "./addInvokeTransaction.js";
import * as _addDeclareTransaction from "./addDeclareTransaction.js";
import * as _signTypedData from "./signTypedData.js";

// Discovery
export const SupportedWalletApiRequest =
	_supportedWalletApi.SupportedWalletApiRequest;
export const SupportedSpecsRequest = _supportedSpecs.SupportedSpecsRequest;

// Permissions & Connection
export const GetPermissionsRequest = _getPermissions.GetPermissionsRequest;
export const RequestAccountsRequest = _requestAccounts.RequestAccountsRequest;
export const RequestChainIdRequest = _requestChainId.RequestChainIdRequest;
export const DeploymentDataRequest = _deploymentData.DeploymentDataRequest;

// Chain Management
export const WatchAssetRequest = _watchAsset.WatchAssetRequest;
export const AddStarknetChainRequest = _addStarknetChain.AddStarknetChainRequest;
export const SwitchStarknetChainRequest =
	_switchStarknetChain.SwitchStarknetChainRequest;

// Write Operations
export const AddInvokeTransactionRequest =
	_addInvokeTransaction.AddInvokeTransactionRequest;
export const AddDeclareTransactionRequest =
	_addDeclareTransaction.AddDeclareTransactionRequest;
export const SignTypedDataRequest = _signTypedData.SignTypedDataRequest;
