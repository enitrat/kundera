import { Effect } from "effect";
import { JsonRpc } from "@kundera-sn/kundera-effect";
import { decodeChainIdHex } from "../utils.js";

export const chainId = Effect.gen(function* () {
  const chainIdHex = yield* JsonRpc.chainId();

  const decoded = decodeChainIdHex(chainIdHex);
  if (decoded) {
    console.log(`${decoded} (${chainIdHex})`);
    return;
  }
  console.log(chainIdHex);
});
