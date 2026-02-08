import { Effect } from "effect";
import { JsonRpc } from "@kundera-sn/kundera-effect";
import type { BlockId } from "@kundera-sn/kundera-ts/jsonrpc";
import { toPrettyJson } from "../utils.js";

const parseBlockId = (input?: string): Effect.Effect<BlockId, Error> => {
  if (!input || input === "latest") return Effect.succeed("latest");
  if (input === "pending") return Effect.succeed("pending");
  if (input.startsWith("0x")) return Effect.succeed({ block_hash: input });

  const n = Number.parseInt(input, 10);
  if (!Number.isNaN(n) && n >= 0) return Effect.succeed({ block_number: n });

  return Effect.fail(
    new Error(
      `Invalid block id: ${input}. Use latest, pending, a block number, or a 0x block hash.`,
    ),
  );
};

export const block = (blockIdInput?: string, full?: boolean) =>
  Effect.gen(function* () {
    const blockId = yield* parseBlockId(blockIdInput);
    const result = full
      ? yield* JsonRpc.getBlockWithTxs(blockId)
      : yield* JsonRpc.getBlockWithTxHashes(blockId);

    console.log(toPrettyJson(result));
  });
