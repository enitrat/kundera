import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// FEEDBACK: BlockId type not exhaustively documented.
// Docs show 'latest', { block_number: N }, { block_hash: '0x...' }
// but don't say if 'pending' or 'finalized' are valid.
// Also, how to pass just a number from CLI to { block_number: N } is not covered.
function parseBlockId(
  input?: string,
): "latest" | "pending" | { block_number: number } | { block_hash: string } {
  if (!input || input === "latest") return "latest";
  if (input === "pending") return "pending";
  if (input.startsWith("0x")) return { block_hash: input };
  const num = parseInt(input, 10);
  if (!isNaN(num)) return { block_number: num };
  return "latest";
}

export async function block(
  provider: HttpProvider,
  blockIdStr?: string,
  full?: boolean,
): Promise<void> {
  const blockId = parseBlockId(blockIdStr);

  // Docs: GetBlockWithTxHashesRequest (lighter) vs GetBlockWithTxsRequest (full)
  // Source: jsonrpc.mdx
  if (full) {
    const result = await provider.request(
      Rpc.GetBlockWithTxsRequest(blockId),
    );
    console.log(JSON.stringify(result, null, 2));
  } else {
    const result = await provider.request(
      Rpc.GetBlockWithTxHashesRequest(blockId),
    );
    console.log(JSON.stringify(result, null, 2));
  }
}
