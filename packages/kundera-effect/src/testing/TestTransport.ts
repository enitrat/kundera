import { Effect, Layer } from "effect";

import { RpcError, TransportError } from "../errors.js";
import { TransportService, type TransportServiceShape } from "../services/TransportService.js";

export type MockResponse = unknown | TransportError | RpcError;

const resolveMock = <T>(
  responses: Record<string, MockResponse>,
  method: string,
): Effect.Effect<T, TransportError | RpcError> => {
  const response = responses[method];
  if (response === undefined) {
    return Effect.fail(
      new RpcError({
        method,
        code: -32601,
        message: `TestTransport: no mock for "${method}"`,
      }),
    );
  }
  if (response instanceof TransportError) {
    return Effect.fail(response);
  }
  if (response instanceof RpcError) {
    return Effect.fail(response);
  }
  return Effect.succeed(response as T);
};

/**
 * Test transport that returns canned responses by method name.
 * Pass a TransportError or RpcError instance to simulate failures.
 */
export const TestTransport = (
  responses: Record<string, MockResponse>,
): Layer.Layer<TransportService> =>
  Layer.succeed(TransportService, {
    // Use Effect.fail instead of Effect.die so that tests exercising error
    // paths can catch this via Effect.either / Effect.catchTag without
    // aborting the test runner. Semantically this is a defect (programmer
    // called the wrong method), but fail gives better DX in test suites.
    requestRaw: () =>
      Effect.fail(
        new TransportError({
          operation: "requestRaw",
          message: "TestTransport does not support requestRaw; use request()",
        }),
      ),
    requestRawBatch: () =>
      Effect.fail(
        new TransportError({
          operation: "requestRawBatch",
          message: "TestTransport does not support requestRawBatch; use requestBatch()",
        }),
      ),
    request: <T>(method: string) => resolveMock<T>(responses, method),
    requestBatch: <T>(
      requests: readonly {
        readonly method: string;
        readonly params?: readonly unknown[];
      }[],
    ) => Effect.forEach(requests, (request) => resolveMock<T>(responses, request.method)),
    close: Effect.void,
  } satisfies TransportServiceShape);
