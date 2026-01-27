/**
 * Starknet RPC Schema
 *
 * Complete type definitions for all Starknet JSON-RPC methods.
 * Based on Starknet OpenRPC spec v0.10.0.
 *
 * @module provider/StarknetRpcSchema
 */

import type { RpcSchema } from './RpcSchema.js';
import type {
  BlockId,
  BlockTransactionTrace,
  BlockWithReceipts,
  BlockWithTxHashes,
  BlockWithTxs,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  BroadcastedInvokeTxn,
  BroadcastedTxn,
  ContractClassResponse,
  EmittedEvent,
  EventsResponse,
  FeeEstimate,
  FunctionCall,
  MessageFeeEstimate,
  MessagesStatusResponse,
  MsgFromL1,
  PreConfirmedBlockWithReceipts,
  PreConfirmedBlockWithTxHashes,
  PreConfirmedBlockWithTxs,
  PreConfirmedStateUpdate,
  SimulatedTransaction,
  SimulationFlag,
  StateUpdate,
  StorageProof,
  SyncingStatus,
  TransactionStatus,
  TransactionTrace,
  TxnReceiptWithBlockInfo,
  TxnWithHash,
} from './types.js';

/**
 * Starknet RPC Schema defining all method types
 *
 * This schema enables compile-time type checking for RPC calls
 * when used with TypedProvider.
 */
