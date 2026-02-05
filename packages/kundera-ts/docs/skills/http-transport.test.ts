import { describe, expect, it } from "vitest";
import { createRequest, createErrorResponse } from "../../src/transport/index";

describe("docs/skills/http-transport", () => {
  it("builds a JSON-RPC request", () => {
    const request = createRequest("starknet_chainId", []);
    expect(request.jsonrpc).toBe("2.0");
  });

  it("builds JSON-RPC error responses", () => {
    const errorResponse = createErrorResponse(1, -1, "boom");
    expect(errorResponse.error.message).toBe("boom");
  });
});
