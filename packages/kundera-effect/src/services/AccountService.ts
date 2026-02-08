import { Context, Effect, Layer } from "effect";
import {
  ContractAddress,
  Felt252,
  type ContractAddressType,
  type Felt252Input,
  type Felt252Type,
} from "@kundera-sn/kundera-ts";
import {
  Rpc,
  type AddDeclareTransactionResult,
  type AddDeployAccountTransactionResult,
  type AddInvokeTransactionResult,
  type BlockId,
  type BroadcastedDeclareTxn,
  type BroadcastedDeployAccountTxn,
  type BroadcastedInvokeTxn,
  type FeeEstimate,
  type SimulationFlag,
} from "@kundera-sn/kundera-ts/jsonrpc";
import {
  DEFAULT_RESOURCE_BOUNDS,
  computeContractAddress,
  computeDeclareV3Hash,
  computeDeployAccountV3Hash,
  computeInvokeV3Hash,
  computeSelector,
  signRaw,
  type Call,
  type DataAvailabilityMode,
  type DeclarePayload,
  type DeclareTransactionV3,
  type DeployAccountPayload,
  type DeployAccountTransactionV3,
  type InvokeTransactionV3,
  type ResourceBoundsMapping,
  type UniversalDetails,
} from "@kundera-sn/kundera-ts/crypto";

import {
  type NonceError,
  type RpcError,
  TransactionError,
  type TransportError,
} from "../errors.js";
import { NonceManagerService } from "./NonceManagerService.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export type SignTransaction = (
  txHash: Felt252Type,
) => Effect.Effect<readonly Felt252Input[], unknown>;

export interface AccountLiveOptions {
  readonly accountAddress: ContractAddressType | string;
  readonly privateKey?: Felt252Input;
  readonly signTransaction?: SignTransaction;
}

export interface AccountRequestOptions extends UniversalDetails {
  readonly chainId?: Felt252Input;
  readonly requestOptions?: RequestOptions;
}

export interface AccountEstimateFeeOptions extends AccountRequestOptions {
  readonly blockId?: BlockId;
  readonly simulationFlags?: readonly SimulationFlag[];
}

export interface AccountServiceShape {
  readonly address: () => ContractAddressType;

  readonly signTransactionHash: (
    txHash: Felt252Input,
  ) => Effect.Effect<string[], TransactionError>;

  readonly execute: (
    calls: Call | readonly Call[],
    options?: AccountRequestOptions,
  ) => Effect.Effect<
    AddInvokeTransactionResult,
    NonceError | TransportError | RpcError | TransactionError
  >;

  readonly estimateExecuteFee: (
    calls: Call | readonly Call[],
    options?: AccountEstimateFeeOptions,
  ) => Effect.Effect<
    FeeEstimate,
    NonceError | TransportError | RpcError | TransactionError
  >;

  readonly declare: (
    payload: DeclarePayload,
    options?: AccountRequestOptions,
  ) => Effect.Effect<
    AddDeclareTransactionResult,
    NonceError | TransportError | RpcError | TransactionError
  >;

  readonly estimateDeclareFee: (
    payload: DeclarePayload,
    options?: AccountEstimateFeeOptions,
  ) => Effect.Effect<
    FeeEstimate,
    NonceError | TransportError | RpcError | TransactionError
  >;

  readonly deployAccount: (
    payload: DeployAccountPayload,
    options?: AccountRequestOptions,
  ) => Effect.Effect<
    AddDeployAccountTransactionResult,
    TransportError | RpcError | TransactionError
  >;

  readonly estimateDeployAccountFee: (
    payload: DeployAccountPayload,
    options?: AccountEstimateFeeOptions,
  ) => Effect.Effect<
    FeeEstimate,
    TransportError | RpcError | TransactionError
  >;
}

export class AccountService extends Context.Tag("@kundera/AccountService")<
  AccountService,
  AccountServiceShape
>() {}

const normalizeCalls = (calls: Call | readonly Call[]): Call[] => {
  const callList = Array.isArray(calls) ? calls : [calls];
  return [...callList];
};

const mergeResourceBounds = (
  partial?: Partial<ResourceBoundsMapping>,
): ResourceBoundsMapping => {
  if (!partial) {
    return DEFAULT_RESOURCE_BOUNDS;
  }

  return {
    l1_gas: { ...DEFAULT_RESOURCE_BOUNDS.l1_gas, ...partial.l1_gas },
    l2_gas: { ...DEFAULT_RESOURCE_BOUNDS.l2_gas, ...partial.l2_gas },
    l1_data_gas: {
      ...DEFAULT_RESOURCE_BOUNDS.l1_data_gas,
      ...partial.l1_data_gas,
    },
  };
};

