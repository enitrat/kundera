import type { StarknetWindowObject } from "@kundera-sn/kundera-ts/provider";
import type { HttpTransportOptions } from "@kundera-sn/kundera-ts/transport";
import { Layer } from "effect";

export {
	type RequestOptions,
	type ErrorInterceptor,
	type RequestInterceptor,
	type ResponseInterceptor,
	type TransportErrorContext,
	type TransportRequestContext,
	type TransportResponseContext,
	HttpTransportLive,
	TransportLive,
	TransportService,
	WebSocketTransportLive,
	withErrorInterceptor,
	withInterceptors,
	withRequestInterceptor,
	withRetries,
	withRetryDelay,
	withRetrySchedule,
	withResponseInterceptor,
	withTimeout,
	withTracing,
	type TransportServiceShape,
} from "./TransportService.js";

export {
	FallbackHttpProviderFromUrls,
	FallbackHttpProviderLive,
	type FallbackProviderEndpoint,
	HttpProviderLive,
	ProviderLive,
	ProviderService,
	WebSocketProviderLive,
	type ProviderServiceShape,
} from "./ProviderService.js";

export {
	AccountLive,
	AccountService,
	type AccountEstimateFeeOptions,
	type AccountLiveOptions,
	type AccountRequestOptions,
	type AccountServiceShape,
	type SignTransaction,
} from "./AccountService.js";

export {
	BatchLive,
	BatchService,
	type BatchCallRequest,
	type BatchQueueConfig,
	type BatchRequest,
	type BatchServiceShape,
} from "./BatchService.js";

export {
	WalletProviderLive,
	WalletProviderService,
	type RequestAccountsOptions,
	type WalletProviderServiceShape,
} from "./WalletProviderService.js";

export {
	Contract,
	ContractLive,
	ContractService,
	readContract,
	simulateContract,
	type ContractCallParams,
	type ContractInstance,
	type ContractReadOptions,
	type ContractServiceShape,
	type ReadContractParams,
	type SimulateContractParams,
	type SimulateContractResult,
} from "./ContractService.js";
export {
	ContractWriteLive,
	ContractWriteService,
	type ContractInvokeAndWaitOptions,
	type ContractInvokeOptions,
	type ContractWriteParams,
	type ContractWriteServiceShape,
	type EstimateContractWriteFeeOptions,
} from "./ContractWriteService.js";
export {
	ChainLive,
	ChainService,
	type ChainLiveOptions,
	type ChainServiceShape,
	type StarknetNetworkName,
} from "./ChainService.js";
export {
	FeeEstimatorLive,
	FeeEstimatorService,
	type EstimatableTransaction,
	type FeeEstimateOptions,
	type FeeEstimatorServiceShape,
} from "./FeeEstimatorService.js";
export {
	makeContractRegistry,
	type ContractDefinition,
	type ContractRegistry,
	type ContractRegistryConfig,
	type InferContractRegistry,
} from "./ContractRegistry.js";

export {
	BlockStreamLive,
	BlockStreamService,
	type BackfillBlocksOptions,
	type BlockStreamEvent,
	type BlockStreamInclude,
	type BlockStreamMetadata,
	type BlockStreamServiceShape,
	type BlockStreamWebSocketOptions,
	type BlocksEvent,
	type LightBlock,
	type ReorgEvent,
	type StreamBlock,
	type WatchBlocksOptions,
} from "./BlockStreamService.js";

export {
	EventLive,
	EventService,
	type DecodeEventParams,
	type EventReadOptions,
	type EventServiceShape,
	type WatchDecodedEventsOptions,
	type WatchEventsOptions,
} from "./EventService.js";

export {
	DefaultNonceManagerLive,
	NonceManagerService,
	type NonceManagerServiceShape,
	type NonceRequestOptions,
} from "./NonceManagerService.js";

export {
	TransactionStreamLive,
	TransactionStreamService,
	type ConfirmedTransactionEvent,
	type DroppedTransactionEvent,
	type PendingTransactionEvent,
	type TrackTransactionOptions,
	type TrackedConfirmedTransactionEvent,
	type TrackedPendingTransactionEvent,
	type TransactionTrackEvent,
	type TransactionStreamFilter,
	type TransactionStreamServiceShape,
	type TransactionStreamWebSocketOptions,
	type WatchConfirmedTransactionsOptions,
	type WatchPendingTransactionsOptions,
} from "./TransactionStreamService.js";

