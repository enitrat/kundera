import { describe, expect, it, expectTypeOf } from "vitest";
import {
  encodeCalldata,
  decodeOutput,
  getFunctionSelectorHex,
  type FunctionArgs,
  type FunctionRet,
} from "../../src/abi/index";
import { getContract } from "./get-contract";
import { ContractAddress } from "../../src/primitives/ContractAddress/ContractAddress";
import { Uint256 } from "../../src/primitives/Uint256/index";
import type { ContractAddressType } from "../../src/primitives/ContractAddress/types";
import type { Uint256Type } from "../../src/primitives/Uint256/types";
import type { Transport } from "../../src/transport/types";

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

/** Helper to create a mock transport with a canned response */
function mockTransport(result: unknown): Transport {
  return {
    type: "http",
    request: async () => ({ jsonrpc: "2.0", id: 1, result }),
    requestBatch: async () => [],
  } as Transport;
}

describe("docs/skills/get-contract", () => {
  describe("ABI type inference", () => {
    it("infers ContractAddressType for ContractAddress inputs", () => {
      expectTypeOf<
        FunctionArgs<typeof ERC20_ABI, "balance_of">
      >().toEqualTypeOf<ContractAddressType>();
    });

    it("infers Uint256Type for u256 outputs", () => {
      expectTypeOf<
        FunctionRet<typeof ERC20_ABI, "balance_of">
      >().toEqualTypeOf<Uint256Type>();
    });

    it("infers boolean for bool outputs", () => {
      expectTypeOf<
        FunctionRet<typeof ERC20_ABI, "transfer">
      >().toEqualTypeOf<boolean>();
    });
  });

  describe("encodeCalldata with typed ABI", () => {
    it("encodes balance_of with ContractAddress arg", () => {
      const address = ContractAddress("0xdead");
      const result = encodeCalldata(ERC20_ABI, "balance_of", [address]);

      expect(result.error).toBeNull();
      expect(result.result).toEqual([BigInt("0xdead")]);
    });

    it("encodes transfer with two args", () => {
      const recipient = ContractAddress("0xbeef");
      const amount = Uint256.from(1000n);
      const result = encodeCalldata(ERC20_ABI, "transfer", [
        recipient,
        amount,
      ]);

      expect(result.error).toBeNull();
      expect(result.result).toBeDefined();
      // recipient (1 felt) + u256 (2 felts: low, high)
      expect(result.result!.length).toBe(3);
    });
  });

  describe("decodeOutput with typed ABI", () => {
    it("decodes u256 output from balance_of", () => {
      // u256 is (low, high) on-chain
      const outputFelts = [BigInt(1000), BigInt(0)];
      const result = decodeOutput(ERC20_ABI, "balance_of", outputFelts);

      expect(result.error).toBeNull();
      expect(result.result).toBeDefined();
    });
  });

  describe("getContract factory", () => {
    it("creates contract instance with correct shape", () => {
      const transport = mockTransport([]);

      const contract = getContract({
        abi: ERC20_ABI,
        address: "0x123",
        transport,
      });

      expect(contract.address).toBe("0x123");
      expect(contract.abi).toBe(ERC20_ABI);
      expect(typeof contract.read).toBe("function");
    });

    it("read returns a promise with ContractResult", async () => {
      // Simulate RPC returning u256 (low=42, high=0) as hex strings
      const transport = mockTransport(["0x2a", "0x0"]);

      const contract = getContract({
        abi: ERC20_ABI,
        address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        transport,
      });

      const result = await contract.read("balance_of", [
        ContractAddress("0x123"),
      ]);

      expect(result.error).toBeNull();
      expect(result.result).toBeDefined();
    });

    it("selector computation works", () => {
      const selector = getFunctionSelectorHex("balance_of");
      expect(selector).toMatch(/^0x[0-9a-f]+$/);
    });
  });
});
