import * as Layer from "effect/Layer";
import { Provider, type ProviderService } from "../Provider/index.js";
import {
  HttpTransport,
  WebSocketTransport,
  type TransportConfig
} from "../Transport/index.js";
import { RpcBatch, type RpcBatchConfig, type RpcBatchService } from "../RpcBatch/index.js";

export const createHttpProvider = (
  url: string,
  options?: Parameters<typeof HttpTransport>[1],
  transportConfig?: TransportConfig
): Layer.Layer<ProviderService> =>
  Provider.pipe(Layer.provide(HttpTransport(url, options, transportConfig)));

export const createWebSocketProvider = (
  url: string,
  options?: Parameters<typeof WebSocketTransport>[1],
  transportConfig?: TransportConfig
): Layer.Layer<ProviderService> =>
  Provider.pipe(Layer.provide(WebSocketTransport(url, options, transportConfig)));

export const createHttpProviderWithBatch = (
  url: string,
  batch: RpcBatchConfig,
  options?: Parameters<typeof HttpTransport>[1],
  transportConfig?: TransportConfig
): Layer.Layer<ProviderService | RpcBatchService> =>
  (() => {
    const transport = HttpTransport(url, options, transportConfig);
    return Layer.mergeAll(
      Provider.pipe(Layer.provide(transport)),
      RpcBatch(batch).pipe(Layer.provide(transport))
    );
  })();
