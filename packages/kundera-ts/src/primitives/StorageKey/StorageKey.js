import { from } from './from.js';

/**
 * StorageKey namespace with constructor
 * @type {import('./from.js').from & {
 *   from: typeof from
 * }}
 */
export const StorageKey = Object.assign(from, {
  from,
});
