import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";
import type { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// Docs: Rpc.GetTransactionByHashRequest(hash) → TxnWithHash
// Source: jsonrpc.mdx
export async function tx(
  provider: HttpProvider,
  hash: string,
): Promise<void> {
  const result = await provider.request(
    Rpc.GetTransactionByHashRequest(hash),
  );
  console.log(JSON.stringify(result, null, 2));
}

// Docs: Rpc.GetTransactionStatusRequest(hash) → TransactionStatus
export async function txStatus(
  provider: HttpProvider,
  hash: string,
): Promise<void> {
  const result = await provider.request(
    Rpc.GetTransactionStatusRequest(hash),
  );
  console.log(JSON.stringify(result, null, 2));
}

// Docs: Rpc.GetTransactionReceiptRequest(hash) → TransactionReceipt
export async function txReceipt(
  provider: HttpProvider,
  hash: string,
): Promise<void> {
  const result = await provider.request(
    Rpc.GetTransactionReceiptRequest(hash),
  );
  console.log(JSON.stringify(result, null, 2));
}
