/**
 * Account Module
 *
 * Starknet account abstraction for V3 transactions.
 * Based on starkware-libs/starknet-specs@v0.10.0
 *
 * @module account
 */

// ============ Types ============
export type {
  // Resource bounds
  ResourceBounds,
  ResourceBoundsMapping,
  DataAvailabilityMode,
  // V3 transactions
  V3TransactionCommon,
  InvokeTransactionV3,
  SignedInvokeTransactionV3,
  DeclareTransactionV3,
  SignedDeclareTransactionV3,
  DeployAccountTransactionV3,
  SignedDeployAccountTransactionV3,
  // Call
  Call,
  // Universal details
  UniversalDetails,
  // Payloads
  DeclarePayload,
  DeployAccountPayload,
  // Results
  ExecuteResult,
  DeclareResult,
  DeployAccountResult,
  // Fee
  FeeEstimate,
  // Typed data
  TypedDataDomain,
  TypedDataType,
  TypedData,
  // Signature
  SignatureArray,
} from './types.js';

// Constants
export {
  TRANSACTION_VERSION,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_HASH_PREFIX,
  signatureToArray,
} from './types.js';

// ============ Hash ============
export {
  // Hash computation
  computeInvokeV3Hash,
  computeDeclareV3Hash,
  computeDeployAccountV3Hash,
  // Helpers
  hashTipAndResourceBounds,
  hashResourceBounds,
  encodeDAModes,
  hashCalldata,
  computeContractAddress,
  computeSelector,
  EXECUTE_SELECTOR,
} from './hash.js';

// ============ Signer ============
export type { SignerInterface } from './Signer.js';
export { PrivateKeySigner, createSigner } from './Signer.js';

// ============ Account ============
export { Account, createAccount } from './Account.js';

// ============ WalletAccount ============
export type {
  StarknetWalletProvider,
  WalletRequest,
  WalletEventHandler,
} from './WalletAccount.js';
export {
  WalletAccount,
  WalletRequestType,
  createWalletAccount,
} from './WalletAccount.js';
