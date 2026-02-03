import { describe, expect, it } from "bun:test";
import {
  createRequest,
  matchBatchResponses,
  type JsonRpcResponse
} from "../../src/transport/index";

describe("docs/skills/contract-multicall", () => {
  it("matches batch responses to request order", () => {
    const req1 = createRequest("starknet_chainId", [], 1);
    const req2 = createRequest("starknet_blockNumber", [], 2);
    const responses: JsonRpcResponse[] = [
      { jsonrpc: "2.0", id: 2, result: 10 },
      { jsonrpc: "2.0", id: 1, result: "0x1" }
    ];

    const matched = matchBatchResponses([req1, req2], responses);
    expect(matched[0]?.id).toBe(1);
    expect(matched[1]?.id).toBe(2);
  });
});
