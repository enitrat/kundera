import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import { decodeShortString } from "@kundera-sn/kundera-ts";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// Docs: Rpc.ChainIdRequest() → string (hex-encoded short string)
// FEEDBACK: No doc mentions that chainId returns a hex-encoded short string
// that needs decodeShortString to get "SN_MAIN" / "SN_SEPOLIA".
// Had to infer this from Starknet protocol knowledge.
export async function chainId(provider: HttpProvider): Promise<void> {
  const result = await provider.request(Rpc.ChainIdRequest());
  // Decode the hex short string to human-readable
  const decoded = decodeShortString(result);
  console.log(`${decoded} (${result})`);
}
