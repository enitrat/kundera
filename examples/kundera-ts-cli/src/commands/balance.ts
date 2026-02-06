import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import {
  computeSelectorHex,
  encodeCalldata,
  decodeOutput,
} from "@kundera-sn/kundera-ts/abi";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";
import { TOKENS } from "../config.js";
import { ContractAddress } from "@kundera-sn/kundera-ts/ContractAddress";

// Minimal ERC-20 ABI for balanceOf
const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
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

export async function balance(
  provider: HttpProvider,
  address: string,
  token: string,
): Promise<void> {
  const tokenKey = token.toUpperCase();
  const tokenAddress = TOKENS[tokenKey];
  if (!tokenAddress) {
    console.error(
      `Unknown token: ${token}. Available: ${Object.keys(TOKENS).join(", ")}`,
    );
    process.exit(1);
  }

  // Encode calldata using ABI
  const encoded = encodeCalldata(ERC20_ABI, "balanceOf", [ContractAddress(address)]);
  if (encoded.error) throw encoded.error;

  const result = await provider.request(
    Rpc.CallRequest(
      {
        contract_address: tokenAddress,
        entry_point_selector: computeSelectorHex("balanceOf"),
        calldata: encoded.result!.map((v) => "0x" + v.toString(16)),
      },
      "latest",
    ),
  );

  // Decode output using ABI (handles u256 = [low, high] automatically)
  const decoded = decodeOutput(ERC20_ABI, "balanceOf", result.map(BigInt));
  if (decoded.error) throw decoded.error;

  const rawBalance = decoded.result

  // Both ETH and STRK use 18 decimals
  const decimals = 18;
  const divisor = 10n ** BigInt(decimals);
  const whole = rawBalance / divisor;
  const frac = rawBalance % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 6);

  console.log(`${whole}.${fracStr} ${tokenKey}`);
}
