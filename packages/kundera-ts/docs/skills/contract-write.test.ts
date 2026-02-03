import { describe, expect, it } from "bun:test";
import * as Abi from "../../src/abi/index";

describe("docs/skills/contract-write", () => {
  it("exposes calldata encoder for writes", () => {
    expect(typeof Abi.encodeCalldata).toBe("function");
  });
});
