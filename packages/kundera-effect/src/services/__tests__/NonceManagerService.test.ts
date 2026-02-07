import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ContractAddress, Felt252 } from "@kundera-sn/kundera-ts";

import { ProviderService } from "../ProviderService.js";
import { DefaultNonceManagerLive, NonceManagerService } from "../NonceManagerService.js";

const TEST_CHAIN_ID = Felt252.from("0x534e5f5345504f4c4941");
const TEST_ACCOUNT = ContractAddress.from("0xabc");

describe("NonceManagerService", () => {
  it.effect("consumes increasing nonces locally", () => {
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

    return Effect.gen(function* () {
      const nonce = yield* NonceManagerService;
      const first = yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
      const second = yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
      const current = yield* nonce.get(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });

      expect(first).toBe(16n);
      expect(second).toBe(17n);
      expect(current).toBe(18n);
      expect(nonceRequests).toBe(3);
      expect(latestNonceAddress).toBe(TEST_ACCOUNT.toHex());
    }).pipe(
      Effect.provide(DefaultNonceManagerLive),
      Effect.provide(providerLayer),
    );
  });

  it.effect("reset clears local nonce delta", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_getNonce") {
          return Effect.succeed("0x10" as T);
        }
        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    return Effect.gen(function* () {
      const nonce = yield* NonceManagerService;
      yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
      yield* nonce.reset(TEST_ACCOUNT, TEST_CHAIN_ID);
      const result = yield* nonce.get(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });

      expect(result).toBe(16n);
    }).pipe(
      Effect.provide(DefaultNonceManagerLive),
      Effect.provide(providerLayer),
    );
  });

  it.effect("increment bumps the next returned nonce", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_getNonce") {
          return Effect.succeed("0x10" as T);
        }
        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    return Effect.gen(function* () {
      const nonce = yield* NonceManagerService;
      yield* nonce.increment(TEST_ACCOUNT, TEST_CHAIN_ID);
      const result = yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });

      expect(result).toBe(17n);
    }).pipe(
      Effect.provide(DefaultNonceManagerLive),
      Effect.provide(providerLayer),
    );
  });

  it.effect("consume after reset fetches fresh on-chain nonce", () => {
    let nonceValue = "0x10";

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_getNonce") {
          return Effect.succeed(nonceValue as T);
        }
        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    return Effect.gen(function* () {
      const nonce = yield* NonceManagerService;
      const first = yield* nonce.consume(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });
      yield* nonce.reset(TEST_ACCOUNT, TEST_CHAIN_ID);
      nonceValue = "0x20";
      const afterReset = yield* nonce.consume(TEST_ACCOUNT, {
        chainId: TEST_CHAIN_ID,
      });

      expect(first).toBe(16n);
      expect(afterReset).toBe(32n);
    }).pipe(
      Effect.provide(DefaultNonceManagerLive),
      Effect.provide(providerLayer),
    );
  });

  it.effect("does not call starknet_chainId when explicit chainId is provided", () => {
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

    return Effect.gen(function* () {
      const nonce = yield* NonceManagerService;
      yield* nonce.get(TEST_ACCOUNT, { chainId: TEST_CHAIN_ID });

      expect(chainIdCalls).toBe(0);
    }).pipe(
      Effect.provide(DefaultNonceManagerLive),
      Effect.provide(providerLayer),
    );
  });
});
