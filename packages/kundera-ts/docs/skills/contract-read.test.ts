import { describe, expect, it } from "vitest";
import * as Abi from "../../src/abi/index";

describe("docs/skills/contract-read", () => {
  it("exposes ABI helpers used in the skill", () => {
    expect(typeof Abi.encodeCalldata).toBe("function");
    expect(typeof Abi.decodeOutput).toBe("function");
    expect(typeof Abi.getFunctionSelectorHex).toBe("function");
  });
});
