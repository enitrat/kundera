import {
  hexToFelt,
  hexToFelts,
  hexToAddress,
  hexToClassHash,
  feltToHex,
  feltsToHex,
  addressToHex,
  classHashToHex,
  resourceBoundsMappingFromRpc,
  resourceBoundsMappingToRpc,
} from './helpers.js';

/**
 * @param {import('../types.js').TxnWithHash} rpc
 * @returns {import('../rich.js').RichTxnWithHash}
 */
export function transactionFromRpc(rpc) {
  const base = txnFromRpc(rpc);
  return /** @type {any} */ ({
    ...base,
    transaction_hash: hexToFelt(rpc.transaction_hash),
  });
}

/**
 * @param {import('../rich.js').RichTxnWithHash} rich
 * @returns {import('../types.js').TxnWithHash}
 */
export function transactionToRpc(rich) {
  const base = txnToRpc(rich);
  return /** @type {any} */ ({
    ...base,
    transaction_hash: feltToHex(rich.transaction_hash),
  });
}

/**
 * @param {import('../types.js').Txn} rpc
 * @returns {import('../rich.js').RichTxn}
 */
export function txnFromRpc(rpc) {
  switch (rpc.type) {
    case 'INVOKE':
      return invokeFromRpc(/** @type {import('../types.js').InvokeTxn} */ (rpc));
    case 'L1_HANDLER':
      return l1HandlerFromRpc(/** @type {import('../types.js').L1HandlerTxn} */ (rpc));
    case 'DECLARE':
      return declareFromRpc(/** @type {import('../types.js').DeclareTxn} */ (rpc));
    case 'DEPLOY_ACCOUNT':
      return deployAccountFromRpc(/** @type {import('../types.js').DeployAccountTxn} */ (rpc));
    default:
      throw new Error(`Unknown transaction type: ${/** @type {any} */ (rpc).type}`);
  }
}

/**
 * @param {import('../rich.js').RichTxn} rich
 * @returns {import('../types.js').Txn}
 */
export function txnToRpc(rich) {
  switch (rich.type) {
    case 'INVOKE':
      return invokeToRpc(/** @type {import('../rich.js').RichInvokeTxn} */ (rich));
    case 'L1_HANDLER':
      return l1HandlerToRpc(/** @type {import('../rich.js').RichL1HandlerTxn} */ (rich));
    case 'DECLARE':
      return declareToRpc(/** @type {import('../rich.js').RichDeclareTxn} */ (rich));
    case 'DEPLOY_ACCOUNT':
      return deployAccountToRpc(/** @type {import('../rich.js').RichDeployAccountTxn} */ (rich));
    default:
      throw new Error(`Unknown transaction type: ${/** @type {any} */ (rich).type}`);
  }
}

// ── Invoke ──

/**
 * @param {import('../types.js').InvokeTxn} rpc
 * @returns {import('../rich.js').RichInvokeTxn}
 */
function invokeFromRpc(rpc) {
  if (rpc.version === '0x0' || rpc.version === '0x100000000000000000000000000000000') {
    const v0 = /** @type {import('../types.js').InvokeTxnV0} */ (rpc);
    return {
      type: 'INVOKE',
      version: v0.version,
      max_fee: hexToFelt(v0.max_fee),
      signature: hexToFelts(v0.signature),
      contract_address: hexToAddress(v0.contract_address),
      entry_point_selector: hexToFelt(v0.entry_point_selector),
      calldata: hexToFelts(v0.calldata),
    };
  }
  if (rpc.version === '0x1' || rpc.version === '0x100000000000000000000000000000001') {
    const v1 = /** @type {import('../types.js').InvokeTxnV1} */ (rpc);
    return {
      type: 'INVOKE',
      version: v1.version,
      sender_address: hexToAddress(v1.sender_address),
      calldata: hexToFelts(v1.calldata),
      max_fee: hexToFelt(v1.max_fee),
      signature: hexToFelts(v1.signature),
      nonce: hexToFelt(v1.nonce),
    };
  }
  // V3
  const v3 = /** @type {import('../types.js').InvokeTxnV3} */ (rpc);
  return {
    type: 'INVOKE',
    version: v3.version,
    sender_address: hexToAddress(v3.sender_address),
    calldata: hexToFelts(v3.calldata),
    signature: hexToFelts(v3.signature),
    nonce: hexToFelt(v3.nonce),
    resource_bounds: resourceBoundsMappingFromRpc(v3.resource_bounds),
    tip: hexToFelt(v3.tip),
    paymaster_data: hexToFelts(v3.paymaster_data),
    account_deployment_data: hexToFelts(v3.account_deployment_data),
    nonce_data_availability_mode: v3.nonce_data_availability_mode,
    fee_data_availability_mode: v3.fee_data_availability_mode,
  };
}

