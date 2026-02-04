import { describe, expect, it } from "bun:test";
import * as Abi from "../../src/abi/index";

describe("docs/skills/event-filtering", () => {
  it("exposes selector helpers used in filters", () => {
    expect(typeof Abi.computeSelector).toBe("function");
    expect(typeof Abi.decodeEventBySelector).toBe("function");
  });
});
