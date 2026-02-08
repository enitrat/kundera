import { Effect } from "effect";
import { JsonRpc, Primitives } from "@kundera-sn/kundera-effect";

export const classHash = (address: string) =>
  Effect.gen(function* () {
    const contractAddress = yield* Primitives.decodeContractAddress(address);
    const result = yield* JsonRpc.getClassHashAt("latest", contractAddress);

    console.log(result);
  });
