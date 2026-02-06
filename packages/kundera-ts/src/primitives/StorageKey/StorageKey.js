import { from } from './from.js';
import { fromHex } from './fromHex.js';

/**
 * StorageKey namespace with constructor
 * @type {import('./from.js').from & {
 *   from: typeof from,
 *   fromHex: typeof fromHex
 * }}
 */
export const StorageKey = Object.assign(from, {
  from,
  fromHex,
});
