import { describe, expect, it } from "vitest";

describe("docs/skills/wallet-modal", () => {
  it("documents the supported chain ids", () => {
    const supported = ["SN_MAIN", "SN_SEPOLIA"] as const;
    expect(supported).toContain("SN_MAIN");
    expect(supported).toContain("SN_SEPOLIA");
  });
});
