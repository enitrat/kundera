import { Effect } from "effect";
import { JsonRpc, Primitives } from "@kundera-sn/kundera-effect";

export const nonce = (address: string) =>
  Effect.gen(function* () {
    const contractAddress = yield* Primitives.decodeContractAddress(address);
    const value = yield* JsonRpc.getNonce(contractAddress, "latest");

    console.log(BigInt(value).toString());
  });
