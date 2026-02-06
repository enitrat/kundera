import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import { computeSelectorHex } from "@kundera-sn/kundera-ts/abi";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";
import { TOKENS } from "../config.js";

// FEEDBACK: The quickstart hardcodes the balanceOf selector as a hex literal.
// Had to dig into ABI API doc to find computeSelectorHex for computing it.
// A "How to call a contract" recipe that computes selectors would help.
//
// FEEDBACK: Docs say Rpc.CallRequest takes (functionCall, blockId).
// FunctionCall shape is { contract_address, entry_point_selector, calldata }.
// This is shown in quickstart but param names aren't in the jsonrpc method table.
//
// FEEDBACK: Call result is string[] (hex strings). Docs show BigInt(result[0])
// for manual parsing. No doc mentions using deserializeU256 from serde on call results.
// The serde doc assumes bigint inputs, but call returns hex strings.

export async function balance(
  provider: HttpProvider,
  address: string,
  token: string,
): Promise<void> {
  const tokenKey = token.toUpperCase();
  const tokenAddress = TOKENS[tokenKey];
  if (!tokenAddress) {
    console.error(`Unknown token: ${token}. Available: ${Object.keys(TOKENS).join(", ")}`);
    process.exit(1);
  }

  const balanceOfSelector = computeSelectorHex("balanceOf");

  const result = await provider.request(
    Rpc.CallRequest(
      {
        contract_address: tokenAddress,
        entry_point_selector: balanceOfSelector,
        calldata: [address],
      },
      "latest",
    ),
  );

  // u256 = [low, high] — manual parsing as shown in quickstart
  const low = BigInt(result[0]);
  const high = BigInt(result[1]);
  const rawBalance = low + (high << 128n);

  // Both ETH and STRK use 18 decimals
  const decimals = 18;
  const divisor = 10n ** BigInt(decimals);
  const whole = rawBalance / divisor;
  const frac = rawBalance % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 6);

  console.log(`${whole}.${fracStr} ${tokenKey}`);
}
