import { blockHeaderWithCommitmentsToRpc } from "../BlockHeader/toRpc.js";
import { transactionToRpc, txnToRpc } from "../Transaction/toRpc.js";
import { receiptToRpc } from "../Receipt/toRpc.js";

/**
 * @param {import('./types.js').BlockWithTxHashesType} block
 * @returns {import('../../jsonrpc/types.js').BlockWithTxHashes}
 */
export function blockWithTxHashesToRpc(block) {
	return {
		...blockHeaderWithCommitmentsToRpc(block),
		status: block.status,
		transactions: block.transactions.map((t) => t.toHex()),
	};
}

/**
 * @param {import('./types.js').BlockWithTxsType} block
 * @returns {import('../../jsonrpc/types.js').BlockWithTxs}
 */
export function blockWithTxsToRpc(block) {
	return {
		...blockHeaderWithCommitmentsToRpc(block),
		status: block.status,
		transactions: block.transactions.map(transactionToRpc),
	};
}

/**
 * @param {import('./types.js').BlockWithReceiptsType} block
 * @returns {import('../../jsonrpc/types.js').BlockWithReceipts}
 */
export function blockWithReceiptsToRpc(block) {
	return {
		...blockHeaderWithCommitmentsToRpc(block),
		status: block.status,
		transactions: block.transactions.map((tr) => ({
			transaction: txnToRpc(tr.transaction),
			receipt: receiptToRpc(tr.receipt),
		})),
	};
}
