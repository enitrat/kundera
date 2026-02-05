import { describe, expect, it } from "vitest";
import * as Abi from "../../src/abi/index";
import { getContract } from "./get-contract";

describe("docs/skills/get-contract", () => {
  it("exposes type utilities for typed contracts", () => {
    // Core type utilities are re-exported
    expect(typeof Abi.encodeCalldata).toBe("function");
    expect(typeof Abi.decodeOutput).toBe("function");
    expect(typeof Abi.getFunctionSelectorHex).toBe("function");
  });

  it("exports getContract factory", () => {
    expect(typeof getContract).toBe("function");
  });

  it("creates contract instance with typed interface", () => {
    const ERC20_ABI = [
      {
        type: "function",
        name: "balance_of",
        inputs: [{ name: "account", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
    ] as const;

    // Mock transport
    const mockTransport = { request: async () => [] } as any;

    const contract = getContract({
      abi: ERC20_ABI,
      address: "0x123",
      transport: mockTransport,
    });

    expect(contract.address).toBe("0x123");
    expect(contract.abi).toBe(ERC20_ABI);
    expect(typeof contract.read).toBe("function");
  });
});
