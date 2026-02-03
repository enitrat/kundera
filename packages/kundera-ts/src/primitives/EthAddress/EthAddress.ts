import { from } from './from.js';
import { isValid } from './isValid.js';
import { MAX_ETH_ADDRESS } from './constants.js';

export const EthAddress = Object.assign(from, {
  from,
  isValid,
  MAX: MAX_ETH_ADDRESS,
});
