/**
 * Starknet Primitives
 *
 * Core types for the Starknet ecosystem.
 * This file is a barrel that composes the per-primitive modules.
 */

import { ClassHash } from "./ClassHash/index.js";
import {
	ContractAddress,
	MAX_CONTRACT_ADDRESS,
} from "./ContractAddress/index.js";
import { Felt252 } from "./Felt252/index.js";
import { StorageKey } from "./StorageKey/index.js";

// Felt252
export type {
	Felt252Type,
	Felt252Input,
	FeltMethods,
} from "./Felt252/index.js";
export {
	FIELD_PRIME,
	MAX_SHORT_STRING_LENGTH,
	Felt252,
} from "./Felt252/index.js";

// ContractAddress
export type { ContractAddressType } from "./ContractAddress/index.js";
export {
	ContractAddress,
	MAX_CONTRACT_ADDRESS,
} from "./ContractAddress/index.js";

// ClassHash
export type { ClassHashType } from "./ClassHash/index.js";
export { ClassHash } from "./ClassHash/index.js";

// StorageKey
export type { StorageKeyType } from "./StorageKey/index.js";
export { StorageKey } from "./StorageKey/index.js";

// EthAddress
export type { EthAddressType } from "./EthAddress/index.js";
export { EthAddress, MAX_ETH_ADDRESS } from "./EthAddress/index.js";

// Unsigned Integers
export type { Uint8Type } from "./Uint8/index.js";
export { Uint8 } from "./Uint8/index.js";

export type { Uint16Type } from "./Uint16/index.js";
export { Uint16 } from "./Uint16/index.js";

export type { Uint32Type } from "./Uint32/index.js";
export { Uint32 } from "./Uint32/index.js";

export type { Uint64Type } from "./Uint64/index.js";
export { Uint64 } from "./Uint64/index.js";

export type { Uint128Type } from "./Uint128/index.js";
export { Uint128 } from "./Uint128/index.js";

export type { Uint256Type } from "./Uint256/index.js";
export { Uint256 } from "./Uint256/index.js";

// Signed Integers
export type { Int8Type, Int8Input } from "./Int8/index.js";
export { Int8 } from "./Int8/index.js";

export type { Int16Type, Int16Input } from "./Int16/index.js";
export { Int16 } from "./Int16/index.js";

export type { Int32Type, Int32Input } from "./Int32/index.js";
export { Int32 } from "./Int32/index.js";

export type { Int64Type, Int64Input } from "./Int64/index.js";
export { Int64 } from "./Int64/index.js";

export type { Int128Type, Int128Input } from "./Int128/index.js";
export { Int128 } from "./Int128/index.js";

// ShortString
export {
	encodeShortString,
	encodeShortStringHex,
	decodeShortString,
} from "./ShortString/index.js";

// ByteArray
export type {
	ByteArrayType,
	ByteArrayInput,
	ByteArrayData,
} from "./ByteArray/index.js";
export {
	ByteArray,
	BYTES_PER_WORD,
	BYTE_ARRAY_MAGIC,
} from "./ByteArray/index.js";

// Aliases for API ergonomics
export const Felt = Felt252;
export const Address = ContractAddress;
export const Class = ClassHash;
export const Storage = StorageKey;

// Compatibility constants
export const MAX_ADDRESS = MAX_CONTRACT_ADDRESS;

// Domain Primitives (RPC codec types)
// BlockHeader
export type {
	BlockHeaderType,
	BlockHeaderWithCommitmentsType,
	ResourcePriceType,
} from "./BlockHeader/index.js";
export {
	blockHeaderFromRpc,
	blockHeaderWithCommitmentsFromRpc,
	resourcePriceFromRpc,
} from "./BlockHeader/index.js";
export {
	blockHeaderToRpc,
	blockHeaderWithCommitmentsToRpc,
	resourcePriceToRpc,
} from "./BlockHeader/index.js";

