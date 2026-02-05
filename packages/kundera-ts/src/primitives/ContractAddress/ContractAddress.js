import { from } from './from.js';
import { isValid } from './isValid.js';
import { MAX_CONTRACT_ADDRESS } from './constants.js';

/**
 * ContractAddress namespace with constructor and utilities
 * @type {import('./from.js').from & {
 *   from: typeof from,
 *   isValid: typeof isValid,
 *   MAX: bigint
 * }}
 */
export const ContractAddress = Object.assign(from, {
  from,
  isValid,
  MAX: MAX_CONTRACT_ADDRESS,
});
