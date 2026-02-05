import { describe, expect, it } from "vitest";
import * as Crypto from "../../src/crypto/index";

describe("docs/skills/account-deploy", () => {
  it("exposes deploy helpers used in the skill", () => {
    expect(typeof Crypto.computeDeployAccountV3Hash).toBe("function");
    expect(typeof Crypto.computeContractAddress).toBe("function");
    expect(typeof Crypto.DEFAULT_RESOURCE_BOUNDS).toBe("object");
  });
});