/**
 * @param {import('../rich.js').RichInvokeTxn} rich
 * @returns {import('../types.js').InvokeTxn}
 */
function invokeToRpc(rich) {
  if (rich.version === '0x0' || rich.version === '0x100000000000000000000000000000000') {
    const v0 = /** @type {import('../rich.js').RichInvokeTxnV0} */ (rich);
    return {
      type: 'INVOKE',
      version: v0.version,
      max_fee: feltToHex(v0.max_fee),
      signature: feltsToHex(v0.signature),
      contract_address: addressToHex(v0.contract_address),
      entry_point_selector: feltToHex(v0.entry_point_selector),
      calldata: feltsToHex(v0.calldata),
    };
  }
  if (rich.version === '0x1' || rich.version === '0x100000000000000000000000000000001') {
    const v1 = /** @type {import('../rich.js').RichInvokeTxnV1} */ (rich);
    return {
      type: 'INVOKE',
      version: v1.version,
      sender_address: addressToHex(v1.sender_address),
      calldata: feltsToHex(v1.calldata),
      max_fee: feltToHex(v1.max_fee),
      signature: feltsToHex(v1.signature),
      nonce: feltToHex(v1.nonce),
    };
  }
  const v3 = /** @type {import('../rich.js').RichInvokeTxnV3} */ (rich);
  return {
    type: 'INVOKE',
    version: v3.version,
    sender_address: addressToHex(v3.sender_address),
    calldata: feltsToHex(v3.calldata),
    signature: feltsToHex(v3.signature),
    nonce: feltToHex(v3.nonce),
    resource_bounds: resourceBoundsMappingToRpc(v3.resource_bounds),
    tip: feltToHex(v3.tip),
    paymaster_data: feltsToHex(v3.paymaster_data),
    account_deployment_data: feltsToHex(v3.account_deployment_data),
    nonce_data_availability_mode: v3.nonce_data_availability_mode,
    fee_data_availability_mode: v3.fee_data_availability_mode,
  };
}

// ── L1 Handler ──

/**
 * @param {import('../types.js').L1HandlerTxn} rpc
 * @returns {import('../rich.js').RichL1HandlerTxn}
 */
function l1HandlerFromRpc(rpc) {
  return {
    type: 'L1_HANDLER',
    version: rpc.version,
    nonce: hexToFelt(rpc.nonce),
    contract_address: hexToAddress(rpc.contract_address),
    entry_point_selector: hexToFelt(rpc.entry_point_selector),
    calldata: hexToFelts(rpc.calldata),
  };
}

/**
 * @param {import('../rich.js').RichL1HandlerTxn} rich
 * @returns {import('../types.js').L1HandlerTxn}
 */
function l1HandlerToRpc(rich) {
  return {
    type: 'L1_HANDLER',
    version: rich.version,
    nonce: feltToHex(rich.nonce),
    contract_address: addressToHex(rich.contract_address),
    entry_point_selector: feltToHex(rich.entry_point_selector),
    calldata: feltsToHex(rich.calldata),
  };
}

// ── Declare ──

/**
 * @param {import('../types.js').DeclareTxn} rpc
 * @returns {import('../rich.js').RichDeclareTxn}
 */
