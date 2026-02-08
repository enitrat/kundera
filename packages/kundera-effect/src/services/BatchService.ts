import { Context, Effect, Layer } from "effect";
import { BatchQueue } from "@kundera-sn/kundera-ts/utils";
import {
  Rpc,
  type BlockId,
  type FunctionCall,
} from "@kundera-sn/kundera-ts/jsonrpc";

import { TransactionError, type RpcError, type TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export interface BatchRequest {
  readonly method: string;
  readonly params?: readonly unknown[];
}

export interface BatchCallRequest {
  readonly payload: FunctionCall;
  readonly blockId?: BlockId;
}

export interface BatchQueueConfig {
  readonly maxBatchSize?: number;
  readonly maxWaitTimeMs?: number;
  readonly requestOptions?: RequestOptions;
}

export interface BatchServiceShape {
  readonly requestMany: <T>(
    requests: readonly BatchRequest[],
    options?: RequestOptions,
  ) => Effect.Effect<readonly T[], TransportError | RpcError>;

  readonly callMany: <T = string[]>(
    calls: readonly BatchCallRequest[],
    options?: RequestOptions,
  ) => Effect.Effect<readonly T[], TransportError | RpcError>;

  readonly enqueueRequest: <T>(
    request: BatchRequest,
  ) => Effect.Effect<T, TransportError | RpcError | TransactionError>;

  readonly enqueueCall: <T = string[]>(
    call: BatchCallRequest,
  ) => Effect.Effect<T, TransportError | RpcError | TransactionError>;

  readonly flush: Effect.Effect<void, TransactionError>;
}

export class BatchService extends Context.Tag("@kundera/BatchService")<
  BatchService,
  BatchServiceShape
>() {}

const BATCH_QUEUE_DEFAULTS = {
  maxBatchSize: 25,
  maxWaitTimeMs: 10,
} as const;

interface QueueEntry {
  readonly request: BatchRequest;
}

const toCallRequest = (call: BatchCallRequest): BatchRequest => {
  const { method, params } = Rpc.CallRequest(call.payload, call.blockId ?? "latest");
  return { method, params } satisfies BatchRequest;
};

export const BatchLive = (
  config: BatchQueueConfig = {},
): Layer.Layer<BatchService, never, ProviderService> =>
  Layer.effect(
    BatchService,
    Effect.gen(function* () {
      const provider = yield* ProviderService;
      const queueConfig = {
        maxBatchSize: config.maxBatchSize ?? BATCH_QUEUE_DEFAULTS.maxBatchSize,
        maxWaitTimeMs: config.maxWaitTimeMs ?? BATCH_QUEUE_DEFAULTS.maxWaitTimeMs,
      };

      const requestMany: BatchServiceShape["requestMany"] = <T>(
        requests: readonly BatchRequest[],
        options?: RequestOptions,
      ) => {
        if (requests.length === 0) {
          return Effect.succeed([] as const);
        }
        return provider.requestBatch<T>(requests, options);
      };

      const queue = new BatchQueue<QueueEntry, unknown>({
        maxBatchSize: queueConfig.maxBatchSize,
        maxWaitTime: queueConfig.maxWaitTimeMs,
        processBatch: async (items) =>
          await Effect.runPromise(
            requestMany<unknown>(
              items.map((item) => item.request),
              config.requestOptions,
            ).pipe(Effect.map((results) => [...results])),
          ),
      });

      const callMany: BatchServiceShape["callMany"] = <T = string[]>(
        calls: readonly BatchCallRequest[],
        options?: RequestOptions,
      ) =>
        requestMany<T>(
          calls.map((call) => toCallRequest(call)),
          options,
        );

      const enqueueRequest: BatchServiceShape["enqueueRequest"] = <T>(
        request: BatchRequest,
      ) =>
        Effect.tryPromise({
          try: () => queue.add({ request }),
          catch: (cause) =>
            new TransactionError({
              operation: "BatchService.enqueueRequest",
              message: "Failed to enqueue batch request",
              cause,
            }),
        }).pipe(Effect.map((result) => result as T));

      const enqueueCall: BatchServiceShape["enqueueCall"] = <T = string[]>(
        call: BatchCallRequest,
      ) => enqueueRequest<T>(toCallRequest(call));

      const flush: BatchServiceShape["flush"] = Effect.tryPromise({
        try: () => queue.flush(),
        catch: (cause) =>
          new TransactionError({
            operation: "BatchService.flush",
            message: "Failed to flush batch queue",
            cause,
          }),
      });

      return {
        requestMany,
        callMany,
        enqueueRequest,
        enqueueCall,
        flush,
      } satisfies BatchServiceShape;
    }),
  );
