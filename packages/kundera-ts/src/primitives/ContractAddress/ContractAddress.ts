import { from } from './from.js';
import { isValid } from './isValid.js';
import { MAX_CONTRACT_ADDRESS } from './constants.js';

export const ContractAddress = Object.assign(from, {
  from,
  isValid,
  MAX: MAX_CONTRACT_ADDRESS,
});