function declareFromRpc(rpc) {
  if (rpc.version === '0x0' || rpc.version === '0x100000000000000000000000000000000') {
    const v0 = /** @type {import('../types.js').DeclareTxnV0} */ (rpc);
    return {
      type: 'DECLARE',
      version: v0.version,
      sender_address: hexToAddress(v0.sender_address),
      max_fee: hexToFelt(v0.max_fee),
      signature: hexToFelts(v0.signature),
      class_hash: hexToClassHash(v0.class_hash),
    };
  }
  if (rpc.version === '0x1' || rpc.version === '0x100000000000000000000000000000001') {
    const v1 = /** @type {import('../types.js').DeclareTxnV1} */ (rpc);
    return {
      type: 'DECLARE',
      version: v1.version,
      sender_address: hexToAddress(v1.sender_address),
      max_fee: hexToFelt(v1.max_fee),
      signature: hexToFelts(v1.signature),
      nonce: hexToFelt(v1.nonce),
      class_hash: hexToClassHash(v1.class_hash),
    };
  }
  if (rpc.version === '0x2' || rpc.version === '0x100000000000000000000000000000002') {
    const v2 = /** @type {import('../types.js').DeclareTxnV2} */ (rpc);
    return {
      type: 'DECLARE',
      version: v2.version,
      sender_address: hexToAddress(v2.sender_address),
      compiled_class_hash: hexToClassHash(v2.compiled_class_hash),
      max_fee: hexToFelt(v2.max_fee),
      signature: hexToFelts(v2.signature),
      nonce: hexToFelt(v2.nonce),
      class_hash: hexToClassHash(v2.class_hash),
    };
  }
  // V3
  const v3 = /** @type {import('../types.js').DeclareTxnV3} */ (rpc);
  return {
    type: 'DECLARE',
    version: v3.version,
    sender_address: hexToAddress(v3.sender_address),
    compiled_class_hash: hexToClassHash(v3.compiled_class_hash),
    signature: hexToFelts(v3.signature),
    nonce: hexToFelt(v3.nonce),
    class_hash: hexToClassHash(v3.class_hash),
    resource_bounds: resourceBoundsMappingFromRpc(v3.resource_bounds),
    tip: hexToFelt(v3.tip),
    paymaster_data: hexToFelts(v3.paymaster_data),
    account_deployment_data: hexToFelts(v3.account_deployment_data),
    nonce_data_availability_mode: v3.nonce_data_availability_mode,
    fee_data_availability_mode: v3.fee_data_availability_mode,
  };
}

/**
 * @param {import('../rich.js').RichDeclareTxn} rich
 * @returns {import('../types.js').DeclareTxn}
 */
function declareToRpc(rich) {
  if (rich.version === '0x0' || rich.version === '0x100000000000000000000000000000000') {
    const v0 = /** @type {import('../rich.js').RichDeclareTxnV0} */ (rich);
    return {
      type: 'DECLARE',
      version: v0.version,
      sender_address: addressToHex(v0.sender_address),
      max_fee: feltToHex(v0.max_fee),
      signature: feltsToHex(v0.signature),
      class_hash: classHashToHex(v0.class_hash),
    };
  }
  if (rich.version === '0x1' || rich.version === '0x100000000000000000000000000000001') {
    const v1 = /** @type {import('../rich.js').RichDeclareTxnV1} */ (rich);
    return {
      type: 'DECLARE',
      version: v1.version,
      sender_address: addressToHex(v1.sender_address),
      max_fee: feltToHex(v1.max_fee),
      signature: feltsToHex(v1.signature),
      nonce: feltToHex(v1.nonce),
      class_hash: classHashToHex(v1.class_hash),
    };
  }
  if (rich.version === '0x2' || rich.version === '0x100000000000000000000000000000002') {
    const v2 = /** @type {import('../rich.js').RichDeclareTxnV2} */ (rich);
    return {
      type: 'DECLARE',
      version: v2.version,
      sender_address: addressToHex(v2.sender_address),
      compiled_class_hash: classHashToHex(v2.compiled_class_hash),
      max_fee: feltToHex(v2.max_fee),
      signature: feltsToHex(v2.signature),
      nonce: feltToHex(v2.nonce),
      class_hash: classHashToHex(v2.class_hash),
    };
  }
  const v3 = /** @type {import('../rich.js').RichDeclareTxnV3} */ (rich);
  return {
    type: 'DECLARE',
    version: v3.version,
    sender_address: addressToHex(v3.sender_address),
    compiled_class_hash: classHashToHex(v3.compiled_class_hash),
    signature: feltsToHex(v3.signature),
    nonce: feltToHex(v3.nonce),
    class_hash: classHashToHex(v3.class_hash),
    resource_bounds: resourceBoundsMappingToRpc(v3.resource_bounds),
    tip: feltToHex(v3.tip),
    paymaster_data: feltsToHex(v3.paymaster_data),
    account_deployment_data: feltsToHex(v3.account_deployment_data),
    nonce_data_availability_mode: v3.nonce_data_availability_mode,
    fee_data_availability_mode: v3.fee_data_availability_mode,
  };
}

