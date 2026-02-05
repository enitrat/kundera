import { from } from './from.js';

/**
 * ClassHash namespace with constructor
 * @type {import('./from.js').from & {
 *   from: typeof from
 * }}
 */
export const ClassHash = Object.assign(from, {
  from,
});
