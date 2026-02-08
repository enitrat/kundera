import { Effect } from "effect";
import { JsonRpc } from "@kundera-sn/kundera-effect";

export const blockHash = Effect.gen(function* () {
  const result = yield* JsonRpc.blockHashAndNumber();

  console.log(`Block #${result.block_number}`);
  console.log(`Hash:  ${result.block_hash}`);
});
