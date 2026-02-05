import { describe, expect, it } from "vitest";
import * as Crypto from "../../src/crypto/index";

describe("docs/skills/account-invoke", () => {
  it("exposes invoke helpers used in the skill", () => {
    expect(typeof Crypto.computeInvokeV3Hash).toBe("function");
    expect(typeof Crypto.computeSelector).toBe("function");
    expect(typeof Crypto.DEFAULT_RESOURCE_BOUNDS).toBe("object");
  });
});
