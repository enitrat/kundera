/**
 * HTTP transport layer for TransportService.
 */

import * as Layer from "effect/Layer";
import { httpTransport, type HttpTransportOptions } from "@kundera-sn/kundera-ts/transport";
import {
  makeTransportService,
  type TransportConfig,
  TransportService
} from "./TransportService.js";

export const HttpTransport = (
  url: string,
  options?: HttpTransportOptions,
  config?: TransportConfig
) => Layer.succeed(TransportService, makeTransportService(httpTransport(url, options), config));

export type { HttpTransportOptions };
