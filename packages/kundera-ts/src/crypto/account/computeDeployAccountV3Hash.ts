/**
 * Compute Deploy Account V3 Hash
 *
 * Poseidon-based hash computation for DEPLOY_ACCOUNT_V3 transactions.
 */

import { Felt252, type Felt252Type, type Felt252Input } from '../../primitives/index.js';
import { poseidonHashMany } from '../hash.js';
import { TRANSACTION_HASH_PREFIX, type DeployAccountTransactionV3 } from '../account-types.js';
import { hashTipAndResourceBounds } from './hashTipAndResourceBounds.js';
import { encodeDAModes } from './encodeDAModes.js';
import { hashCalldata } from './hashCalldata.js';

/**
 * Compute transaction hash for DEPLOY_ACCOUNT_V3
 *
 * Hash structure (Poseidon) per starknet-specs v0.10.0:
 * [
 *   "deploy_account" prefix,
 *   version,
 *   contract_address (computed from class_hash, salt, constructor_calldata),
 *   h(tip, l1_gas_bounds, l2_gas_bounds),  // Note: L1_DATA omitted per starknet.js v6
 *   h(paymaster_data),
 *   chain_id,
 *   nonce,
 *   da_modes,
 *   h(constructor_calldata),
 *   class_hash,
 *   contract_address_salt
 * ]
 */
export function computeDeployAccountV3Hash(
  tx: DeployAccountTransactionV3,
  contractAddress: Felt252Input,
  chainId: Felt252Input
): Felt252Type {
  const tipAndResourceBoundsHash = hashTipAndResourceBounds(tx.tip, tx.resource_bounds);
  const paymasterDataHash = hashCalldata(tx.paymaster_data);
  const constructorCalldataHash = hashCalldata(tx.constructor_calldata);
  const daModes = encodeDAModes(
    tx.nonce_data_availability_mode,
    tx.fee_data_availability_mode
  );

  const elements: Felt252Input[] = [
    TRANSACTION_HASH_PREFIX.DEPLOY_ACCOUNT,
    BigInt(tx.version),
    contractAddress,
    tipAndResourceBoundsHash,
    paymasterDataHash,
    chainId,
    tx.nonce,
    daModes,
    constructorCalldataHash,
    tx.class_hash,
    tx.contract_address_salt,
  ];

  return poseidonHashMany(elements.map((e) => Felt252(e)));
}
