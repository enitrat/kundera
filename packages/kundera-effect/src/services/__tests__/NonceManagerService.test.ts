import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ContractAddress, Felt252 } from "@kundera-sn/kundera-ts";

import { ProviderService } from "../ProviderService.js";
import { DefaultNonceManagerLive, NonceManagerService } from "../NonceManagerService.js";

const TEST_CHAIN_ID = Felt252.from("0x534e5f5345504f4c4941");
const TEST_ACCOUNT = ContractAddress.from("0xabc");

describe("NonceManagerService", () => {
  it("consumes increasing nonces locally", async () => {
    let nonceRequests = 0;
    let latestNonceAddress: unknown;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        if (method === "starknet_chainId") {
          return Effect.succeed("0x534e5f5345504f4c4941" as T);
        }

        if (method === "starknet_getNonce") {
          nonceRequests += 1;
          latestNonceAddress = params?.[1];
          return Effect.succeed("0x10" as T);
        }

        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    const program = Effect.flatMap(NonceManagerService, (nonce) =>
      Effect.gen(function* () {
        const first = yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
        const second = yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
        const current = yield* nonce.get(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });

        return { first, second, current };
      }),
    ).pipe(
      Effect.provide(DefaultNonceManagerLive),
      Effect.provide(providerLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result.first).toBe(16n);
    expect(result.second).toBe(17n);
    expect(result.current).toBe(18n);
    expect(nonceRequests).toBe(3);
    expect(latestNonceAddress).toBe(TEST_ACCOUNT.toHex());
  });

  it("reset clears local nonce delta", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_getNonce") {
          return Effect.succeed("0x10" as T);
        }
        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    const result = await Effect.runPromise(
      Effect.flatMap(NonceManagerService, (nonce) =>
        Effect.gen(function* () {
          yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
          yield* nonce.reset(TEST_ACCOUNT, TEST_CHAIN_ID);
          return yield* nonce.get(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
        }),
      ).pipe(
        Effect.provide(DefaultNonceManagerLive),
        Effect.provide(providerLayer),
      ),
    );

    expect(result).toBe(16n);
  });

  it("increment bumps the next returned nonce", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_getNonce") {
          return Effect.succeed("0x10" as T);
        }
        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    const result = await Effect.runPromise(
      Effect.flatMap(NonceManagerService, (nonce) =>
        Effect.gen(function* () {
          yield* nonce.increment(TEST_ACCOUNT, TEST_CHAIN_ID);
          return yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
        }),
      ).pipe(
        Effect.provide(DefaultNonceManagerLive),
        Effect.provide(providerLayer),
      ),
    );

    expect(result).toBe(17n);
  });

  it("consume after reset fetches fresh on-chain nonce", async () => {
    let nonceValue = "0x10";

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_getNonce") {
          return Effect.succeed(nonceValue as T);
        }
        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    const result = await Effect.runPromise(
      Effect.flatMap(NonceManagerService, (nonce) =>
        Effect.gen(function* () {
          const first = yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
          yield* nonce.reset(TEST_ACCOUNT, TEST_CHAIN_ID);
          nonceValue = "0x20";
          const afterReset = yield* nonce.consume(TEST_ACCOUNT, {
            chainId: TEST_CHAIN_ID,
          });
          return { first, afterReset };
        }),
      ).pipe(
        Effect.provide(DefaultNonceManagerLive),
        Effect.provide(providerLayer),
      ),
    );

    expect(result.first).toBe(16n);
    expect(result.afterReset).toBe(32n);
  });

  it("does not call starknet_chainId when explicit chainId is provided", async () => {
    let chainIdCalls = 0;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_chainId") {
          chainIdCalls += 1;
          return Effect.succeed("0x534e5f5345504f4c4941" as T);
        }

        if (method === "starknet_getNonce") {
          return Effect.succeed("0x0" as T);
        }

        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    await Effect.runPromise(
      Effect.flatMap(NonceManagerService, (nonce) =>
        nonce.get(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID }),
      ).pipe(
        Effect.provide(DefaultNonceManagerLive),
        Effect.provide(providerLayer),
      ),
    );

    expect(chainIdCalls).toBe(0);
  });
});
