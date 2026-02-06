import { describe, expect, it } from "vitest";
import { Rpc } from "../../src/jsonrpc/index";

describe("docs/skills/websocket-provider", () => {
  it("exposes subscription request builders", () => {
    expect(typeof Rpc.SubscribeNewHeadsRequest).toBe("function");
    expect(typeof Rpc.SubscribeEventsRequest).toBe("function");
    expect(typeof Rpc.UnsubscribeRequest).toBe("function");
  });
});
