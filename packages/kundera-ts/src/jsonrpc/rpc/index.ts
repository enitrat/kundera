/**
 * RPC Codec — fromRpc / toRpc converters
 *
 * Convert between wire-format RPC types (hex strings) and branded kundera primitives.
 *
 * @module rpc/codec
 */

// Helpers
export {
  hexToFelt,
  hexToAddress,
  hexToClassHash,
  hexToFelts,
  feltToHex,
  addressToHex,
  classHashToHex,
  feltsToHex,
  resourcePriceFromRpc,
  resourcePriceToRpc,
  resourceBoundsFromRpc,
  resourceBoundsToRpc,
  resourceBoundsMappingFromRpc,
  resourceBoundsMappingToRpc,
  feePaymentFromRpc,
  feePaymentToRpc,
} from './helpers.js';

// Block Header
export {
  blockHeaderFromRpc,
  blockHeaderToRpc,
  blockHeaderWithCommitmentsFromRpc,
  blockHeaderWithCommitmentsToRpc,
} from './blockHeader.js';

// Block
export {
  blockWithTxHashesFromRpc,
  blockWithTxHashesToRpc,
  blockWithTxsFromRpc,
  blockWithTxsToRpc,
  blockWithReceiptsFromRpc,
  blockWithReceiptsToRpc,
} from './block.js';

// Transaction
export {
  transactionFromRpc,
  transactionToRpc,
  txnFromRpc,
  txnToRpc,
} from './transaction.js';

// Receipt
export {
  receiptFromRpc,
  receiptToRpc,
  receiptWithBlockInfoFromRpc,
  receiptWithBlockInfoToRpc,
  msgToL1FromRpc,
  msgToL1ToRpc,
} from './receipt.js';

// Event
export {
  eventFromRpc,
  eventToRpc,
  emittedEventFromRpc,
  emittedEventToRpc,
} from './event.js';

// State Update
export {
  stateUpdateFromRpc,
  stateUpdateToRpc,
  stateDiffFromRpc,
  stateDiffToRpc,
} from './stateUpdate.js';

// Fee Estimate
export {
  feeEstimateFromRpc,
  feeEstimateToRpc,
} from './feeEstimate.js';

// Trace
export {
  functionInvocationFromRpc,
  functionInvocationToRpc,
  revertibleFunctionInvocationFromRpc,
  revertibleFunctionInvocationToRpc,
  transactionTraceFromRpc,
  transactionTraceToRpc,
  orderedEventFromRpc,
  orderedEventToRpc,
  orderedMessageFromRpc,
  orderedMessageToRpc,
} from './trace.js';
