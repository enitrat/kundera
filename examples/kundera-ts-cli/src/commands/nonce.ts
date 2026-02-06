import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// Docs: Rpc.GetNonceRequest(blockId, address) → hex string
// FEEDBACK: Param order is (blockId, address) — different from GetStorageAtRequest
// which is (address, key, blockId). Inconsistent ordering across builders is confusing.
// The jsonrpc.mdx doc shows examples but doesn't have a param signature table.
export async function nonce(
  provider: HttpProvider,
  address: string,
): Promise<void> {
  const result = await provider.request(
    Rpc.GetNonceRequest("latest", address),
  );
  console.log(BigInt(result).toString());
}
