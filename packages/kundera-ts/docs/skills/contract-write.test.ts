import { describe, expect, it } from "vitest";
import { encodeCalldata, type AbiLike } from "../../src/abi/index";
import { ContractAddress } from "../../src/primitives/ContractAddress/ContractAddress";
import { Uint256 } from "../../src/primitives/Uint256/index";

const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      {
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
] as const;

describe("docs/skills/contract-write", () => {
  it("encodes calldata for a state-changing function", () => {
    const recipient = ContractAddress("0xbeef");
    const amount = Uint256.from(1000n);
    const result = encodeCalldata(ERC20_ABI, "transfer", [recipient, amount]);

    expect(result.error).toBeNull();
    expect(result.result).toBeDefined();
    expect(Array.isArray(result.result)).toBe(true);
    // recipient (1 felt) + u256 (2 felts: low, high)
    expect(result.result!.length).toBe(3);
    expect(result.result![0]).toBe(BigInt("0xbeef"));
  });

  it("returns error for unknown function", () => {
    // Use AbiLike to hit untyped overload (typed overload restricts fnName)
    const abi = ERC20_ABI as unknown as AbiLike;
    const result = encodeCalldata(abi, "nonexistent", []);
    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe("FUNCTION_NOT_FOUND");
  });
});
