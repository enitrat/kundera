import { fromHex as feltFromHex } from '../../primitives/Felt252/fromHex.js';
import { fromHex as addressFromHex } from '../../primitives/ContractAddress/fromHex.js';
import { fromHex as classHashFromHex } from '../../primitives/ClassHash/fromHex.js';

/**
 * Wire hex → Felt252Type
 * @param {string} hex
 * @returns {import('../../primitives/Felt252/types.js').Felt252Type}
 */
export function hexToFelt(hex) {
  return feltFromHex(hex);
}

/**
 * Wire hex → ContractAddressType
 * @param {string} hex
 * @returns {import('../../primitives/ContractAddress/types.js').ContractAddressType}
 */
export function hexToAddress(hex) {
  return addressFromHex(hex);
}

/**
 * Wire hex → ClassHashType
 * @param {string} hex
 * @returns {import('../../primitives/ClassHash/types.js').ClassHashType}
 */
export function hexToClassHash(hex) {
  return classHashFromHex(hex);
}

/**
 * Wire hex[] → Felt252Type[]
 * @param {string[]} hexArray
 * @returns {import('../../primitives/Felt252/types.js').Felt252Type[]}
 */
export function hexToFelts(hexArray) {
  return hexArray.map(feltFromHex);
}

/**
 * Felt252Type → wire hex
 * @param {import('../../primitives/Felt252/types.js').Felt252Type} felt
 * @returns {string}
 */
export function feltToHex(felt) {
  return felt.toHex();
}

/**
 * ContractAddressType → wire hex
 * @param {import('../../primitives/ContractAddress/types.js').ContractAddressType} address
 * @returns {string}
 */
export function addressToHex(address) {
  return address.toHex();
}

/**
 * ClassHashType → wire hex
 * @param {import('../../primitives/ClassHash/types.js').ClassHashType} hash
 * @returns {string}
 */
export function classHashToHex(hash) {
  return hash.toHex();
}

/**
 * Felt252Type[] → wire hex[]
 * @param {import('../../primitives/Felt252/types.js').Felt252Type[]} felts
 * @returns {string[]}
 */
export function feltsToHex(felts) {
  return felts.map((f) => f.toHex());
}

/**
 * Convert ResourcePrice wire → rich
 * @param {import('../types.js').ResourcePrice} rpc
 * @returns {import('../rich.js').RichResourcePrice}
 */
export function resourcePriceFromRpc(rpc) {
  return {
    price_in_fri: hexToFelt(rpc.price_in_fri),
    price_in_wei: hexToFelt(rpc.price_in_wei),
  };
}

/**
 * Convert ResourcePrice rich → wire
 * @param {import('../rich.js').RichResourcePrice} rich
 * @returns {import('../types.js').ResourcePrice}
 */
export function resourcePriceToRpc(rich) {
  return {
    price_in_fri: feltToHex(rich.price_in_fri),
    price_in_wei: feltToHex(rich.price_in_wei),
  };
}

/**
 * Convert ResourceBounds wire → rich
 * @param {import('../types.js').ResourceBounds} rpc
 * @returns {import('../rich.js').RichResourceBounds}
 */
export function resourceBoundsFromRpc(rpc) {
  return {
    max_amount: hexToFelt(rpc.max_amount),
    max_price_per_unit: hexToFelt(rpc.max_price_per_unit),
  };
}

/**
 * Convert ResourceBounds rich → wire
 * @param {import('../rich.js').RichResourceBounds} rich
 * @returns {import('../types.js').ResourceBounds}
 */
export function resourceBoundsToRpc(rich) {
  return {
    max_amount: feltToHex(rich.max_amount),
    max_price_per_unit: feltToHex(rich.max_price_per_unit),
  };
}

/**
 * Convert ResourceBoundsMapping wire → rich
 * @param {import('../types.js').ResourceBoundsMapping} rpc
 * @returns {import('../rich.js').RichResourceBoundsMapping}
 */
export function resourceBoundsMappingFromRpc(rpc) {
  return {
    l1_gas: resourceBoundsFromRpc(rpc.l1_gas),
    l2_gas: resourceBoundsFromRpc(rpc.l2_gas),
  };
}

/**
 * Convert ResourceBoundsMapping rich → wire
 * @param {import('../rich.js').RichResourceBoundsMapping} rich
 * @returns {import('../types.js').ResourceBoundsMapping}
 */
export function resourceBoundsMappingToRpc(rich) {
  return {
    l1_gas: resourceBoundsToRpc(rich.l1_gas),
    l2_gas: resourceBoundsToRpc(rich.l2_gas),
  };
}

/**
 * Convert FeePayment wire → rich
 * @param {import('../types.js').FeePayment} rpc
 * @returns {import('../rich.js').RichFeePayment}
 */
export function feePaymentFromRpc(rpc) {
  return {
    amount: hexToFelt(rpc.amount),
    unit: rpc.unit,
  };
}

/**
 * Convert FeePayment rich → wire
 * @param {import('../rich.js').RichFeePayment} rich
 * @returns {import('../types.js').FeePayment}
 */
export function feePaymentToRpc(rich) {
  return {
    amount: feltToHex(rich.amount),
    unit: rich.unit,
  };
}
