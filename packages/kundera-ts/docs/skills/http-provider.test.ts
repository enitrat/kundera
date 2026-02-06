import { describe, expect, it } from "vitest";
import { Rpc } from "../../src/jsonrpc/index";

describe("docs/skills/http-provider", () => {
  it("exposes JSON-RPC request builders used by the provider skill", () => {
    expect(typeof Rpc.ChainIdRequest).toBe("function");
    expect(typeof Rpc.BlockNumberRequest).toBe("function");
    expect(typeof Rpc.CallRequest).toBe("function");
    expect(typeof Rpc.AddInvokeTransactionRequest).toBe("function");
  });
});