type RpcDAMode = "L1" | "L2";
const V3_VERSION_HEX = "0x3" as const;

const toRpcDAMode = (mode: DataAvailabilityMode): RpcDAMode =>
  mode === 0 ? "L1" : "L2";

interface RpcResourceBounds {
  max_amount: string;
  max_price_per_unit: string;
}

interface RpcResourceBoundsMapping {
  l1_gas: RpcResourceBounds;
  l2_gas: RpcResourceBounds;
}

const formatResourceBoundsForRpc = (
  bounds: ResourceBoundsMapping,
): RpcResourceBoundsMapping => ({
  l1_gas: {
    max_amount: Felt252(bounds.l1_gas.max_amount).toHex(),
    max_price_per_unit: Felt252(bounds.l1_gas.max_price_per_unit).toHex(),
  },
  l2_gas: {
    max_amount: Felt252(bounds.l2_gas.max_amount).toHex(),
    max_price_per_unit: Felt252(bounds.l2_gas.max_price_per_unit).toHex(),
  },
});

const formatInvokeForRpc = (tx: InvokeTransactionV3) => ({
  version: V3_VERSION_HEX,
  sender_address: tx.sender_address,
  calldata: tx.calldata.map((value) => Felt252(value).toHex()),
  nonce: Felt252(tx.nonce).toHex(),
  resource_bounds: formatResourceBoundsForRpc(tx.resource_bounds),
  tip: Felt252(tx.tip).toHex(),
  paymaster_data: tx.paymaster_data.map((value) => Felt252(value).toHex()),
  nonce_data_availability_mode: toRpcDAMode(tx.nonce_data_availability_mode),
  fee_data_availability_mode: toRpcDAMode(tx.fee_data_availability_mode),
  account_deployment_data: tx.account_deployment_data.map((value) =>
    Felt252(value).toHex(),
  ),
});

const formatDeclareForRpc = (tx: DeclareTransactionV3): {
  version: "0x3";
  sender_address: string;
  compiled_class_hash: string;
  nonce: string;
  resource_bounds: RpcResourceBoundsMapping;
  tip: string;
  paymaster_data: string[];
  nonce_data_availability_mode: RpcDAMode;
  fee_data_availability_mode: RpcDAMode;
  account_deployment_data: string[];
} => ({
  version: V3_VERSION_HEX,
  sender_address: tx.sender_address,
  compiled_class_hash: tx.compiled_class_hash,
  nonce: Felt252(tx.nonce).toHex(),
  resource_bounds: formatResourceBoundsForRpc(tx.resource_bounds),
  tip: Felt252(tx.tip).toHex(),
  paymaster_data: tx.paymaster_data.map((value) => Felt252(value).toHex()),
  nonce_data_availability_mode: toRpcDAMode(tx.nonce_data_availability_mode),
  fee_data_availability_mode: toRpcDAMode(tx.fee_data_availability_mode),
  account_deployment_data: tx.account_deployment_data.map((value) =>
    Felt252(value).toHex(),
  ),
});

const formatDeployAccountForRpc = (
  tx: DeployAccountTransactionV3,
): {
  version: "0x3";
  class_hash: string;
  constructor_calldata: string[];
  contract_address_salt: string;
  nonce: string;
  resource_bounds: RpcResourceBoundsMapping;
  tip: string;
  paymaster_data: string[];
  nonce_data_availability_mode: RpcDAMode;
  fee_data_availability_mode: RpcDAMode;
} => ({
  version: V3_VERSION_HEX,
  class_hash: tx.class_hash,
  constructor_calldata: tx.constructor_calldata.map((value) => Felt252(value).toHex()),
  contract_address_salt: tx.contract_address_salt,
  nonce: Felt252(tx.nonce).toHex(),
  resource_bounds: formatResourceBoundsForRpc(tx.resource_bounds),
  tip: Felt252(tx.tip).toHex(),
  paymaster_data: tx.paymaster_data.map((value) => Felt252(value).toHex()),
  nonce_data_availability_mode: toRpcDAMode(tx.nonce_data_availability_mode),
  fee_data_availability_mode: toRpcDAMode(tx.fee_data_availability_mode),
});

