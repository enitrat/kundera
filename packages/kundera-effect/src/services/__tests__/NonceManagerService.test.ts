import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";
import { ContractAddress, Felt252 } from "@kundera-sn/kundera-ts";

import { ProviderService } from "../ProviderService.js";
import {
  DefaultNonceManagerLive,
  NonceManagerService,
} from "../NonceManagerService.js";

describe("NonceManagerService", () => {
  it("consumes increasing nonces locally", async () => {
    let nonceRequests = 0;
    let latestNonceAddress: unknown;
    const account = ContractAddress.from("0xabc");
    const explicitChainId = Felt252.from("0x534e5f5345504f4c4941");

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
        const first = yield* nonce.consume(account, { chainId: explicitChainId });
        const second = yield* nonce.consume(account, { chainId: explicitChainId });
        const current = yield* nonce.get(account, { chainId: explicitChainId });

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
    expect(latestNonceAddress).toBe(account.toHex());
  });
});
