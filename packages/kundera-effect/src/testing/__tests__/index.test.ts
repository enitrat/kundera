import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { RpcError } from "../../errors.js";
import * as JsonRpc from "../../jsonrpc/index.js";
import { TestProvider } from "../TestProvider.js";

describe("testing utilities", () => {
  it("TestProvider serves canned responses to jsonrpc helpers", async () => {
    const result = await Effect.runPromise(
      JsonRpc.chainId().pipe(
        Effect.provide(
          TestProvider({
            starknet_chainId: "0x534e5f5345504f4c4941",
          }),
        ),
      ),
    );

    expect(result).toBe("0x534e5f5345504f4c4941");
  });

  it("TestProvider returns RpcError for missing method mocks", async () => {
    const error = await Effect.runPromise(
      Effect.flip(
        JsonRpc.blockNumber().pipe(
          Effect.provide(
            TestProvider({
              starknet_chainId: "0x534e5f5345504f4c4941",
            }),
          ),
        ),
      ),
    );

    expect(error._tag).toBe("RpcError");
    expect(error).toBeInstanceOf(RpcError);
    expect(error.code).toBe(-32601);
  });
});
