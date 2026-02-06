import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// Docs: Rpc.BlockNumberRequest() → number
// Source: quickstart.mdx, jsonrpc.mdx
export async function blockNumber(provider: HttpProvider): Promise<void> {
  const result = await provider.request(Rpc.BlockNumberRequest());
  console.log(result);
}
