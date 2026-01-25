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
  FeeEstimate,
  FunctionCall,
  MessageFeeEstimate,
  SimulationFlag,
  SyncingStatus,
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
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getBlockWithTxs';
    Parameters: [blockId: BlockId];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getBlockWithReceipts';
    Parameters: [blockId: BlockId];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getStateUpdate';
    Parameters: [blockId: BlockId];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getStorageAt';
    Parameters: [contractAddress: string, key: string, blockId: BlockId];
    ReturnType: string;
  },
  {
    Method: 'starknet_getTransactionStatus';
    Parameters: [transactionHash: string];
    ReturnType: {
      finality_status: 'RECEIVED' | 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1';
      execution_status?: 'SUCCEEDED' | 'REVERTED';
    };
  },
  {
    Method: 'starknet_getMessagesStatus';
    Parameters: [l1TransactionHash: string];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getTransactionByHash';
    Parameters: [transactionHash: string];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getTransactionByBlockIdAndIndex';
    Parameters: [blockId: BlockId, index: number];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getTransactionReceipt';
    Parameters: [transactionHash: string];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getClass';
    Parameters: [blockId: BlockId, classHash: string];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_getClassHashAt';
    Parameters: [blockId: BlockId, contractAddress: string];
    ReturnType: string;
  },
  {
    Method: 'starknet_getClassAt';
    Parameters: [blockId: BlockId, contractAddress: string];
    ReturnType: unknown;
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
      request: unknown[],
      simulationFlags: SimulationFlag[],
      blockId: BlockId,
    ];
    ReturnType: FeeEstimate[];
  },
  {
    Method: 'starknet_estimateMessageFee';
    Parameters: [message: unknown, blockId: BlockId];
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
    ReturnType: {
      events: unknown[];
      continuation_token?: string;
    };
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
    ReturnType: unknown;
  },

  // ============================================================================
  // Write Methods (starknet_write_api.json)
  // ============================================================================

  {
    Method: 'starknet_addInvokeTransaction';
    Parameters: [invokeTransaction: unknown];
    ReturnType: { transaction_hash: string };
  },
  {
    Method: 'starknet_addDeclareTransaction';
    Parameters: [declareTransaction: unknown];
    ReturnType: { transaction_hash: string; class_hash: string };
  },
  {
    Method: 'starknet_addDeployAccountTransaction';
    Parameters: [deployAccountTransaction: unknown];
    ReturnType: { transaction_hash: string; contract_address: string };
  },

  // ============================================================================
  // Trace Methods (starknet_trace_api_openrpc.json)
  // ============================================================================

  {
    Method: 'starknet_traceTransaction';
    Parameters: [transactionHash: string];
    ReturnType: unknown;
  },
  {
    Method: 'starknet_simulateTransactions';
    Parameters: [
      blockId: BlockId,
      transactions: unknown[],
      simulationFlags: SimulationFlag[],
    ];
    ReturnType: unknown[];
  },
  {
    Method: 'starknet_traceBlockTransactions';
    Parameters: [blockId: BlockId];
    ReturnType: unknown[];
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