// ── Deploy Account ──

/**
 * @param {import('../types.js').DeployAccountTxn} rpc
 * @returns {import('../rich.js').RichDeployAccountTxn}
 */
function deployAccountFromRpc(rpc) {
  if (rpc.version === '0x1' || rpc.version === '0x100000000000000000000000000000001') {
    const v1 = /** @type {import('../types.js').DeployAccountTxnV1} */ (rpc);
    return {
      type: 'DEPLOY_ACCOUNT',
      version: v1.version,
      max_fee: hexToFelt(v1.max_fee),
      signature: hexToFelts(v1.signature),
      nonce: hexToFelt(v1.nonce),
      contract_address_salt: hexToFelt(v1.contract_address_salt),
      constructor_calldata: hexToFelts(v1.constructor_calldata),
      class_hash: hexToClassHash(v1.class_hash),
    };
  }
  // V3
  const v3 = /** @type {import('../types.js').DeployAccountTxnV3} */ (rpc);
  return {
    type: 'DEPLOY_ACCOUNT',
    version: v3.version,
    signature: hexToFelts(v3.signature),
    nonce: hexToFelt(v3.nonce),
    contract_address_salt: hexToFelt(v3.contract_address_salt),
    constructor_calldata: hexToFelts(v3.constructor_calldata),
    class_hash: hexToClassHash(v3.class_hash),
    resource_bounds: resourceBoundsMappingFromRpc(v3.resource_bounds),
    tip: hexToFelt(v3.tip),
    paymaster_data: hexToFelts(v3.paymaster_data),
    nonce_data_availability_mode: v3.nonce_data_availability_mode,
    fee_data_availability_mode: v3.fee_data_availability_mode,
  };
}

/**
 * @param {import('../rich.js').RichDeployAccountTxn} rich
 * @returns {import('../types.js').DeployAccountTxn}
 */
function deployAccountToRpc(rich) {
  if (rich.version === '0x1' || rich.version === '0x100000000000000000000000000000001') {
    const v1 = /** @type {import('../rich.js').RichDeployAccountTxnV1} */ (rich);
    return {
      type: 'DEPLOY_ACCOUNT',
      version: v1.version,
      max_fee: feltToHex(v1.max_fee),
      signature: feltsToHex(v1.signature),
      nonce: feltToHex(v1.nonce),
      contract_address_salt: feltToHex(v1.contract_address_salt),
      constructor_calldata: feltsToHex(v1.constructor_calldata),
      class_hash: classHashToHex(v1.class_hash),
    };
  }
  const v3 = /** @type {import('../rich.js').RichDeployAccountTxnV3} */ (rich);
  return {
    type: 'DEPLOY_ACCOUNT',
    version: v3.version,
    signature: feltsToHex(v3.signature),
    nonce: feltToHex(v3.nonce),
    contract_address_salt: feltToHex(v3.contract_address_salt),
    constructor_calldata: feltsToHex(v3.constructor_calldata),
    class_hash: classHashToHex(v3.class_hash),
    resource_bounds: resourceBoundsMappingToRpc(v3.resource_bounds),
    tip: feltToHex(v3.tip),
    paymaster_data: feltsToHex(v3.paymaster_data),
    nonce_data_availability_mode: v3.nonce_data_availability_mode,
    fee_data_availability_mode: v3.fee_data_availability_mode,
  };
}
