import { Effect } from "effect";
import { Primitives, Services } from "@kundera-sn/kundera-effect";
import { ContractAddress } from "@kundera-sn/kundera-ts";
import { ERC20_ABI, TOKENS } from "../config.js";
import { formatTokenAmount } from "../utils.js";

export const balance = (address: string, token: string) =>
  Effect.gen(function* () {
    const key = token.toUpperCase();
    if (key !== "ETH" && key !== "STRK") {
      return yield* Effect.fail(
        new Error(`Unknown token: ${token}. Available: ETH, STRK`),
      );
    }

    const tokenAddress = ContractAddress(TOKENS[key]);
    const accountAddress = yield* Primitives.decodeContractAddress(address);
    const rawBalance = yield* Services.readContract({
      contractAddress: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [accountAddress],
    });

    console.log(`${formatTokenAmount(rawBalance, 18)} ${key}`);
  }).pipe(Effect.provide(Services.ContractLive));
