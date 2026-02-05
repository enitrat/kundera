import { describe, expect, it } from "vitest";
import * as Rpc from "../../src/jsonrpc/index";

describe("docs/skills/http-provider", () => {
  it("exposes JSON-RPC methods used by the provider skill", () => {
    expect(typeof Rpc.starknet_chainId).toBe("function");
    expect(typeof Rpc.starknet_blockNumber).toBe("function");
    expect(typeof Rpc.starknet_call).toBe("function");
    expect(typeof Rpc.starknet_addInvokeTransaction).toBe("function");
  });
});
