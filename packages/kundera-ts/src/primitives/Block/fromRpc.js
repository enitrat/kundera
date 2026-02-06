import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import { blockHeaderWithCommitmentsFromRpc } from "../BlockHeader/fromRpc.js";
import { transactionFromRpc, txnFromRpc } from "../Transaction/fromRpc.js";
import { receiptFromRpc } from "../Receipt/fromRpc.js";

/**
 * @param {import('../../jsonrpc/types.js').BlockWithTxHashes} rpc
 * @returns {import('./types.js').BlockWithTxHashesType}
 */
export function blockWithTxHashesFromRpc(rpc) {
	return {
		...blockHeaderWithCommitmentsFromRpc(rpc),
		status: rpc.status,
		transactions: rpc.transactions.map(feltFromHex),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').BlockWithTxs} rpc
 * @returns {import('./types.js').BlockWithTxsType}
 */
export function blockWithTxsFromRpc(rpc) {
	return {
		...blockHeaderWithCommitmentsFromRpc(rpc),
		status: rpc.status,
		transactions: rpc.transactions.map(transactionFromRpc),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').BlockWithReceipts} rpc
 * @returns {import('./types.js').BlockWithReceiptsType}
 */
export function blockWithReceiptsFromRpc(rpc) {
	return {
		...blockHeaderWithCommitmentsFromRpc(rpc),
		status: rpc.status,
		transactions: rpc.transactions.map((tr) => ({
			transaction: txnFromRpc(tr.transaction),
			receipt: receiptFromRpc(tr.receipt),
		})),
	};
}
