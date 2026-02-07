import { describe, expect, it } from "vitest";

describe("docs/skills/wallet-modal-get-starknet", () => {
  it("exports connectWallet and disconnectWallet", async () => {
    const mod = await import("./wallet-modal-get-starknet.js");
    expect(typeof mod.connectWallet).toBe("function");
    expect(typeof mod.disconnectWallet).toBe("function");
  });
});
