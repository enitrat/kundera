import { describe, expect, it } from "vitest";
import { encodeCalldata, decodeOutput, getFunctionSelectorHex } from "../../src/abi/index";
import { ContractAddress } from "../../src/primitives/ContractAddress/ContractAddress";

const ERC20_ABI = [
  {
    type: "function",
    name: "balance_of",
    inputs: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;

describe("docs/skills/contract-read", () => {
  it("encodes calldata for a view function", () => {
    const address = ContractAddress("0xdead");
    const result = encodeCalldata(ERC20_ABI, "balance_of", [address]);

    expect(result.error).toBeNull();
    expect(result.result).toEqual([BigInt("0xdead")]);
  });

  it("decodes output from a view function — unwraps to scalar", () => {
    // u256 on-chain = (low, high)
    const outputFelts = [BigInt(500), BigInt(0)];
    const result = decodeOutput(ERC20_ABI, "balance_of", outputFelts);

    expect(result.error).toBeNull();
    expect(result.result).toBe(500n);
  });

  it("computes function selector", () => {
    const selector = getFunctionSelectorHex("balance_of");
    expect(typeof selector).toBe("string");
    expect(selector).toMatch(/^0x[0-9a-f]+$/);
  });
});
