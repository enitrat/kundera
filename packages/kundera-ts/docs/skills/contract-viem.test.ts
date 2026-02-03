import { describe, expect, it } from "bun:test";
import * as Abi from "../../src/abi/index";

describe("docs/skills/contract-viem", () => {
  it("exposes event decoding helpers", () => {
    expect(typeof Abi.decodeEventBySelector).toBe("function");
    expect(typeof Abi.getEventSelectorHex).toBe("function");
  });
});
