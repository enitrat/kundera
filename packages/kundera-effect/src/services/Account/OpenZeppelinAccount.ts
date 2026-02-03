import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
  computeInvokeV3Hash,
  computeSelector,
  type InvokeTransactionV3,
  type ResourceBoundsMapping
} from "@kundera-sn/kundera-ts/crypto";
import { getPublicKey } from "@kundera-sn/kundera-ts/crypto";
import { signRaw } from "@kundera-sn/kundera-ts/crypto";
import { Felt252, type Felt252Type } from "@kundera-sn/kundera-ts/Felt252";
import type { BroadcastedInvokeTxn } from "@kundera-sn/kundera-ts/jsonrpc";
import { AccountService, AccountError, type InvokeV3Params, type ResourceBoundsInput } from "./AccountService.js";

export type OpenZeppelinAccountConfig = {
  address: string;
  privateKey: string;
};

const toHex = (value: bigint | string) =>
  typeof value === "string" ? value : `0x${value.toString(16)}`;

const feltToHex = (value: bigint | Felt252Type) =>
  typeof value === "bigint" ? toHex(value) : value.toHex();

const toBigInt = (value: bigint | string) =>
  typeof value === "string" ? BigInt(value) : value;

const buildExecuteCalldata = (
  calls: InvokeV3Params["calls"]
): bigint[] => {
  const callArray: bigint[] = [];
  const calldata: bigint[] = [];

  for (const call of calls) {
    const dataOffset = BigInt(calldata.length);
    const dataLen = BigInt(call.calldata.length);
    const contractAddress = BigInt(call.contractAddress);
    const selector =
      call.entrypoint.startsWith("0x")
        ? BigInt(call.entrypoint)
        : computeSelector(call.entrypoint).toBigInt();

    callArray.push(contractAddress, selector, dataOffset, dataLen);
    calldata.push(...call.calldata.map((value) => BigInt(value)));
  }

  return [
    BigInt(calls.length),
    ...callArray,
    BigInt(calldata.length),
    ...calldata
  ];
};

const toRpcResourceBounds = (input: ResourceBoundsInput) => ({
  l1_gas: {
    max_amount: toHex(input.l1_gas.max_amount),
    max_price_per_unit: toHex(input.l1_gas.max_price_per_unit)
  },
  l2_gas: {
    max_amount: toHex(input.l2_gas.max_amount),
    max_price_per_unit: toHex(input.l2_gas.max_price_per_unit)
  }
});

const toAccountResourceBounds = (input: ResourceBoundsInput): ResourceBoundsMapping => ({
  l1_gas: {
    max_amount: input.l1_gas.max_amount,
    max_price_per_unit: input.l1_gas.max_price_per_unit
  },
  l2_gas: {
    max_amount: input.l2_gas.max_amount,
    max_price_per_unit: input.l2_gas.max_price_per_unit
  },
  l1_data_gas: {
    max_amount: input.l1_data_gas?.max_amount ?? 0n,
    max_price_per_unit: input.l1_data_gas?.max_price_per_unit ?? 0n
  }
});

const toRpcInvoke = (
  tx: InvokeTransactionV3,
  signature: { r: string; s: string }
): BroadcastedInvokeTxn => ({
  type: "INVOKE",
  version: "0x3",
  sender_address: toHex(tx.sender_address),
  calldata: tx.calldata.map((value) => toHex(value)),
  signature: [signature.r, signature.s],
  nonce: toHex(tx.nonce),
  resource_bounds: toRpcResourceBounds({
    l1_gas: tx.resource_bounds.l1_gas,
    l2_gas: tx.resource_bounds.l2_gas,
    l1_data_gas: tx.resource_bounds.l1_data_gas
  }),
  tip: toHex(tx.tip),
  paymaster_data: tx.paymaster_data.map((value) => toHex(value)),
  account_deployment_data: tx.account_deployment_data.map((value) => toHex(value)),
  nonce_data_availability_mode: "L1",
  fee_data_availability_mode: "L1"
});

export const OpenZeppelinAccount = (config: OpenZeppelinAccountConfig) =>
  Layer.succeed(AccountService, {
    address: config.address,
    publicKey: feltToHex(getPublicKey(Felt252(config.privateKey))),
    toRpcResourceBounds,
    signInvokeV3: (params) =>
      Effect.try({
        try: () => {
          const tx: InvokeTransactionV3 = {
            version: 3,
            sender_address: config.address,
            calldata: buildExecuteCalldata(params.calls),
            nonce: params.nonce,
            resource_bounds: toAccountResourceBounds(params.resourceBounds),
            tip: params.tip ?? 0n,
            paymaster_data: params.paymasterData ?? [],
            account_deployment_data: params.accountDeploymentData ?? [],
            nonce_data_availability_mode: params.nonceDataAvailabilityMode ?? 0,
            fee_data_availability_mode: params.feeDataAvailabilityMode ?? 0
          };

          const hash = computeInvokeV3Hash(tx, params.chainId);
          const signature = signRaw(config.privateKey, hash);

          return toRpcInvoke(tx, {
            r: feltToHex(signature.r),
            s: feltToHex(signature.s)
          });
        },
        catch: (error) =>
          new AccountError({
            input: params,
            message: error instanceof Error ? error.message : "Failed to sign invoke",
            cause: error
          })
      })
  });
