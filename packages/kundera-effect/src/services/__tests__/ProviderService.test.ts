import { describe, expect, it } from "@effect/vitest";
import { afterEach, vi } from "vitest";
import { Effect } from "effect";

import { FallbackHttpProviderLive, ProviderService } from "../ProviderService.js";

const mockedFetch = vi.fn<typeof fetch>();

const jsonResultResponse = (id: number, result: unknown): Response =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const jsonErrorResponse = (
  id: number,
  error: { code: number; message: string; data?: unknown },
): Response =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id, error }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const readBody = (init?: RequestInit): { id: number; method: string } =>
  JSON.parse(String(init?.body ?? "{}")) as { id: number; method: string };

describe("ProviderService fallback", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    mockedFetch.mockReset();
  });

  it.effect("falls back to secondary endpoint when primary fails", () =>
    Effect.gen(function* () {
      vi.stubGlobal("fetch", mockedFetch);

      mockedFetch.mockImplementation(async (input, init) => {
        const url = String(input);
        const body = readBody(init);

        if (url.includes("primary")) {
          throw new Error("primary down");
        }

        return jsonResultResponse(body.id, "0x534e5f5345504f4c4941");
      });

      const chainId = yield* Effect.flatMap(ProviderService, (provider) =>
        provider.request<string>("starknet_chainId"),
      ).pipe(
        Effect.provide(
          FallbackHttpProviderLive([
            { url: "https://primary.example", attempts: 1 },
            { url: "https://secondary.example", attempts: 1 },
          ]),
        ),
      );

      expect(chainId).toBe("0x534e5f5345504f4c4941");
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    }),
  );

  it.effect("retries within a single endpoint until success", () =>
    Effect.gen(function* () {
      vi.stubGlobal("fetch", mockedFetch);
      let attempts = 0;

      mockedFetch.mockImplementation(async (_input, init) => {
        attempts += 1;
        const body = readBody(init);

        if (attempts < 3) {
          throw new Error("temporary failure");
        }

        return jsonResultResponse(body.id, "0x534e5f5345504f4c4941");
      });

      const result = yield* Effect.flatMap(ProviderService, (provider) =>
        provider.request<string>("starknet_chainId"),
      ).pipe(
        Effect.provide(
          FallbackHttpProviderLive([
            { url: "https://primary.example", attempts: 3, retryDelayMs: 0 },
          ]),
        ),
      );

      expect(result).toBe("0x534e5f5345504f4c4941");
      expect(attempts).toBe(3);
    }),
  );

  it.effect("retries retryable RPC errors", () =>
    Effect.gen(function* () {
      vi.stubGlobal("fetch", mockedFetch);
      let attempts = 0;

      mockedFetch.mockImplementation(async (_input, init) => {
        attempts += 1;
        const body = readBody(init);

        if (attempts === 1) {
          return jsonErrorResponse(body.id, {
            code: -32603,
            message: "Internal error",
          });
        }

        return jsonResultResponse(body.id, "0x534e5f5345504f4c4941");
      });

      const result = yield* Effect.flatMap(ProviderService, (provider) =>
        provider.request<string>("starknet_chainId"),
      ).pipe(
        Effect.provide(
          FallbackHttpProviderLive([
            { url: "https://primary.example", attempts: 2, retryDelayMs: 0 },
          ]),
        ),
      );

      expect(result).toBe("0x534e5f5345504f4c4941");
      expect(attempts).toBe(2);
    }),
  );

  it.effect("fails fast on non-retryable RPC errors without trying the next endpoint", () =>
    Effect.gen(function* () {
      vi.stubGlobal("fetch", mockedFetch);

      mockedFetch.mockImplementation(async (input, init) => {
        const url = String(input);
        const body = readBody(init);

        if (url.includes("primary")) {
          return jsonErrorResponse(body.id, {
            code: 20,
            message: "Contract not found",
          });
        }

        return jsonResultResponse(body.id, "0x534e5f5345504f4c4941");
      });

      const error = yield* Effect.flip(
        Effect.flatMap(ProviderService, (provider) =>
          provider.request<string>("starknet_chainId"),
        ).pipe(
          Effect.provide(
            FallbackHttpProviderLive([
              { url: "https://primary.example", attempts: 2, retryDelayMs: 0 },
              { url: "https://secondary.example", attempts: 1 },
            ]),
          ),
        ),
      );

      expect(error._tag).toBe("RpcError");
      expect(error.code).toBe(20);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    }),
  );

  it.effect("returns TransportError when all endpoints fail", () =>
    Effect.gen(function* () {
      vi.stubGlobal("fetch", mockedFetch);
      mockedFetch.mockRejectedValue(new Error("network down"));

      const error = yield* Effect.flip(
        Effect.flatMap(ProviderService, (provider) =>
          provider.request<string>("starknet_chainId"),
        ).pipe(
          Effect.provide(
            FallbackHttpProviderLive([
              { url: "https://primary.example", attempts: 2, retryDelayMs: 0 },
              { url: "https://secondary.example", attempts: 1, retryDelayMs: 0 },
            ]),
          ),
        ),
      );

      expect(error._tag).toBe("TransportError");
      expect(error.operation).toBe("starknet_chainId");
      expect(error.message).toContain("All fallback provider endpoints failed");
    }),
  );

  it.effect("assigns unique request ids across concurrent requests", () =>
    Effect.gen(function* () {
      vi.stubGlobal("fetch", mockedFetch);
      const seenIds = new Set<number>();

      mockedFetch.mockImplementation(async (_input, init) => {
        const body = readBody(init);
        seenIds.add(body.id);
        return jsonResultResponse(body.id, body.method);
      });

      const results = yield* Effect.flatMap(ProviderService, (provider) =>
        Effect.all([
          provider.request<string>("starknet_chainId"),
          provider.request<string>("starknet_blockNumber"),
        ]),
      ).pipe(
        Effect.provide(
          FallbackHttpProviderLive([{ url: "https://primary.example", attempts: 1 }]),
        ),
      );

      expect(results).toEqual(["starknet_chainId", "starknet_blockNumber"]);
      expect(seenIds.size).toBe(2);
    }),
  );

  // Fake timers require manual async control (advancing between steps),
  // so this test keeps the async () => pattern.
  it("waits retryDelayMs between retries", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", mockedFetch);

    let attempts = 0;
    mockedFetch.mockImplementation(async (_input, init) => {
      attempts += 1;
      const body = readBody(init);
      if (attempts === 1) {
        throw new Error("transient");
      }
      return jsonResultResponse(body.id, "ok");
    });

    const program = Effect.flatMap(ProviderService, (provider) =>
      provider.request<string>("starknet_chainId"),
    ).pipe(
      Effect.provide(
        FallbackHttpProviderLive([
          { url: "https://primary.example", attempts: 2, retryDelayMs: 50 },
        ]),
      ),
    );

    const promise = Effect.runPromise(program);
    await vi.advanceTimersByTimeAsync(49);
    expect(attempts).toBe(1);
    await vi.advanceTimersByTimeAsync(1);

    const result = await promise;
    expect(result).toBe("ok");
    expect(attempts).toBe(2);
  });
});
