import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";
import { ContractAddress } from "@kundera-sn/kundera-ts";
import type { Abi } from "@kundera-sn/kundera-ts/abi";

import { ContractWriteLive, ContractWriteService } from "../ContractWriteService.js";
import { FeeEstimatorService } from "../FeeEstimatorService.js";
import { TransactionService } from "../TransactionService.js";

const WRITE_ABI: Abi = [
  {
    type: "function",
    name: "set_value",
    inputs: [{ name: "value", type: "core::felt252" }],
    outputs: [],
    state_mutability: "external",
  },
];

describe("ContractWriteService", () => {
  it("invokeContract compiles calldata and forwards wallet invoke", async () => {
    let sentInvoke:
      | {
          params: unknown;
          options: unknown;
        }
      | undefined;

    const txLayer = Layer.succeed(TransactionService, {
      sendInvoke: (params, options) => {
        sentInvoke = { params, options };
        return Effect.succeed({ transactionHash: "0xbeef" });
      },
      waitForReceipt: () => Effect.dieMessage("not used in this test"),
      sendInvokeAndWait: () => Effect.dieMessage("not used in this test"),
    });

    const feeLayer = Layer.succeed(FeeEstimatorService, {
      estimate: () => Effect.succeed([]),
    });

    const result = await Effect.runPromise(
      Effect.flatMap(ContractWriteService, (writer) =>
        writer.invokeContract(
          {
            contractAddress: ContractAddress.from("0x1234"),
            abi: WRITE_ABI,
            functionName: "set_value",
            args: [42n],
          },
          { requestOptions: { timeoutMs: 2_000 } },
        ),
      ).pipe(
        Effect.provide(ContractWriteLive),
        Effect.provide(txLayer),
        Effect.provide(feeLayer),
      ),
    );

    expect(result.transactionHash).toBe("0xbeef");
    const payload = sentInvoke?.params as
      | {
          calls?: Array<{
            contract_address: string;
            entry_point: string;
            calldata?: string[];
          }>;
        }
      | undefined;
    expect(payload?.calls?.[0]?.contract_address).toBe(
      ContractAddress.from("0x1234").toHex(),
    );
    expect(payload?.calls?.[0]?.entry_point).toBe("set_value");
    expect(payload?.calls?.[0]?.calldata).toEqual(["0x2a"]);
    expect(sentInvoke?.options).toEqual({ timeoutMs: 2_000 });
  });

  it("invokeContractAndWait delegates to transaction service", async () => {
    let calledOptions: unknown;

    const txLayer = Layer.succeed(TransactionService, {
      sendInvoke: () => Effect.dieMessage("not used in this test"),
      waitForReceipt: () => Effect.dieMessage("not used in this test"),
      sendInvokeAndWait: (_params, options) => {
        calledOptions = options;
        return Effect.succeed({
          transactionHash: "0xbeef",
          receipt: {
            type: "INVOKE",
            transaction_hash: "0xbeef",
            actual_fee: { amount: "0x0", unit: "WEI" },
            finality_status: "ACCEPTED_ON_L2",
            messages_sent: [],
            events: [],
            execution_resources: { steps: 1 },
            execution_status: "SUCCEEDED",
          },
        });
      },
    });

    const feeLayer = Layer.succeed(FeeEstimatorService, {
      estimate: () => Effect.succeed([]),
    });

    const result = await Effect.runPromise(
      Effect.flatMap(ContractWriteService, (writer) =>
        writer.invokeContractAndWait(
          {
            contractAddress: "0x1234",
            abi: WRITE_ABI,
            functionName: "set_value",
            args: [1n],
          },
          {
            invokeOptions: { timeoutMs: 1_000 },
            pollIntervalMs: 0,
            maxAttempts: 3,
          },
        ),
      ).pipe(
        Effect.provide(ContractWriteLive),
        Effect.provide(txLayer),
        Effect.provide(feeLayer),
      ),
    );

    expect(result.transactionHash).toBe("0xbeef");
    expect(result.receipt.transaction_hash).toBe("0xbeef");
    expect(calledOptions).toEqual({
      invokeOptions: { timeoutMs: 1_000 },
      pollIntervalMs: 0,
      maxAttempts: 3,
      requestOptions: undefined,
    });
  });

  it("estimateFee delegates to FeeEstimatorService", async () => {
    let receivedOptions: unknown;
    let receivedTxs: readonly unknown[] | undefined;

    const txLayer = Layer.succeed(TransactionService, {
      sendInvoke: () => Effect.dieMessage("not used in this test"),
      waitForReceipt: () => Effect.dieMessage("not used in this test"),
      sendInvokeAndWait: () => Effect.dieMessage("not used in this test"),
    });

    const feeLayer = Layer.succeed(FeeEstimatorService, {
      estimate: (txs, options) => {
        receivedTxs = txs;
        receivedOptions = options;
        return Effect.succeed([]);
      },
    });

    const tx = {
      type: "INVOKE" as const,
      version: "0x1" as const,
      sender_address: "0xabc",
      calldata: ["0x1"],
      max_fee: "0x10",
      signature: ["0x1", "0x2"],
      nonce: "0x0",
    };

    await Effect.runPromise(
      Effect.flatMap(ContractWriteService, (writer) =>
        writer.estimateFee([tx], {
          simulationFlags: ["SKIP_VALIDATE"],
          blockId: { block_number: 42 },
          requestOptions: { timeoutMs: 5_000 },
        }),
      ).pipe(
        Effect.provide(ContractWriteLive),
        Effect.provide(txLayer),
        Effect.provide(feeLayer),
      ),
    );

    expect(receivedTxs).toEqual([tx]);
    expect(receivedOptions).toEqual({
      simulationFlags: ["SKIP_VALIDATE"],
      blockId: { block_number: 42 },
      requestOptions: { timeoutMs: 5_000 },
    });
  });

  it("fails with ContractError when function is missing", async () => {
    const txLayer = Layer.succeed(TransactionService, {
      sendInvoke: () => Effect.dieMessage("not used in this test"),
      waitForReceipt: () => Effect.dieMessage("not used in this test"),
      sendInvokeAndWait: () => Effect.dieMessage("not used in this test"),
    });

    const feeLayer = Layer.succeed(FeeEstimatorService, {
      estimate: () => Effect.succeed([]),
    });

    const result = await Effect.runPromise(
      Effect.flatMap(ContractWriteService, (writer) =>
        Effect.either(
          writer.invokeContract({
            contractAddress: "0x1234",
            abi: WRITE_ABI,
            functionName: "missing_function" as never,
            args: [],
          }),
        ),
      ).pipe(
        Effect.provide(ContractWriteLive),
        Effect.provide(txLayer),
        Effect.provide(feeLayer),
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ContractError");
      expect(result.left.stage).toBe("encode");
    }
  });
});
