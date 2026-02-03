import { describe, expect, it } from "bun:test";
import * as Rpc from "../../src/jsonrpc/index";

describe("docs/skills/websocket-provider", () => {
  it("exposes subscription helpers", () => {
    expect(typeof Rpc.starknet_subscribeNewHeads).toBe("function");
    expect(typeof Rpc.starknet_subscribeEvents).toBe("function");
    expect(typeof Rpc.starknet_unsubscribe).toBe("function");
  });
});