export {
	TransactionLive,
	TransactionService,
	type SendInvokeAndWaitOptions,
	type TransactionServiceShape,
	type WaitForReceiptOptions,
} from "./TransactionService.js";

import { BatchLive } from "./BatchService.js";
import { BlockStreamLive } from "./BlockStreamService.js";
import { ChainLive } from "./ChainService.js";
import { ContractLive } from "./ContractService.js";
import { ContractWriteLive } from "./ContractWriteService.js";
import { EventLive } from "./EventService.js";
import { FeeEstimatorLive } from "./FeeEstimatorService.js";
import { DefaultNonceManagerLive } from "./NonceManagerService.js";
import { HttpProviderLive } from "./ProviderService.js";
import { TransactionLive } from "./TransactionService.js";
import { TransactionStreamLive } from "./TransactionStreamService.js";
import { WalletProviderLive } from "./WalletProviderService.js";

export interface WalletTransactionStackOptions {
	readonly rpcUrl: string;
	readonly swo: StarknetWindowObject;
	readonly rpcTransportOptions?: HttpTransportOptions;
}

export const WalletBaseStack = (
	options: WalletTransactionStackOptions,
): Layer.Layer<
	| import("./ProviderService.js").ProviderService
	| import("./WalletProviderService.js").WalletProviderService
	| import("./ContractService.js").ContractService
	| import("./NonceManagerService.js").NonceManagerService
	| import("./FeeEstimatorService.js").FeeEstimatorService
	| import("./ChainService.js").ChainService
	| import("./BlockStreamService.js").BlockStreamService
	| import("./TransactionStreamService.js").TransactionStreamService
	| import("./EventService.js").EventService
	| import("./BatchService.js").BatchService
> => {
	const providerLayer = HttpProviderLive(
		options.rpcUrl,
		options.rpcTransportOptions,
	);
	const walletLayer = WalletProviderLive(options.swo);
	const baseDependencies = Layer.merge(providerLayer, walletLayer);

	const contractLayer = ContractLive.pipe(Layer.provide(baseDependencies));
	const nonceLayer = DefaultNonceManagerLive.pipe(
		Layer.provide(baseDependencies),
	);
	const feeLayer = FeeEstimatorLive.pipe(Layer.provide(baseDependencies));
	const chainLayer = ChainLive({ rpcUrl: options.rpcUrl }).pipe(
		Layer.provide(baseDependencies),
	);
	const blockStreamLayer = BlockStreamLive.pipe(Layer.provide(providerLayer));
	const transactionStreamLayer = TransactionStreamLive.pipe(
		Layer.provide(providerLayer),
	);
	const eventLayer = EventLive.pipe(Layer.provide(providerLayer));
	const batchLayer = BatchLive().pipe(Layer.provide(providerLayer));

	return Layer.mergeAll(
		baseDependencies,
		contractLayer,
		nonceLayer,
		feeLayer,
		chainLayer,
		blockStreamLayer,
		transactionStreamLayer,
		eventLayer,
		batchLayer,
	);
};

export const WalletTransactionStack = (
	options: WalletTransactionStackOptions,
): Layer.Layer<
	| import("./ContractWriteService.js").ContractWriteService
	| import("./TransactionService.js").TransactionService
	| import("./ProviderService.js").ProviderService
	| import("./WalletProviderService.js").WalletProviderService
	| import("./ContractService.js").ContractService
	| import("./NonceManagerService.js").NonceManagerService
	| import("./FeeEstimatorService.js").FeeEstimatorService
	| import("./ChainService.js").ChainService
	| import("./BlockStreamService.js").BlockStreamService
	| import("./TransactionStreamService.js").TransactionStreamService
	| import("./EventService.js").EventService
	| import("./BatchService.js").BatchService
> => {
	const base = WalletBaseStack(options);
	const txLayer = TransactionLive.pipe(Layer.provide(base));
	const contractWriteLayer = ContractWriteLive.pipe(
		Layer.provide(Layer.merge(base, txLayer)),
	);

	return Layer.mergeAll(base, txLayer, contractWriteLayer);
};
