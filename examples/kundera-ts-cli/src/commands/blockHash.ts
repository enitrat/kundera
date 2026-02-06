import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// Docs: Rpc.BlockHashAndNumberRequest() → { block_hash, block_number }
// Source: jsonrpc.mdx
export async function blockHash(provider: HttpProvider): Promise<void> {
  const result = await provider.request(Rpc.BlockHashAndNumberRequest());
  console.log(`Block #${result.block_number}`);
  console.log(`Hash:  ${result.block_hash}`);
}
