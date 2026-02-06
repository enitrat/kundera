import {
  hexToFelt,
  hexToAddress,
  hexToClassHash,
  feltToHex,
  addressToHex,
  classHashToHex,
} from './helpers.js';

/**
 * @param {import('../types.js').StateDiff} rpc
 * @returns {import('../rich.js').RichStateDiff}
 */
export function stateDiffFromRpc(rpc) {
  return {
    storage_diffs: rpc.storage_diffs.map((d) => ({
      address: hexToAddress(d.address),
      storage_entries: d.storage_entries.map((e) => ({
        key: hexToFelt(e.key),
        value: hexToFelt(e.value),
      })),
    })),
    declared_classes: rpc.declared_classes.map((d) => ({
      class_hash: hexToClassHash(d.class_hash),
      compiled_class_hash: hexToClassHash(d.compiled_class_hash),
    })),
    deployed_contracts: rpc.deployed_contracts.map((d) => ({
      address: hexToAddress(d.address),
      class_hash: hexToClassHash(d.class_hash),
    })),
    replaced_classes: rpc.replaced_classes.map((d) => ({
      contract_address: hexToAddress(d.contract_address),
      class_hash: hexToClassHash(d.class_hash),
    })),
    nonces: rpc.nonces.map((d) => ({
      contract_address: hexToAddress(d.contract_address),
      nonce: hexToFelt(d.nonce),
    })),
  };
}

/**
 * @param {import('../rich.js').RichStateDiff} rich
 * @returns {import('../types.js').StateDiff}
 */
export function stateDiffToRpc(rich) {
  return {
    storage_diffs: rich.storage_diffs.map((d) => ({
      address: addressToHex(d.address),
      storage_entries: d.storage_entries.map((e) => ({
        key: feltToHex(e.key),
        value: feltToHex(e.value),
      })),
    })),
    declared_classes: rich.declared_classes.map((d) => ({
      class_hash: classHashToHex(d.class_hash),
      compiled_class_hash: classHashToHex(d.compiled_class_hash),
    })),
    deployed_contracts: rich.deployed_contracts.map((d) => ({
      address: addressToHex(d.address),
      class_hash: classHashToHex(d.class_hash),
    })),
    replaced_classes: rich.replaced_classes.map((d) => ({
      contract_address: addressToHex(d.contract_address),
      class_hash: classHashToHex(d.class_hash),
    })),
    nonces: rich.nonces.map((d) => ({
      contract_address: addressToHex(d.contract_address),
      nonce: feltToHex(d.nonce),
    })),
  };
}

/**
 * @param {import('../types.js').StateUpdate} rpc
 * @returns {import('../rich.js').RichStateUpdate}
 */
export function stateUpdateFromRpc(rpc) {
  return {
    block_hash: hexToFelt(rpc.block_hash),
    old_root: hexToFelt(rpc.old_root),
    new_root: hexToFelt(rpc.new_root),
    state_diff: stateDiffFromRpc(rpc.state_diff),
  };
}

/**
 * @param {import('../rich.js').RichStateUpdate} rich
 * @returns {import('../types.js').StateUpdate}
 */
export function stateUpdateToRpc(rich) {
  return {
    block_hash: feltToHex(rich.block_hash),
    old_root: feltToHex(rich.old_root),
    new_root: feltToHex(rich.new_root),
    state_diff: stateDiffToRpc(rich.state_diff),
  };
}