const encodeExecuteCalldata = (calls: readonly Call[]): bigint[] => {
  const callArray: bigint[] = [];
  const calldataFlat: bigint[] = [];

  let offset = 0;
  for (const call of calls) {
    const selector = computeSelector(call.entrypoint);
    const callCalldata = call.calldata.map((value) => Felt252(value).toBigInt());

    callArray.push(
      Felt252(call.contractAddress).toBigInt(),
      selector.toBigInt(),
      BigInt(offset),
      BigInt(callCalldata.length),
    );

    calldataFlat.push(...callCalldata);
    offset += callCalldata.length;
  }

  return [
    BigInt(calls.length),
    ...callArray,
    BigInt(calldataFlat.length),
    ...calldataFlat,
  ];
};

const getFirstEstimate = (
  estimates: readonly FeeEstimate[],
  operation: string,
): Effect.Effect<FeeEstimate, TransactionError> =>
  Effect.fromNullable(estimates[0]).pipe(
    Effect.mapError(
      () =>
        new TransactionError({
          operation,
          message: "Fee estimate missing from provider response",
        }),
    ),
  );

const generateSalt = (): Effect.Effect<string, TransactionError> =>
  Effect.try({
    try: () => {
      const bytes = new Uint8Array(32);
      const cryptoApi = globalThis.crypto;

      if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
        cryptoApi.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i += 1) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }

      return Felt252(bytes).toHex();
    },
    catch: (cause) =>
      new TransactionError({
        operation: "deployAccount",
        message: "Failed to generate account deployment salt",
        cause,
      }),
  });

const makeDefaultSigner = (privateKey: Felt252Input): SignTransaction => (txHash) =>
  Effect.try({
    try: () => {
      const signature = signRaw(privateKey, txHash);
      return [signature.r, signature.s];
    },
    catch: (cause) =>
      new TransactionError({
        operation: "signTransactionHash",
        message: "Failed to sign transaction hash",
        cause,
      }),
  });

