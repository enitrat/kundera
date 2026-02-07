/**
 * Provider - Starknet JSON-RPC Provider
 *
 * Typed provider implementations for Starknet JSON-RPC communication.
 * Supports HTTP and WebSocket transports with optional subscriptions.
 *
 * @module provider
 */

export type { Provider } from "./Provider.js";
export type { TypedProvider, StarknetProvider } from "./TypedProvider.js";

export type {
	ProviderEvent,
	ProviderEventMap,
	ProviderEvents,
	ProviderConnectInfo,
	ProviderMessage,
	RequestArguments,
	RequestOptions,
	RpcError,
	Response,
} from "./types.js";

export type {
	RpcSchema,
	RpcMethodNames,
	RpcMethodParameters,
	RpcMethodReturnType,
} from "./RpcSchema.js";

export type { RequestFn } from "./request/RequestFn.js";
export type { RequestOptions as ProviderRequestOptions } from "./request/RequestOptions.js";
export type { RequestArguments as ProviderRequestArguments } from "./request/RequestArguments.js";

export type { StarknetRpcSchema } from "./schemas/index.js";
export type {
	WalletRpcSchema,
	WalletCall,
	WalletInvokeParams,
	WalletDeclareParams,
	WalletTypedData,
	WalletDeploymentData,
	WalletWatchAssetParams,
	WalletAddChainParams,
	WalletSwitchChainParams,
} from "./schemas/index.js";

export type {
	StarknetWindowObject,
	WalletIcon,
	WalletEvent,
	WalletEventMap,
	WalletRequestArguments,
} from "./wallet/types.js";

export type { HttpProviderOptions } from "./HttpProvider.js";
export { HttpProvider } from "./HttpProvider.js";

export type { WebSocketProviderOptions } from "./WebSocketProvider.js";
export { WebSocketProvider } from "./WebSocketProvider.js";

export type {
	WalletProviderOptions,
	WalletProviderEventMap,
} from "./WalletProvider.js";
export { WalletProvider } from "./WalletProvider.js";
