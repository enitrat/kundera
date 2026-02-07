import { Layer } from "effect";

import { ProviderLive } from "../services/ProviderService.js";
import { TestTransport, type MockResponse } from "./TestTransport.js";

/**
 * Composed TestTransport + ProviderLive layer for tests using ProviderService.
 */
export const TestProvider = (responses: Record<string, MockResponse>) =>
  ProviderLive.pipe(Layer.provide(TestTransport(responses)));