export const AccountLive = (
  options: AccountLiveOptions,
): Layer.Layer<AccountService, TransactionError, ProviderService | NonceManagerService> =>
  Layer.effect(
    AccountService,
    Effect.gen(function* () {
      const provider = yield* ProviderService;
      const nonceManager = yield* NonceManagerService;

      const accountAddress = yield* Effect.try({
        try: () =>
          typeof options.accountAddress === "string"
            ? ContractAddress.from(options.accountAddress)
            : options.accountAddress,
        catch: (cause) =>
          new TransactionError({
            operation: "AccountLive",
            message: `Invalid account address: ${String(options.accountAddress)}`,
            cause,
          }),
      });

      const signer = options.signTransaction ?? (
        options.privateKey ? makeDefaultSigner(options.privateKey) : undefined
      );

      if (!signer) {
        return yield* Effect.fail(
          new TransactionError({
            operation: "AccountLive",
            message:
              "AccountLive requires either privateKey or signTransaction to be provided",
          }),
        );
      }

      const resolveChainId = (
        chainId: Felt252Input | undefined,
        requestOptions: RequestOptions | undefined,
      ): Effect.Effect<string, TransportError | RpcError> => {
        if (chainId !== undefined) {
          return Effect.succeed(Felt252(chainId).toHex());
        }

        const { method, params } = Rpc.ChainIdRequest();
        return provider.request<string>(method, params, requestOptions);
      };

      const signTransactionHash: AccountServiceShape["signTransactionHash"] = (
        txHashInput,
      ) =>
        Effect.gen(function* () {
          const txHash = Felt252(txHashInput);
          const signed = yield* signer(txHash).pipe(
            Effect.catchAll(
              (cause) =>
                Effect.fail(
                  new TransactionError({
                    operation: "signTransactionHash",
                    message: "Custom signer failed",
                    cause,
                  }),
                ),
            ),
          );

          return yield* Effect.forEach(signed, (item) =>
            Effect.try({
              try: () => Felt252(item).toHex(),
              catch: (cause) =>
                new TransactionError({
                  operation: "signTransactionHash",
                  message: "Signer returned an invalid felt value",
                  cause,
                }),
            }),
          ).pipe(Effect.map((values) => [...values]));
        });

      const execute: AccountServiceShape["execute"] = (calls, options) =>
        Effect.gen(function* () {
          const normalizedCalls = normalizeCalls(calls);
          const chainId = yield* resolveChainId(options?.chainId, options?.requestOptions);
          const nonce = options?.nonce ?? (yield* nonceManager.consume(accountAddress, {
            chainId: Felt252(chainId),
            requestOptions: options?.requestOptions,
          }));

          const tx: InvokeTransactionV3 = {
            version: 3,
            sender_address: accountAddress.toHex(),
            calldata: encodeExecuteCalldata(normalizedCalls),
            nonce,
            resource_bounds: mergeResourceBounds(options?.resourceBounds),
            tip: options?.tip ?? 0n,
            paymaster_data: options?.paymasterData ?? [],
            nonce_data_availability_mode: 0,
            fee_data_availability_mode: 0,
            account_deployment_data: [],
          };

          const txHash = computeInvokeV3Hash(tx, chainId);
          const signature = yield* signTransactionHash(txHash);

          const invoke: BroadcastedInvokeTxn = {
            type: "INVOKE",
            ...formatInvokeForRpc(tx),
            signature: [...signature],
          };

          const { method, params } = Rpc.AddInvokeTransactionRequest(invoke);
          return yield* provider.request<AddInvokeTransactionResult>(
            method,
            params,
            options?.requestOptions,
          );
        });

      const estimateExecuteFee: AccountServiceShape["estimateExecuteFee"] = (
        calls,
        options,
      ) =>
        Effect.gen(function* () {
          const normalizedCalls = normalizeCalls(calls);
          const chainId = yield* resolveChainId(options?.chainId, options?.requestOptions);
          // Estimation must be read-only with respect to local nonce state.
          // Using `get` avoids reserving/incrementing a nonce that will never be sent.
          const nonce = options?.nonce ?? (yield* nonceManager.get(accountAddress, {
            chainId: Felt252(chainId),
            requestOptions: options?.requestOptions,
          }));

          const tx: InvokeTransactionV3 = {
            version: 3,
            sender_address: accountAddress.toHex(),
            calldata: encodeExecuteCalldata(normalizedCalls),
            nonce,
            resource_bounds: mergeResourceBounds(options?.resourceBounds),
            tip: options?.tip ?? 0n,
            paymaster_data: options?.paymasterData ?? [],
            nonce_data_availability_mode: 0,
            fee_data_availability_mode: 0,
            account_deployment_data: [],
          };

          const txForFee: BroadcastedInvokeTxn = {
            type: "INVOKE",
            ...formatInvokeForRpc(tx),
            signature: [],
          };

          const simulationFlags =
            options?.simulationFlags ??
            (options?.skipValidate ? (["SKIP_VALIDATE"] as const) : []);
          const { method, params } = Rpc.EstimateFeeRequest(
            [txForFee],
            [...simulationFlags],
            options?.blockId ?? "pending",
          );

          const estimates = yield* provider.request<FeeEstimate[]>(
            method,
            params,
            options?.requestOptions,
          );

          return yield* getFirstEstimate(estimates, "estimateExecuteFee");
        });

      const declare: AccountServiceShape["declare"] = (payload, options) =>
        Effect.gen(function* () {
          const chainId = yield* resolveChainId(options?.chainId, options?.requestOptions);
          const nonce = options?.nonce ?? (yield* nonceManager.consume(accountAddress, {
            chainId: Felt252(chainId),
            requestOptions: options?.requestOptions,
          }));

          const tx: DeclareTransactionV3 = {
            version: 3,
            sender_address: accountAddress.toHex(),
            class_hash: payload.classHash,
            compiled_class_hash: payload.compiledClassHash,
            nonce,
            resource_bounds: mergeResourceBounds(options?.resourceBounds),
            tip: options?.tip ?? 0n,
            paymaster_data: options?.paymasterData ?? [],
            nonce_data_availability_mode: 0,
            fee_data_availability_mode: 0,
            account_deployment_data: [],
          };

          const txHash = computeDeclareV3Hash(tx, chainId);
          const signature = yield* signTransactionHash(txHash);

          const declareTx: BroadcastedDeclareTxn = {
            type: "DECLARE",
            ...formatDeclareForRpc(tx),
            // Trust boundary: caller provides a contract class compatible with
            // the Starknet JSON-RPC declare schema.
            contract_class: payload.contract as BroadcastedDeclareTxn["contract_class"],
            signature: [...signature],
          };

          const { method, params } = Rpc.AddDeclareTransactionRequest(declareTx);
          return yield* provider.request<AddDeclareTransactionResult>(
            method,
            params,
            options?.requestOptions,
          );
        });

      const estimateDeclareFee: AccountServiceShape["estimateDeclareFee"] = (
        payload,
        options,
      ) =>
        Effect.gen(function* () {
          const chainId = yield* resolveChainId(options?.chainId, options?.requestOptions);
          const nonce = options?.nonce ?? (yield* nonceManager.get(accountAddress, {
            chainId: Felt252(chainId),
            requestOptions: options?.requestOptions,
          }));

          const tx: DeclareTransactionV3 = {
            version: 3,
            sender_address: accountAddress.toHex(),
            class_hash: payload.classHash,
            compiled_class_hash: payload.compiledClassHash,
            nonce,
            resource_bounds: mergeResourceBounds(options?.resourceBounds),
            tip: options?.tip ?? 0n,
            paymaster_data: options?.paymasterData ?? [],
            nonce_data_availability_mode: 0,
            fee_data_availability_mode: 0,
            account_deployment_data: [],
          };

          const txForFee: BroadcastedDeclareTxn = {
            type: "DECLARE",
            ...formatDeclareForRpc(tx),
            // Trust boundary: caller provides a contract class compatible with
            // the Starknet JSON-RPC declare schema.
            contract_class: payload.contract as BroadcastedDeclareTxn["contract_class"],
            signature: [],
          };

          const simulationFlags =
            options?.simulationFlags ??
            (options?.skipValidate ? (["SKIP_VALIDATE"] as const) : []);
          const { method, params } = Rpc.EstimateFeeRequest(
            [txForFee],
            [...simulationFlags],
            options?.blockId ?? "pending",
          );

          const estimates = yield* provider.request<FeeEstimate[]>(
            method,
            params,
            options?.requestOptions,
          );

          return yield* getFirstEstimate(estimates, "estimateDeclareFee");
        });

      const deployAccount: AccountServiceShape["deployAccount"] = (payload, options) =>
        Effect.gen(function* () {
          const chainId = yield* resolveChainId(options?.chainId, options?.requestOptions);
          const nonce = options?.nonce ?? 0n;
          const constructorCalldata = (payload.constructorCalldata ?? []).map((value) =>
            Felt252(value).toBigInt(),
          );
          const addressSalt = payload.addressSalt ?? (yield* generateSalt());

          const tx: DeployAccountTransactionV3 = {
            version: 3,
            class_hash: payload.classHash,
            constructor_calldata: constructorCalldata,
            contract_address_salt: addressSalt,
            nonce,
            resource_bounds: mergeResourceBounds(options?.resourceBounds),
            tip: options?.tip ?? 0n,
            paymaster_data: options?.paymasterData ?? [],
            nonce_data_availability_mode: 0,
            fee_data_availability_mode: 0,
          };

          const contractAddress = computeContractAddress(
            tx.class_hash,
            tx.contract_address_salt,
            tx.constructor_calldata,
          );
          const txHash = computeDeployAccountV3Hash(tx, contractAddress, chainId);
          const signature = yield* signTransactionHash(txHash);

          const deployTx: BroadcastedDeployAccountTxn = {
            type: "DEPLOY_ACCOUNT",
            ...formatDeployAccountForRpc(tx),
            signature: [...signature],
          };

          const { method, params } = Rpc.AddDeployAccountTransactionRequest(deployTx);
          return yield* provider.request<AddDeployAccountTransactionResult>(
            method,
            params,
            options?.requestOptions,
          );
        });

      const estimateDeployAccountFee: AccountServiceShape["estimateDeployAccountFee"] = (
        payload,
        options,
      ) =>
        Effect.gen(function* () {
          const constructorCalldata = (payload.constructorCalldata ?? []).map((value) =>
            Felt252(value).toBigInt(),
          );
          const addressSalt = payload.addressSalt ?? (yield* generateSalt());

          const tx: DeployAccountTransactionV3 = {
            version: 3,
            class_hash: payload.classHash,
            constructor_calldata: constructorCalldata,
            contract_address_salt: addressSalt,
            nonce: options?.nonce ?? 0n,
            resource_bounds: mergeResourceBounds(options?.resourceBounds),
            tip: options?.tip ?? 0n,
            paymaster_data: options?.paymasterData ?? [],
            nonce_data_availability_mode: 0,
            fee_data_availability_mode: 0,
          };

          const txForFee: BroadcastedDeployAccountTxn = {
            type: "DEPLOY_ACCOUNT",
            ...formatDeployAccountForRpc(tx),
            signature: [],
          };

          const simulationFlags =
            options?.simulationFlags ??
            (options?.skipValidate ? (["SKIP_VALIDATE"] as const) : []);
          const { method, params } = Rpc.EstimateFeeRequest(
            [txForFee],
            [...simulationFlags],
            options?.blockId ?? "pending",
          );

          const estimates = yield* provider.request<FeeEstimate[]>(
            method,
            params,
            options?.requestOptions,
          );

          return yield* getFirstEstimate(estimates, "estimateDeployAccountFee");
        });

      return {
        address: () => accountAddress,
        signTransactionHash,
        execute,
        estimateExecuteFee,
        declare,
        estimateDeclareFee,
        deployAccount,
        estimateDeployAccountFee,
      } satisfies AccountServiceShape;
    }),
  );
