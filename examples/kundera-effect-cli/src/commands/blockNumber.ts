import { Effect } from "effect";
import { JsonRpc } from "@kundera-sn/kundera-effect";

export const blockNumber = Effect.gen(function* () {
  const block = yield* JsonRpc.blockNumber();

  console.log(block);
});
