import { Effect, Layer } from "effect";

import { RpcError, TransportError } from "../errors.js";
import { TransportService, type TransportServiceShape } from "../services/TransportService.js";

export type MockResponse = unknown | TransportError | RpcError;

/**
 * Test transport that returns canned responses by method name.
 * Pass a TransportError or RpcError instance to simulate failures.
 */
export const TestTransport = (
  responses: Record<string, MockResponse>,
): Layer.Layer<TransportService> =>
  Layer.succeed(TransportService, {
    requestRaw: () =>
      Effect.dieMessage("TestTransport does not support requestRaw; use request()"),
    request: <T>(method: string) => {
      const response = responses[method];
      if (response === undefined) {
        return Effect.fail(
          new RpcError({
            method,
            code: -32601,
            message: `TestTransport: no mock for \"${method}\"`,
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
    },
    close: Effect.void,
  } satisfies TransportServiceShape);
