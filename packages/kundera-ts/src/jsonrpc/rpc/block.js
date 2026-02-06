import { hexToFelts, feltsToHex } from './helpers.js';
import {
  blockHeaderWithCommitmentsFromRpc,
  blockHeaderWithCommitmentsToRpc,
} from './blockHeader.js';
import { transactionFromRpc, transactionToRpc, txnFromRpc, txnToRpc } from './transaction.js';
import { receiptFromRpc, receiptToRpc } from './receipt.js';

/**
 * @param {import('../types.js').BlockWithTxHashes} rpc
 * @returns {import('../rich.js').RichBlockWithTxHashes}
 */
export function blockWithTxHashesFromRpc(rpc) {
  return {
    ...blockHeaderWithCommitmentsFromRpc(rpc),
    status: rpc.status,
    transactions: hexToFelts(rpc.transactions),
  };
}

/**
 * @param {import('../rich.js').RichBlockWithTxHashes} rich
 * @returns {import('../types.js').BlockWithTxHashes}
 */
export function blockWithTxHashesToRpc(rich) {
  return {
    ...blockHeaderWithCommitmentsToRpc(rich),
    status: rich.status,
    transactions: feltsToHex(rich.transactions),
  };
}

/**
 * @param {import('../types.js').BlockWithTxs} rpc
 * @returns {import('../rich.js').RichBlockWithTxs}
 */
export function blockWithTxsFromRpc(rpc) {
  return {
    ...blockHeaderWithCommitmentsFromRpc(rpc),
    status: rpc.status,
    transactions: rpc.transactions.map(transactionFromRpc),
  };
}

/**
 * @param {import('../rich.js').RichBlockWithTxs} rich
 * @returns {import('../types.js').BlockWithTxs}
 */
export function blockWithTxsToRpc(rich) {
  return {
    ...blockHeaderWithCommitmentsToRpc(rich),
    status: rich.status,
    transactions: rich.transactions.map(transactionToRpc),
  };
}

/**
 * @param {import('../types.js').BlockWithReceipts} rpc
 * @returns {import('../rich.js').RichBlockWithReceipts}
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

/**
 * @param {import('../rich.js').RichBlockWithReceipts} rich
 * @returns {import('../types.js').BlockWithReceipts}
 */
export function blockWithReceiptsToRpc(rich) {
  return {
    ...blockHeaderWithCommitmentsToRpc(rich),
    status: rich.status,
    transactions: rich.transactions.map((tr) => ({
      transaction: txnToRpc(tr.transaction),
      receipt: receiptToRpc(tr.receipt),
    })),
  };
}
