import {
  hexToFelt,
  hexToFelts,
  hexToAddress,
  feltToHex,
  feltsToHex,
  addressToHex,
} from './helpers.js';

/**
 * @param {import('../types.js').Event} rpc
 * @returns {import('../rich.js').RichEvent}
 */
export function eventFromRpc(rpc) {
  return {
    from_address: hexToAddress(rpc.from_address),
    keys: hexToFelts(rpc.keys),
    data: hexToFelts(rpc.data),
  };
}

/**
 * @param {import('../rich.js').RichEvent} rich
 * @returns {import('../types.js').Event}
 */
export function eventToRpc(rich) {
  return {
    from_address: addressToHex(rich.from_address),
    keys: feltsToHex(rich.keys),
    data: feltsToHex(rich.data),
  };
}

/**
 * @param {import('../types.js').EmittedEvent} rpc
 * @returns {import('../rich.js').RichEmittedEvent}
 */
export function emittedEventFromRpc(rpc) {
  return {
    ...eventFromRpc(rpc),
    block_hash: hexToFelt(rpc.block_hash),
    block_number: rpc.block_number,
    transaction_hash: hexToFelt(rpc.transaction_hash),
  };
}

/**
 * @param {import('../rich.js').RichEmittedEvent} rich
 * @returns {import('../types.js').EmittedEvent}
 */
export function emittedEventToRpc(rich) {
  return {
    ...eventToRpc(rich),
    block_hash: feltToHex(rich.block_hash),
    block_number: rich.block_number,
    transaction_hash: feltToHex(rich.transaction_hash),
  };
}
