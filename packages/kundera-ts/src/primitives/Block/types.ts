import type { Felt252Type } from "../Felt252/types.js";
import type { BlockHeaderWithCommitmentsType } from "../BlockHeader/types.js";
import type { TxnWithHashType, TxnType } from "../Transaction/types.js";
import type { TxnReceiptType } from "../Receipt/types.js";
import type { BlockStatus } from "../../jsonrpc/types.js";

export interface BlockWithTxHashesType extends BlockHeaderWithCommitmentsType {
	status: BlockStatus;
	transactions: Felt252Type[];
}

export interface BlockWithTxsType extends BlockHeaderWithCommitmentsType {
	status: BlockStatus;
	transactions: TxnWithHashType[];
}

export interface TxnWithReceiptType {
	transaction: TxnType;
	receipt: TxnReceiptType;
}

export interface BlockWithReceiptsType extends BlockHeaderWithCommitmentsType {
	status: BlockStatus;
	transactions: TxnWithReceiptType[];
}