export type StarknetRpcSchema = [
  // ============================================================================
  // Read Methods (starknet_api_openrpc.json)
  // ============================================================================

  {
    Method: 'starknet_specVersion';
    Parameters: [];
    ReturnType: string;
  },
  {
    Method: 'starknet_getBlockWithTxHashes';
    Parameters: [blockId: BlockId];
    ReturnType: BlockWithTxHashes | PreConfirmedBlockWithTxHashes;
  },
  {
    Method: 'starknet_getBlockWithTxs';
    Parameters: [blockId: BlockId];
    ReturnType: BlockWithTxs | PreConfirmedBlockWithTxs;
  },
  {
    Method: 'starknet_getBlockWithReceipts';
    Parameters: [blockId: BlockId];
    ReturnType: BlockWithReceipts | PreConfirmedBlockWithReceipts;
  },
  {
    Method: 'starknet_getStateUpdate';
    Parameters: [blockId: BlockId];
    ReturnType: StateUpdate | PreConfirmedStateUpdate;
  },
  {
    Method: 'starknet_getStorageAt';
    Parameters: [contractAddress: string, key: string, blockId: BlockId];
    ReturnType: string;
  },
  {
    Method: 'starknet_getTransactionStatus';
    Parameters: [transactionHash: string];
    ReturnType: TransactionStatus;
  },
  {
    Method: 'starknet_getMessagesStatus';
    Parameters: [l1TransactionHash: string];
    ReturnType: MessagesStatusResponse;
  },
  {
    Method: 'starknet_getTransactionByHash';
    Parameters: [transactionHash: string];
    ReturnType: TxnWithHash;
  },
  {
    Method: 'starknet_getTransactionByBlockIdAndIndex';
    Parameters: [blockId: BlockId, index: number];
    ReturnType: TxnWithHash;
  },
  {
    Method: 'starknet_getTransactionReceipt';
    Parameters: [transactionHash: string];
    ReturnType: TxnReceiptWithBlockInfo;
  },
  {
    Method: 'starknet_getClass';
    Parameters: [blockId: BlockId, classHash: string];
    ReturnType: ContractClassResponse;
  },
  {
    Method: 'starknet_getClassHashAt';
    Parameters: [blockId: BlockId, contractAddress: string];
    ReturnType: string;
  },
  {
    Method: 'starknet_getClassAt';
    Parameters: [blockId: BlockId, contractAddress: string];
    ReturnType: ContractClassResponse;
  },
  {
    Method: 'starknet_getBlockTransactionCount';
    Parameters: [blockId: BlockId];
    ReturnType: number;
  },
  {
    Method: 'starknet_call';
    Parameters: [request: FunctionCall, blockId: BlockId];
    ReturnType: string[];
  },
  {
    Method: 'starknet_estimateFee';
    Parameters: [
      request: BroadcastedTxn[],
      simulationFlags: SimulationFlag[],
      blockId: BlockId,
    ];
    ReturnType: FeeEstimate[];
  },
  {
    Method: 'starknet_estimateMessageFee';
    Parameters: [message: MsgFromL1, blockId: BlockId];
    ReturnType: MessageFeeEstimate;
  },
  {
    Method: 'starknet_blockNumber';
    Parameters: [];
    ReturnType: number;
  },
  {
    Method: 'starknet_blockHashAndNumber';
    Parameters: [];
    ReturnType: { block_hash: string; block_number: number };
  },
  {
    Method: 'starknet_chainId';
    Parameters: [];
    ReturnType: string;
  },
  {
    Method: 'starknet_syncing';
    Parameters: [];
    ReturnType: SyncingStatus;
  },
  {
    Method: 'starknet_getEvents';
    Parameters: [
      filter: {
        from_block?: BlockId;
        to_block?: BlockId;
        address?: string;
        keys?: string[][];
        continuation_token?: string;
        chunk_size: number;
      },
    ];
    ReturnType: EventsResponse;
  },
  {
    Method: 'starknet_getNonce';
    Parameters: [blockId: BlockId, contractAddress: string];
    ReturnType: string;
  },
  {
    Method: 'starknet_getStorageProof';
    Parameters: [
      blockId: BlockId,
      classHashes: string[],
      contractAddresses: string[],
      contractStorageKeys: {
        contract_address: string;
        storage_keys: string[];
      }[],
    ];
    ReturnType: StorageProof;
  },

  // ============================================================================
  // Write Methods (starknet_write_api.json)
  // ============================================================================

  {
    Method: 'starknet_addInvokeTransaction';
    Parameters: [invokeTransaction: BroadcastedInvokeTxn];
    ReturnType: { transaction_hash: string };
  },
  {
    Method: 'starknet_addDeclareTransaction';
    Parameters: [declareTransaction: BroadcastedDeclareTxn];
    ReturnType: { transaction_hash: string; class_hash: string };
  },
  {
    Method: 'starknet_addDeployAccountTransaction';
    Parameters: [deployAccountTransaction: BroadcastedDeployAccountTxn];
    ReturnType: { transaction_hash: string; contract_address: string };
  },

  // ============================================================================
  // Trace Methods (starknet_trace_api_openrpc.json)
  // ============================================================================

  {
    Method: 'starknet_traceTransaction';
    Parameters: [transactionHash: string];
    ReturnType: TransactionTrace;
  },
  {
    Method: 'starknet_simulateTransactions';
    Parameters: [
      blockId: BlockId,
      transactions: BroadcastedTxn[],
      simulationFlags: SimulationFlag[],
    ];
    ReturnType: SimulatedTransaction[];
  },
  {
    Method: 'starknet_traceBlockTransactions';
    Parameters: [blockId: BlockId];
    ReturnType: BlockTransactionTrace[];
  },

  // ============================================================================
  // WebSocket Methods (starknet_ws_api.json)
  // Positional params per Starknet spec
  // TXN_STATUS_WITHOUT_L1 = RECEIVED | CANDIDATE | PRE_CONFIRMED | ACCEPTED_ON_L2
  // ============================================================================

  {
    Method: 'starknet_subscribeNewHeads';
    // Positional: block_id?
    Parameters: [] | [blockId: BlockId];
    ReturnType: string; // subscription ID
  },
  {
    Method: 'starknet_subscribeEvents';
    // Positional: from_address?, keys?, block_id?, finality_status?
    Parameters:
      | []
      | [fromAddress: string | null]
      | [fromAddress: string | null, keys: string[][] | null]
      | [fromAddress: string | null, keys: string[][] | null, blockId: BlockId | null]
      | [
          fromAddress: string | null,
          keys: string[][] | null,
          blockId: BlockId | null,
          finalityStatus:
            | 'RECEIVED'
            | 'CANDIDATE'
            | 'PRE_CONFIRMED'
            | 'ACCEPTED_ON_L2',
        ];
    ReturnType: string;
  },
  {
    Method: 'starknet_subscribeTransactionStatus';
    // Positional: transaction_hash
    Parameters: [transactionHash: string];
    ReturnType: string;
  },
  {
    Method: 'starknet_subscribeNewTransactionReceipts';
    // Positional: finality_status?, sender_address?
    // Allowed finality: PRE_CONFIRMED | ACCEPTED_ON_L2 only
    Parameters:
      | []
      | [finalityStatus: 'PRE_CONFIRMED' | 'ACCEPTED_ON_L2' | null]
      | [
          finalityStatus: 'PRE_CONFIRMED' | 'ACCEPTED_ON_L2' | null,
          senderAddress: string[],
        ];
    ReturnType: string;
  },
  {
    Method: 'starknet_subscribeNewTransactions';
    // Positional: finality_status?, sender_address?
    Parameters:
      | []
      | [
          finalityStatus:
            | 'RECEIVED'
            | 'CANDIDATE'
            | 'PRE_CONFIRMED'
            | 'ACCEPTED_ON_L2'
            | null,
        ]
      | [
          finalityStatus:
            | 'RECEIVED'
            | 'CANDIDATE'
            | 'PRE_CONFIRMED'
            | 'ACCEPTED_ON_L2'
            | null,
          senderAddress: string[],
        ];
    ReturnType: string;
  },
  {
    Method: 'starknet_unsubscribe';
    Parameters: [subscriptionId: string];
    ReturnType: boolean;
  },
];

/**
 * Type-safe assertion that StarknetRpcSchema satisfies RpcSchema
 */
const _: RpcSchema = [] as unknown as StarknetRpcSchema;
