import { from } from './from.js';
import { fromHex } from './fromHex.js';

/**
 * ClassHash namespace with constructor
 * @type {import('./from.js').from & {
 *   from: typeof from,
 *   fromHex: typeof fromHex
 * }}
 */
export const ClassHash = Object.assign(from, {
  from,
  fromHex,
});
