import { describe, expect, it } from "vitest";

describe("docs/skills/wallet-modal-starknetkit", () => {
  it("exports connectWallet and disconnectWallet", async () => {
    const mod = await import("./wallet-modal-starknetkit.js");
    expect(typeof mod.connectWallet).toBe("function");
    expect(typeof mod.disconnectWallet).toBe("function");
  });
});
