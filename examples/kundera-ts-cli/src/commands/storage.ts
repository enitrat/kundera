import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// Docs: Rpc.GetStorageAtRequest(address, key, blockId) → hex string
// FEEDBACK: Param order here is (address, key, blockId) — different from
// GetNonceRequest which is (blockId, address). No consistent pattern.
// Only way to know is to read examples in jsonrpc.mdx carefully.
export async function storage(
  provider: HttpProvider,
  address: string,
  key: string,
): Promise<void> {
  const result = await provider.request(
    Rpc.GetStorageAtRequest(address, key, "latest"),
  );
  console.log(result);
}
