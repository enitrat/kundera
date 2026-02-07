import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";

import {
  FallbackHttpProviderLive,
  ProviderService,
} from "../ProviderService.js";

const mockedFetch = vi.fn<typeof fetch>();

describe("ProviderService fallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockedFetch.mockReset();
  });

  it("falls back to secondary endpoint when primary fails", async () => {
    vi.stubGlobal("fetch", mockedFetch);

    mockedFetch.mockImplementation(async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        id?: number;
      };

      if (url.includes("primary")) {
        throw new Error("primary down");
      }

      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id ?? 1,
          result: "0x534e5f5345504f4c4941",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    const program = Effect.flatMap(ProviderService, (provider) =>
      provider.request<string>("starknet_chainId"),
    ).pipe(
      Effect.provide(
        FallbackHttpProviderLive([
          { url: "https://primary.example", attempts: 1 },
          { url: "https://secondary.example", attempts: 1 },
        ]),
      ),
    );

    const chainId = await Effect.runPromise(program);

    expect(chainId).toBe("0x534e5f5345504f4c4941");
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});