// Block
export type {
	BlockWithTxHashesType,
	BlockWithTxsType,
	BlockWithReceiptsType,
	TxnWithReceiptType,
} from "./Block/index.js";
export {
	blockWithTxHashesFromRpc,
	blockWithTxsFromRpc,
	blockWithReceiptsFromRpc,
} from "./Block/index.js";
export {
	blockWithTxHashesToRpc,
	blockWithTxsToRpc,
	blockWithReceiptsToRpc,
} from "./Block/index.js";

// Transaction
export type {
	ResourceBoundsType,
	ResourceBoundsMappingType,
	InvokeTxnV0Type,
	InvokeTxnV1Type,
	InvokeTxnV3Type,
	InvokeTxnType,
	L1HandlerTxnType,
	DeclareTxnV0Type,
	DeclareTxnV1Type,
	DeclareTxnV2Type,
	DeclareTxnV3Type,
	DeclareTxnType,
	DeployAccountTxnV1Type,
	DeployAccountTxnV3Type,
	DeployAccountTxnType,
	TxnType,
	TxnWithHashType,
} from "./Transaction/index.js";
export {
	transactionFromRpc,
	txnFromRpc,
	resourceBoundsFromRpc,
	resourceBoundsMappingFromRpc,
} from "./Transaction/index.js";
export {
	transactionToRpc,
	txnToRpc,
	resourceBoundsToRpc,
	resourceBoundsMappingToRpc,
} from "./Transaction/index.js";

// Receipt
export type {
	FeePaymentType,
	MsgToL1Type,
	ExecutionResourcesType as ReceiptExecutionResourcesType,
	TxnReceiptCommonType,
	InvokeTxnReceiptType,
	L1HandlerTxnReceiptType,
	DeclareTxnReceiptType,
	DeployAccountTxnReceiptType,
	TxnReceiptType,
	TxnReceiptWithBlockInfoType,
} from "./Receipt/index.js";
export {
	receiptFromRpc,
	receiptWithBlockInfoFromRpc,
	feePaymentFromRpc,
	msgToL1FromRpc,
} from "./Receipt/index.js";
export {
	receiptToRpc,
	receiptWithBlockInfoToRpc,
	feePaymentToRpc,
	msgToL1ToRpc,
} from "./Receipt/index.js";

// Event
export type {
	EventType,
	EmittedEventType,
	EventsResponseType,
} from "./Event/index.js";
export { eventFromRpc, emittedEventFromRpc } from "./Event/index.js";
export { eventToRpc, emittedEventToRpc } from "./Event/index.js";

// StateUpdate
export type {
	StateUpdateType,
	StateDiffType,
	ContractStorageDiffItemType,
	DeployedContractItemType,
	DeclaredClassItemType,
	ReplacedClassItemType,
	NonceUpdateItemType,
} from "./StateUpdate/index.js";
export { stateUpdateFromRpc, stateDiffFromRpc } from "./StateUpdate/index.js";
export { stateUpdateToRpc, stateDiffToRpc } from "./StateUpdate/index.js";

// FeeEstimate
export type { FeeEstimateType } from "./FeeEstimate/index.js";
export { feeEstimateFromRpc } from "./FeeEstimate/index.js";
export { feeEstimateToRpc } from "./FeeEstimate/index.js";

// Trace
export type {
	ExecutionResourcesType as TraceExecutionResourcesType,
	InnerCallExecutionResourcesType,
	OrderedEventType,
	OrderedMessageType,
	FunctionInvocationType,
	RevertibleFunctionInvocationType,
	InvokeTxnTraceType,
	DeclareTxnTraceType,
	DeployAccountTxnTraceType,
	L1HandlerTxnTraceType,
	TransactionTraceType,
	BlockTransactionTraceType,
	SimulatedTransactionType,
} from "./Trace/index.js";
export {
	orderedEventFromRpc,
	orderedMessageFromRpc,
	functionInvocationFromRpc,
	revertibleFunctionInvocationFromRpc,
	transactionTraceFromRpc,
} from "./Trace/index.js";
export {
	orderedEventToRpc,
	orderedMessageToRpc,
	functionInvocationToRpc,
	revertibleFunctionInvocationToRpc,
	transactionTraceToRpc,
} from "./Trace/index.js";
