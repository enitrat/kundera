/**
 * RpcBatch layer for batching JSON-RPC calls using TransportService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { JsonRpcRequest, JsonRpcResponse } from "@kundera-sn/kundera-ts/transport";
import { isJsonRpcError, matchBatchResponses } from "@kundera-sn/kundera-ts/transport";
import { RpcError, TransportError } from "../../errors.js";
import { RpcBatchService } from "./RpcBatchService.js";
import { TransportService } from "../Transport/TransportService.js";

export type RpcBatchConfig = {
  maxBatchSize: number;
  maxWaitTime: number;
};

type BatchItem = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

class BatchQueue<T, R> {
  private readonly maxBatchSize: number;
  private readonly maxWaitTime: number;
  private readonly processBatch: (items: T[]) => Promise<R[]>;
  private queue: Array<{
    item: T;
    resolve: (value: R) => void;
    reject: (error: unknown) => void;
  }> = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private processing = false;

  constructor(options: {
    maxBatchSize: number;
    maxWaitTime: number;
    processBatch: (items: T[]) => Promise<R[]>;
  }) {
    this.maxBatchSize = options.maxBatchSize;
    this.maxWaitTime = options.maxWaitTime;
    this.processBatch = options.processBatch;
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      if (this.queue.length === 1) {
        this.startTimer();
      }

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      }
    });
  }

  private startTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.maxWaitTime);
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0 || this.processing) {
      return;
    }

    const batch = this.queue.splice(0, this.maxBatchSize);
    const items = batch.map((entry) => entry.item);

    this.processing = true;

    try {
      const results = await this.processBatch(items);

      for (let i = 0; i < batch.length; i++) {
        batch[i]?.resolve(results[i]!);
      }
    } catch (error) {
      for (const entry of batch) {
        entry.reject(error);
      }
    } finally {
      this.processing = false;

      if (this.queue.length > 0) {
        this.startTimer();

        if (this.queue.length >= this.maxBatchSize) {
          this.flush();
        }
      }
    }
  }
}

type BatchResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: RpcError };

const toRpcError = (operation: string, input: unknown, error: { code: number; message: string; data?: unknown }) =>
  new RpcError({
    message: error.message,
    operation,
    input,
    expected: "JSON-RPC success response",
    cause: error
  });

const toTransportError = (operation: string, input: unknown, error: unknown) =>
  error instanceof TransportError
    ? error
    : new TransportError({
        message: error instanceof Error ? error.message : "Transport operation failed",
        operation,
        input,
        expected: "JSON-RPC response",
        cause: error instanceof Error ? error : undefined
      });

const buildRequest = (
  method: string,
  params?: unknown[] | Record<string, unknown>,
  id?: number | string
): JsonRpcRequest => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method
  };
  if (id !== undefined) {
    request.id = id;
  }
  if (params !== undefined) {
    request.params = params;
  }
  return request;
};

export const RpcBatch = (config: RpcBatchConfig) =>
  Layer.effect(
    RpcBatchService,
    Effect.gen(function* () {
      const transport = yield* TransportService;
      let requestId = 0;
      const nextId = () => ++requestId;

      const queue = new BatchQueue<BatchItem, BatchResult<unknown>>({
        maxBatchSize: config.maxBatchSize,
        maxWaitTime: config.maxWaitTime,
        processBatch: async (items) => {
          const requests = items.map((item) =>
            buildRequest(item.method, item.params, nextId())
          );

          const responses = await Effect.runPromise(
            transport.requestBatchRaw<unknown>(requests)
          );

          const ordered = matchBatchResponses(requests, responses);

          return ordered.map((response, index) => {
            if (isJsonRpcError(response)) {
              return {
                ok: false,
                error: toRpcError(
                  "rpcBatch",
                  items[index] ?? requests[index],
                  response.error
                )
              };
            }
            if ("result" in response) {
              return { ok: true, value: response.result };
            }
            return {
              ok: false,
              error: toRpcError(
                "rpcBatch",
                items[index] ?? requests[index],
                { code: -1, message: "Invalid JSON-RPC response" }
              )
            };
          });
        }
      });

      return {
        request: <T>(method: string, params?: unknown[] | Record<string, unknown>) =>
          Effect.tryPromise({
            try: () => queue.add({ method, params }),
            catch: (error) => toTransportError("rpcBatch", { method, params }, error)
          }).pipe(
            Effect.flatMap((result) =>
              result.ok
                ? Effect.succeed(result.value as T)
                : Effect.fail(result.error)
            )
          )
      };
    })
  );
