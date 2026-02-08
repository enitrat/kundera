import { Effect } from "effect";
import { JsonRpc, Primitives } from "@kundera-sn/kundera-effect";
import { toPrettyJson } from "../utils.js";

export const tx = (hash: string) =>
  Effect.gen(function* () {
    const txHash = yield* Primitives.decodeFelt252(hash);
    const result = yield* JsonRpc.getTransactionByHash(txHash);
    console.log(toPrettyJson(result));
  });

export const txStatus = (hash: string) =>
  Effect.gen(function* () {
    const txHash = yield* Primitives.decodeFelt252(hash);
    const result = yield* JsonRpc.getTransactionStatus(txHash);
    console.log(toPrettyJson(result));
  });

export const txReceipt = (hash: string) =>
  Effect.gen(function* () {
    const txHash = yield* Primitives.decodeFelt252(hash);
    const result = yield* JsonRpc.getTransactionReceipt(txHash);
    console.log(toPrettyJson(result));
  });
