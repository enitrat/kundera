import { Effect } from "effect";
import { JsonRpc, Primitives } from "@kundera-sn/kundera-effect";

export const storage = (address: string, key: string) =>
  Effect.gen(function* () {
    const contractAddress = yield* Primitives.decodeContractAddress(address);
    const storageKey = yield* Primitives.decodeStorageKey(key);
    const result = yield* JsonRpc.getStorageAt(contractAddress, storageKey, "latest");

    console.log(result);
  });
