/**
 * WebSocket transport layer for TransportService.
 */

import * as Layer from "effect/Layer";
import {
  webSocketTransport,
  type WebSocketTransportOptions,
  type WebSocketTransport as WebSocketTransportInstance
} from "@kundera-sn/kundera-ts/transport";
import {
  makeTransportService,
  type TransportConfig,
  TransportService
} from "./TransportService.js";

export const WebSocketTransport = (
  url: string,
  options?: WebSocketTransportOptions,
  config?: TransportConfig
) =>
  Layer.succeed(
    TransportService,
    makeTransportService(webSocketTransport(url, options), config)
  );

export type { WebSocketTransportOptions, WebSocketTransportInstance };
