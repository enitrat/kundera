/**
 * Starknet RPC Schema
 *
 * Default RPC schema combining all Starknet JSON-RPC methods.
 *
 * @module provider/schemas/StarknetRpcSchema
 */

import type {
	AddDeclareTransactionResult,
	AddDeployAccountTransactionResult,
	AddInvokeTransactionResult,
	BlockHashAndNumber,
	BlockId,
	BlockTransactionTrace,
	BlockWithReceipts,
	BlockWithTxHashes,
	BlockWithTxs,
	BroadcastedDeclareTxn,
	BroadcastedDeployAccountTxn,
	BroadcastedInvokeTxn,
	BroadcastedTxn,
	ContractClass,
	EventsFilter,
	EventsResponse,
	EventsSubscriptionParams,
	FeeEstimate,
	FunctionCall,
	MessageFeeEstimate,
	MessagesStatusResponse,
	MsgFromL1,
	NewHeadsSubscriptionParams,
	PendingTransactionsSubscriptionParams,
	PreConfirmedBlockWithReceipts,
	PreConfirmedBlockWithTxHashes,
	PreConfirmedBlockWithTxs,
	PreConfirmedStateUpdate,
	SimulatedTransaction,
	SimulationFlag,
	StateUpdate,
	StorageProof,
	SyncingStatus,
	TransactionReceiptsSubscriptionParams,
	TransactionStatus,
	TransactionTrace,
	TxnReceiptWithBlockInfo,
	TxnWithHash,
} from "../../jsonrpc/types.js";

export type StarknetRpcSchema = readonly [
	{
		Method: "starknet_specVersion";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "starknet_getBlockWithTxHashes";
		Parameters: [BlockId];
		ReturnType: BlockWithTxHashes | PreConfirmedBlockWithTxHashes;
	},
	{
		Method: "starknet_getBlockWithTxs";
		Parameters: [BlockId];
		ReturnType: BlockWithTxs | PreConfirmedBlockWithTxs;
	},
	{
		Method: "starknet_getBlockWithReceipts";
		Parameters: [BlockId];
		ReturnType: BlockWithReceipts | PreConfirmedBlockWithReceipts;
	},
	{
		Method: "starknet_getStateUpdate";
		Parameters: [BlockId];
		ReturnType: StateUpdate | PreConfirmedStateUpdate;
	},
	{
		Method: "starknet_getStorageAt";
		Parameters: [string, string, BlockId];
		ReturnType: string;
	},
	{
		Method: "starknet_getTransactionStatus";
		Parameters: [string];
		ReturnType: TransactionStatus;
	},
	{
		Method: "starknet_getMessagesStatus";
		Parameters: [string];
		ReturnType: MessagesStatusResponse;
	},
	{
		Method: "starknet_getTransactionByHash";
		Parameters: [string];
		ReturnType: TxnWithHash;
	},
	{
		Method: "starknet_getTransactionByBlockIdAndIndex";
		Parameters: [BlockId, number];
		ReturnType: TxnWithHash;
	},
	{
		Method: "starknet_getTransactionReceipt";
		Parameters: [string];
		ReturnType: TxnReceiptWithBlockInfo;
	},
	{
		Method: "starknet_getClass";
		Parameters: [BlockId, string];
		ReturnType: ContractClass;
	},
	{
		Method: "starknet_getClassHashAt";
		Parameters: [BlockId, string];
		ReturnType: string;
	},
	{
		Method: "starknet_getClassAt";
		Parameters: [BlockId, string];
		ReturnType: ContractClass;
	},
	{
		Method: "starknet_getBlockTransactionCount";
		Parameters: [BlockId];
		ReturnType: number;
	},
	{
		Method: "starknet_call";
		Parameters: [FunctionCall, BlockId];
		ReturnType: string[];
	},
	{
		Method: "starknet_estimateFee";
		Parameters: [BroadcastedTxn[], SimulationFlag[], BlockId];
		ReturnType: FeeEstimate[];
	},
	{
		Method: "starknet_estimateMessageFee";
		Parameters: [MsgFromL1, BlockId];
		ReturnType: MessageFeeEstimate;
	},
	{
		Method: "starknet_blockNumber";
		Parameters: [];
		ReturnType: number;
	},
	{
		Method: "starknet_blockHashAndNumber";
		Parameters: [];
		ReturnType: BlockHashAndNumber;
	},
	{
		Method: "starknet_chainId";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "starknet_syncing";
		Parameters: [];
		ReturnType: SyncingStatus;
	},
	{
		Method: "starknet_getEvents";
		Parameters: [EventsFilter];
		ReturnType: EventsResponse;
	},
	{
		Method: "starknet_getNonce";
		Parameters: [BlockId, string];
		ReturnType: string;
	},
	{
		Method: "starknet_getStorageProof";
		Parameters: [
			BlockId,
			string[],
			string[],
			{ contract_address: string; storage_keys: string[] }[],
		];
		ReturnType: StorageProof;
	},
	{
		Method: "starknet_addInvokeTransaction";
		Parameters: [BroadcastedInvokeTxn];
		ReturnType: AddInvokeTransactionResult;
	},
	{
		Method: "starknet_addDeclareTransaction";
		Parameters: [BroadcastedDeclareTxn];
		ReturnType: AddDeclareTransactionResult;
	},
	{
		Method: "starknet_addDeployAccountTransaction";
		Parameters: [BroadcastedDeployAccountTxn];
		ReturnType: AddDeployAccountTransactionResult;
	},
	{
		Method: "starknet_traceTransaction";
		Parameters: [string];
		ReturnType: TransactionTrace;
	},
	{
		Method: "starknet_simulateTransactions";
		Parameters: [BlockId, BroadcastedTxn[], SimulationFlag[]];
		ReturnType: SimulatedTransaction[];
	},
	{
		Method: "starknet_traceBlockTransactions";
		Parameters: [BlockId];
		ReturnType: BlockTransactionTrace[];
	},
	{
		Method: "starknet_subscribeNewHeads";
		Parameters: [NewHeadsSubscriptionParams?];
		ReturnType: string;
	},
	{
		Method: "starknet_subscribeEvents";
		Parameters: [EventsSubscriptionParams?];
		ReturnType: string;
	},
	{
		Method: "starknet_subscribeTransactionStatus";
		Parameters: [string];
		ReturnType: string;
	},
	{
		Method: "starknet_subscribeNewTransactionReceipts";
		Parameters: [TransactionReceiptsSubscriptionParams?];
		ReturnType: string;
	},
	{
		Method: "starknet_subscribeNewTransactions";
		Parameters: [PendingTransactionsSubscriptionParams?];
		ReturnType: string;
	},
	{
		Method: "starknet_unsubscribe";
		Parameters: [string];
		ReturnType: boolean;
	},
];
