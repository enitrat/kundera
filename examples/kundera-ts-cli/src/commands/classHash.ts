import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// Docs: Rpc.GetClassHashAtRequest(blockId, address) → hex string
// Source: jsonrpc.mdx
export async function classHash(
  provider: HttpProvider,
  address: string,
): Promise<void> {
  const result = await provider.request(
    Rpc.GetClassHashAtRequest("latest", address),
  );
  console.log(result);
}
