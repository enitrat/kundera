import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { RpcError } from "../../errors.js";
import * as JsonRpc from "../../jsonrpc/index.js";
import { TestProvider } from "../TestProvider.js";

describe("testing utilities", () => {
  it.effect("TestProvider serves canned responses to jsonrpc helpers", () =>
    Effect.gen(function* () {
      const result = yield* JsonRpc.chainId();

      expect(result).toBe("0x534e5f5345504f4c4941");
    }).pipe(
      Effect.provide(
        TestProvider({
          starknet_chainId: "0x534e5f5345504f4c4941",
        }),
      ),
    ),
  );

  it.effect("TestProvider returns RpcError for missing method mocks", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(JsonRpc.blockNumber());

      expect(error._tag).toBe("RpcError");
      expect(error).toBeInstanceOf(RpcError);
      expect(error.code).toBe(-32601);
    }).pipe(
      Effect.provide(
        TestProvider({
          starknet_chainId: "0x534e5f5345504f4c4941",
        }),
      ),
    ),
  );
});
