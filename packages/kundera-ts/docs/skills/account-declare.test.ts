import { describe, expect, it } from "vitest";
import * as Crypto from "../../src/crypto/index";

describe("docs/skills/account-declare", () => {
  it("exposes declare helpers used in the skill", () => {
    expect(typeof Crypto.computeDeclareV3Hash).toBe("function");
    expect(typeof Crypto.DEFAULT_RESOURCE_BOUNDS).toBe("object");
  });
});
