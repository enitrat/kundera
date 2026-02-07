import { Layer } from "effect";
import type { StarknetWindowObject } from "@kundera-sn/kundera-ts/provider";
import type { HttpTransportOptions } from "@kundera-sn/kundera-ts/transport";

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
  WalletProviderLive,
  WalletProviderService,
  type RequestAccountsOptions,
  type WalletProviderServiceShape,
} from "./WalletProviderService.js";

export {
  RawProviderLive,
  RawProviderService,
  type RawProviderServiceShape,
  type RawRequestArguments,
} from "./RawProviderService.js";

export {
  Contract,
  ContractLive,
  ContractService,
  type ContractCallParams,
  type ContractInstance,
  type ContractReadOptions,
  type ContractServiceShape,
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
  DefaultNonceManagerLive,
  NonceManagerService,
  type NonceManagerServiceShape,
  type NonceRequestOptions,
} from "./NonceManagerService.js";

export {
  TransactionLive,
  TransactionService,
  type SendInvokeAndWaitOptions,
  type TransactionServiceShape,
  type WaitForReceiptOptions,
} from "./TransactionService.js";

export {
  SignerLive,
  SignerService,
  type SignerServiceShape,
} from "./SignerService.js";

import { ContractLive } from "./ContractService.js";
import { ContractWriteLive } from "./ContractWriteService.js";
import { DefaultNonceManagerLive } from "./NonceManagerService.js";
import { ChainLive } from "./ChainService.js";
import { FeeEstimatorLive } from "./FeeEstimatorService.js";
import { HttpProviderLive } from "./ProviderService.js";
import { RawProviderLive } from "./RawProviderService.js";
import { SignerLive } from "./SignerService.js";
import { TransactionLive } from "./TransactionService.js";
import { WalletProviderLive } from "./WalletProviderService.js";

export interface WalletTransactionStackOptions {
  readonly rpcUrl: string;
  readonly swo: StarknetWindowObject;
  readonly rpcTransportOptions?: HttpTransportOptions;
}

export const WalletBaseStack = (
  options: WalletTransactionStackOptions,
): Layer.Layer<
  import("./ProviderService.js").ProviderService |
    import("./WalletProviderService.js").WalletProviderService |
    import("./ContractService.js").ContractService |
    import("./RawProviderService.js").RawProviderService |
    import("./NonceManagerService.js").NonceManagerService |
    import("./FeeEstimatorService.js").FeeEstimatorService |
    import("./ChainService.js").ChainService
> => {
  const providerLayer = HttpProviderLive(options.rpcUrl, options.rpcTransportOptions);
  const walletLayer = WalletProviderLive(options.swo);
  const baseDependencies = Layer.merge(providerLayer, walletLayer);

  const contractLayer = ContractLive.pipe(Layer.provide(baseDependencies));
  const rawLayer = RawProviderLive.pipe(Layer.provide(baseDependencies));
  const nonceLayer = DefaultNonceManagerLive.pipe(Layer.provide(baseDependencies));
  const feeLayer = FeeEstimatorLive.pipe(Layer.provide(baseDependencies));
  const chainLayer = ChainLive({ rpcUrl: options.rpcUrl }).pipe(
    Layer.provide(baseDependencies),
  );

  return Layer.mergeAll(
    baseDependencies,
    contractLayer,
    rawLayer,
    nonceLayer,
    feeLayer,
    chainLayer,
  );
};

export const WalletTransactionStack = (
  options: WalletTransactionStackOptions,
): Layer.Layer<
  import("./ContractWriteService.js").ContractWriteService |
  import("./SignerService.js").SignerService |
  import("./TransactionService.js").TransactionService |
  import("./ProviderService.js").ProviderService |
  import("./WalletProviderService.js").WalletProviderService |
  import("./ContractService.js").ContractService |
  import("./RawProviderService.js").RawProviderService |
  import("./NonceManagerService.js").NonceManagerService |
  import("./FeeEstimatorService.js").FeeEstimatorService |
  import("./ChainService.js").ChainService
> => {
  const base = WalletBaseStack(options);
  const txLayer = TransactionLive.pipe(Layer.provide(base));
  const contractWriteLayer = ContractWriteLive.pipe(
    Layer.provide(Layer.merge(base, txLayer)),
  );
  const signerLayer = SignerLive.pipe(Layer.provide(Layer.merge(base, txLayer)));

  return Layer.mergeAll(base, txLayer, contractWriteLayer, signerLayer);
};
